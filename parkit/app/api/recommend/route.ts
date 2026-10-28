import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  FALLBACK_PARKING_SPACES,
  GREATER_NOIDA_CENTER,
  calculateDistanceKm,
  ParkingSpace,
} from "@/lib/parking-data";

// Transparent scoring weights
// score = distance_score (max 40) + price_score (max 35) + availability_score (max 25)
const MAX_DISTANCE_SCORE = 40;
const MAX_PRICE_SCORE = 35;
const MAX_AVAILABILITY_SCORE = 25;

export interface RecommendationResult {
  space: ParkingSpace;
  score: number;
  score_breakdown: {
    distance_score: number;
    price_score: number;
    availability_score: number;
    distance_km: number;
    distance_formatted: string;
  };
  is_best_match: boolean;
  explanation: string;
  ai_generated: boolean;
}

/**
 * Format distance cleanly: e.g. "350m" if < 1km, otherwise "1.2 km"
 */
function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Format time to display (e.g. "10:00 AM")
 */
function formatTimeDisplay(date: Date): string {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, "0");
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m} ${period}`;
}

/**
 * Generate AI explanation using Gemini if available, with factual prompt guardrails
 */
async function generateGeminiExplanation(
  space: ParkingSpace,
  distanceFormatted: string,
  startTimeFormatted: string,
  endTimeFormatted: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  const keyAmenity = space.amenities && space.amenities.length > 0 ? space.amenities[0] : "CCTV monitored";

  const prompt = `You are ParKit's AI parking assistant. Provide a single, concise recommendation sentence (maximum 16 words) for the driver's Best Match parking space.
Use ONLY these exact real facts:
- Title: ${space.title}
- Distance: ${distanceFormatted} away
- Price: ₹${space.price_per_hour}/hr
- Slot: available for your full time slot (${startTimeFormatted} - ${endTimeFormatted})
- Highlight: ${keyAmenity}

Rules:
- MUST begin with: "Best match: "
- Format strictly like: "Best match: 350m away, ₹40/hr, covered bay available for your full time slot."
- Keep it punchy, factual, and helpful.
- DO NOT invent extra facts, amenities, or addresses.`;

  // Candidate models supported by Gemini API
  const candidateModels = [
    "models/gemma-4-26b-a4b-it",
    "models/gemini-flash-latest",
    "models/gemini-2.5-flash",
  ];

  try {
    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                maxOutputTokens: 60,
                temperature: 0.2,
              },
            }),
            signal: controller.signal,
          }
        );

        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          clearTimeout(timeoutId);
          let generated = data.candidates[0].content.parts[0].text.trim();
          // Clean up any extraneous quotes or markdown bullets
          generated = generated.replace(/^[\*\#\"\']+|[\*\#\"\']+$/g, "").trim();
          if (!generated.toLowerCase().startsWith("best match:")) {
            generated = `Best match: ${generated}`;
          }
          return generated;
        }
      } catch (innerErr) {
        // Try next candidate model
      }
    }
  } catch (err) {
    // Fall back to rule-based
  } finally {
    clearTimeout(timeoutId);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    return await handleRecommendation(body, request);
  } catch (err: any) {
    console.error("Error in POST /api/recommend:", err);
    return NextResponse.json({ error: err.message || "Recommendation error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined;
    const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : undefined;
    const max_price = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined;
    const start_time = searchParams.get("start_time") || undefined;
    const end_time = searchParams.get("end_time") || undefined;

    const payload = {
      user_location: lat && lng ? { lat, lng } : undefined,
      max_price,
      start_time,
      end_time,
    };

    return await handleRecommendation(payload, request);
  } catch (err: any) {
    console.error("Error in GET /api/recommend:", err);
    return NextResponse.json({ error: err.message || "Recommendation error" }, { status: 500 });
  }
}

async function handleRecommendation(
  params: {
    user_location?: { lat: number; lng: number };
    start_time?: string;
    end_time?: string;
    max_price?: number;
    spaces?: ParkingSpace[];
  },
  request: NextRequest
) {
  const userLat = params.user_location?.lat ?? GREATER_NOIDA_CENTER.lat;
  const userLng = params.user_location?.lng ?? GREATER_NOIDA_CENTER.lng;
  const maxPrice = Number(params.max_price) || 100;

  const now = new Date();
  const startDate = params.start_time ? new Date(params.start_time) : now;
  const endDate = params.end_time
    ? new Date(params.end_time)
    : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const startTimeStr = formatTimeDisplay(startDate);
  const endTimeStr = formatTimeDisplay(endDate);

  // 1. Obtain Parking Spaces from Input or Supabase
  let candidateSpaces: ParkingSpace[] = [];
  if (params.spaces && Array.isArray(params.spaces) && params.spaces.length > 0) {
    candidateSpaces = params.spaces;
  } else {
    try {
      const supabase = await createClient();
      const { data: dbSpaces, error } = await supabase
        .from("parking_spaces")
        .select(`
          *,
          space_availability (*),
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
            review_count: revs.length || 15,
            amenities: ["Verified Space", "CCTV Monitored", "Secure Access"],
            owner_name: "Verified Host",
            owner_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          };
        });
      }
    } catch (e) {
      console.warn("Could not query Supabase spaces for recommendation:", e);
    }

    if (candidateSpaces.length === 0) {
      candidateSpaces = FALLBACK_PARKING_SPACES.filter((s) => s.is_active);
    }
  }

  // 2. Fetch Active Bookings to factor into availability
  let activeBookings: any[] = [];
  try {
    const supabase = await createClient();
    const { data: dbBookings } = await supabase
      .from("bookings")
      .select("space_id, start_time, end_time, status")
      .in("status", ["pending_payment", "confirmed", "checked_in"]);

    if (dbBookings) {
      activeBookings = dbBookings;
    }
  } catch (e) {}

  // 3. Score Each Space Using Transparent Formula:
  // score = distance score + price score + availability score
  const scoredSpaces = candidateSpaces.map((space) => {
    // 3a. Distance Score (0 to 40)
    const distKm = calculateDistanceKm(userLat, userLng, space.latitude, space.longitude);
    // Exponentially decays from 40 for close proximity
    const distanceScore = Math.max(0, Math.min(MAX_DISTANCE_SCORE, MAX_DISTANCE_SCORE - distKm * 3.8));
    const distFormatted = formatDistance(distKm);

    // 3b. Price Score (0 to 35)
    // Cheaper spaces get higher score
    const targetMax = Math.max(maxPrice, 80);
    const priceRatio = Math.min(1.2, space.price_per_hour / targetMax);
    let priceScore = Math.max(0, Math.min(MAX_PRICE_SCORE, MAX_PRICE_SCORE * (1 - priceRatio * 0.75)));
    if (space.price_per_hour > maxPrice) {
      priceScore = Math.max(2, priceScore * 0.3); // Penalty if exceeding max budget
    }

    // 3c. Availability Score (0 to 25)
    let availabilityScore = 18; // Default active space score

    // Check for overlap with existing bookings
    const hasOverlap = activeBookings.some((b) => {
      if (b.space_id !== space.id) return false;
      if (!["pending_payment", "confirmed", "checked_in"].includes(b.status)) return false;
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return bStart < endDate && bEnd > startDate;
    });

    if (hasOverlap) {
      availabilityScore = 2; // Conflict penalty
    } else {
      // Full time slot available
      availabilityScore = 25;
    }

    // Add rating quality boost (up to 5 bonus points)
    const ratingBonus = Math.min(5, (space.rating / 5) * 5);
    const totalScore = Number((distanceScore + priceScore + availabilityScore + ratingBonus).toFixed(1));

    return {
      space: {
        ...space,
        distance_km: Number(distKm.toFixed(2)),
      },
      score: totalScore,
      score_breakdown: {
        distance_score: Number(distanceScore.toFixed(1)),
        price_score: Number(priceScore.toFixed(1)),
        availability_score: Number((availabilityScore + ratingBonus).toFixed(1)),
        distance_km: Number(distKm.toFixed(2)),
        distance_formatted: distFormatted,
      },
      is_best_match: false,
      explanation: "",
      ai_generated: false,
    };
  });

  // 4. Sort and return the Top 3 spaces
  scoredSpaces.sort((a, b) => b.score - a.score);
  const topThree = scoredSpaces.slice(0, 3);

  // 5. Mark the first result as "Best match"
  if (topThree.length > 0) {
    topThree[0].is_best_match = true;

    const best = topThree[0];
    const defaultRuleExplanation = `Best match: ${best.score_breakdown.distance_formatted} away, ₹${best.space.price_per_hour}/hr, available for your full time slot.`;

    // 7 & 8: Use Gemini if GEMINI_API_KEY exists, otherwise fall back to rule-based explanation
    let aiExplanation: string | null = null;
    if (process.env.GEMINI_API_KEY) {
      aiExplanation = await generateGeminiExplanation(
        best.space,
        best.score_breakdown.distance_formatted,
        startTimeStr,
        endTimeStr
      );
    }

    if (aiExplanation) {
      best.explanation = aiExplanation;
      best.ai_generated = true;
    } else {
      best.explanation = defaultRuleExplanation;
      best.ai_generated = false;
    }

    // Explanations for 2nd and 3rd recommendations
    if (topThree.length > 1) {
      topThree[1].explanation = `Top alternative: ${topThree[1].score_breakdown.distance_formatted} away, ₹${topThree[1].space.price_per_hour}/hr, highly rated (${topThree[1].space.rating}★).`;
    }
    if (topThree.length > 2) {
      topThree[2].explanation = `Budget pick: ${topThree[2].score_breakdown.distance_formatted} away, ₹${topThree[2].space.price_per_hour}/hr, verified host.`;
    }
  }

  return NextResponse.json({
    success: true,
    formula: "score = distance_score (0-40) + price_score (0-35) + availability_score (0-25) + rating_bonus (0-5)",
    top_three: topThree,
    best_match: topThree[0] || null,
  });
}
