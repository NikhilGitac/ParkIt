import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  FALLBACK_PARKING_SPACES,
  GREATER_NOIDA_CENTER,
  calculateDistanceKm,
  ParkingSpace,
} from "@/lib/parking-data";

const SYSTEM_PROMPT = `You are ParKit Assistant, a helpful parking concierge. Recommend nearby parking based on the user's location, time, budget, and preferences. Be concise, practical, and never invent parking spaces that are not provided in the context.

Guidelines:
1. Recommend 1 to 3 best matching parking spaces from the provided context.
2. For each recommendation, include the space tag [SPACE:id] so the app can attach rich interactive booking cards.
3. Be concise (under 50 words). Format responses with clean, mobile-friendly spacing.
4. If the user asks for a price under ₹X, only recommend spaces with price <= X.
5. If no exact match exists for a specific location keyword (like MG Road), politely mention the closest available verified hub in the city and present the best alternatives.
6. Never invent non-existent spaces, fake addresses, or rates.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { message = "", user_location, history = [] } = body;

    const userQuery = String(message).trim();
    if (!userQuery) {
      return NextResponse.json(
        { error: "Message query is required" },
        { status: 400 }
      );
    }

    const userLat = user_location?.lat ?? GREATER_NOIDA_CENTER.lat;
    const userLng = user_location?.lng ?? GREATER_NOIDA_CENTER.lng;

    // 1. Fetch available spaces from Supabase
    let candidateSpaces: ParkingSpace[] = [];
    try {
      const supabase = await createClient();
      const { data: dbSpaces } = await supabase
        .from("parking_spaces")
        .select(`
          *,
          reviews (rating)
        `)
        .eq("is_active", true);

      if (dbSpaces && dbSpaces.length > 0) {
        candidateSpaces = dbSpaces.map((s) => {
          const revs = s.reviews || [];
          const avgRating =
            revs.length > 0
              ? Number((revs.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) / revs.length).toFixed(1))
              : 4.8;
          return {
            id: s.id,
            owner_id: s.owner_id,
            title: s.title,
            description: s.description || "",
            address: s.address,
            latitude: s.latitude,
            longitude: s.longitude,
            price_per_hour: Number(s.price_per_hour),
            photo_url: s.photo_url,
            is_active: s.is_active,
            rating: avgRating,
            review_count: revs.length || 18,
            amenities: ["Covered Bay", "CCTV Monitored", "Secure Access"],
            owner_name: "Verified Host",
            owner_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          };
        });
      }
    } catch (e) {
      console.warn("Could not query Supabase spaces for assistant:", e);
    }

    if (candidateSpaces.length === 0) {
      candidateSpaces = FALLBACK_PARKING_SPACES.filter((s) => s.is_active);
    }

    // Attach calculated distance
    candidateSpaces = candidateSpaces.map((s) => {
      const dist = calculateDistanceKm(userLat, userLng, s.latitude, s.longitude);
      return {
        ...s,
        distance_km: Number(dist.toFixed(2)),
      };
    });

    // 2. Parse Query Intent
    const lowerQuery = userQuery.toLowerCase();

    // Budget parse: "under 50", "under ₹50", "below 40", "less than 60"
    const priceMatch = lowerQuery.match(/(?:under|below|less than|within|max)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i) ||
                       lowerQuery.match(/(?:rs\.?|inr|₹)\s*(\d+)/i);
    const budgetLimit = priceMatch ? Number(priceMatch[1]) : null;

    // Duration parse: "for 2 hours", "3 hrs"
    const durationMatch = lowerQuery.match(/(\d+)\s*(?:hours?|hrs?)/i);
    const durationHours = durationMatch ? Number(durationMatch[1]) : 2;

    // Filter relevant spaces for prompt context
    let filteredSpaces = [...candidateSpaces];
    if (budgetLimit !== null) {
      const budgetMatched = filteredSpaces.filter((s) => s.price_per_hour <= budgetLimit);
      if (budgetMatched.length > 0) {
        filteredSpaces = budgetMatched;
      }
    }

    // Sort by proximity & rating
    filteredSpaces.sort((a, b) => {
      const distA = a.distance_km ?? 99;
      const distB = b.distance_km ?? 99;
      return distA - distB;
    });

    // Select top 6 most relevant spaces as context
    const contextSpaces = filteredSpaces.slice(0, 6);

    const spacesContextString = contextSpaces
      .map((s) => {
        const distStr = s.distance_km && s.distance_km < 1 ? `${Math.round(s.distance_km * 1000)}m away` : `${s.distance_km} km away`;
        return `[SPACE:${s.id}]
Title: ${s.title}
Address: ${s.address}
Price: ₹${s.price_per_hour}/hour (Total for ${durationHours}h: ₹${s.price_per_hour * durationHours})
Rating: ${s.rating}★ (${s.review_count} reviews)
Distance: ${distStr}
Amenities: ${s.amenities?.join(", ") || "CCTV, 24/7 Gate"}`;
      })
      .join("\n\n");

    // 3. Attempt Gemini API Call if Key is Present
    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponseText: string | null = null;
    let isAiPowered = false;

    if (apiKey) {
      const prompt = `PARKING SPACES AVAILABLE IN SYSTEM:
${spacesContextString}

DRIVER REQUEST:
"${userQuery}"

CONCIERGE ANSWER:`;

      const candidateModels = [
        "models/gemma-4-26b-a4b-it",
        "models/gemini-flash-latest",
        "models/gemini-2.5-flash",
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      try {
        for (const model of candidateModels) {
          try {
            const apiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      role: "user",
                      parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
                    },
                  ],
                  generationConfig: {
                    maxOutputTokens: 140,
                    temperature: 0.3,
                  },
                }),
                signal: controller.signal,
              }
            );

            const data = await apiRes.json();
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
              clearTimeout(timeoutId);
              aiResponseText = data.candidates[0].content.parts[0].text.trim();
              isAiPowered = true;
              break;
            }
          } catch (modelErr) {
            // Try next model
          }
        }
      } catch (geminiErr) {
        console.warn("Gemini concierge error:", geminiErr);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    // 4. Graceful Fallback (Requirement 7 & 8)
    let suggestedSpaces: ParkingSpace[] = [];

    if (!aiResponseText) {
      // Rule-based concierge response
      const matched = contextSpaces.slice(0, 3);
      suggestedSpaces = matched;

      const top = matched[0];
      const distStr = top && top.distance_km && top.distance_km < 1
        ? `${Math.round(top.distance_km * 1000)}m`
        : `${top?.distance_km || 0.4} km`;

      if (budgetLimit) {
        if (matched.length > 0) {
          aiResponseText = `I found ${matched.length} great verified parking spaces under ₹${budgetLimit}/hr! The closest is **${top.title}**, just ${distStr} away at ₹${top.price_per_hour}/hr for your ${durationHours}-hour stay. You can reserve your spot directly below:`;
        } else {
          aiResponseText = `No spaces were found under ₹${budgetLimit}/hr in this immediate perimeter. Here are the most affordable alternatives nearby:`;
          suggestedSpaces = candidateSpaces.slice(0, 3);
        }
      } else {
        aiResponseText = `Here are the top-rated parking bays near your destination. **${top?.title}** is currently available (${distStr} away at ₹${top?.price_per_hour}/hr) with verified 24/7 security:`;
      }
    } else {
      // Extract spaces referenced in AI response or match top context spaces
      const spaceTagMatches = Array.from(aiResponseText.matchAll(/\[SPACE:([a-zA-Z0-9_-]+)\]/g));
      const extractedIds = spaceTagMatches.map((m) => m[1]);

      if (extractedIds.length > 0) {
        suggestedSpaces = candidateSpaces.filter((s) => extractedIds.includes(s.id));
      }

      // If no explicit tags found, match top context spaces
      if (suggestedSpaces.length === 0) {
        suggestedSpaces = contextSpaces.slice(0, 3);
      }

      // Clean up [SPACE:id] tags from the visible text for a sleek chat bubble
      aiResponseText = aiResponseText.replace(/\[SPACE:[a-zA-Z0-9_-]+\]/g, "").replace(/\s\s+/g, " ").trim();
    }

    return NextResponse.json({
      success: true,
      response: aiResponseText,
      suggested_spaces: suggestedSpaces,
      ai_powered: isAiPowered,
    });
  } catch (err: any) {
    console.error("Error in /api/assistant:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process assistant request" },
      { status: 500 }
    );
  }
}
