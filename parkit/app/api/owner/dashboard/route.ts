import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_PARKING_SPACES } from "@/lib/parking-data";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const requestedOwnerId = searchParams.get("owner_id");
    const forceDemo = searchParams.get("demo") === "true";

    let ownerId = requestedOwnerId;
    let ownerProfile: any = null;

    // 1. Check logged-in user unless demo requested
    if (!forceDemo && !ownerId) {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          ownerId = authUser.id;
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("id, full_name, role, avatar_url, phone")
            .eq("id", authUser.id)
            .maybeSingle();

          if (dbProfile) {
            ownerProfile = dbProfile;
          }
        }
      } catch (authErr: any) {
        if (
          authErr?.digest?.includes("DYNAMIC") ||
          authErr?.digest?.includes("BAILOUT") ||
          authErr?.digest?.includes("HANGING") ||
          authErr?.message?.includes("cookies")
        ) {
          throw authErr;
        }
        // Fall back to demo
      }
    }

    // Default to Rajesh Sharma (demo owner 1 from seed.sql)
    const DEFAULT_DEMO_OWNER_ID = "a0000000-0000-0000-0000-000000000001";
    if (!ownerId) {
      ownerId = DEFAULT_DEMO_OWNER_ID;
    }

    if (!ownerProfile) {
      if (ownerId === DEFAULT_DEMO_OWNER_ID) {
        ownerProfile = {
          id: DEFAULT_DEMO_OWNER_ID,
          full_name: "Rajesh Sharma",
          role: "owner",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          phone: "+91 98100 12001",
        };
      } else {
        // Look up owner in profiles
        const { data: p } = await supabase
          .from("profiles")
          .select("id, full_name, role, avatar_url, phone")
          .eq("id", ownerId)
          .maybeSingle();
        ownerProfile = p || {
          id: ownerId,
          full_name: "ParKit Space Host",
          role: "owner",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          phone: "+91 98100 12000",
        };
      }
    }

    // 2. Fetch Owner's Spaces from Supabase
    let spaces: any[] = [];
    try {
      const { data: dbSpaces, error: spacesErr } = await supabase
        .from("parking_spaces")
        .select(`
          id,
          owner_id,
          title,
          description,
          address,
          latitude,
          longitude,
          price_per_hour,
          photo_url,
          is_active,
          created_at,
          reviews (
            id,
            rating,
            comment
          )
        `)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });

      if (dbSpaces && dbSpaces.length > 0) {
        spaces = dbSpaces.map((s) => {
          const revs = s.reviews || [];
          const avgRating =
            revs.length > 0
              ? Number((revs.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / revs.length).toFixed(1))
              : 4.8;
          return {
            ...s,
            rating: avgRating,
            review_count: revs.length || 12,
          };
        });
      }
    } catch (e) {
      console.warn("Could not query Supabase parking spaces:", e);
    }

    // Fallback to FALLBACK_PARKING_SPACES matching owner_id if DB returned nothing
    if (spaces.length === 0) {
      const matchedFallbacks = FALLBACK_PARKING_SPACES.filter(
        (s) => s.owner_id === ownerId || (ownerId === DEFAULT_DEMO_OWNER_ID && s.owner_name === "Rajesh Sharma")
      );
      spaces = matchedFallbacks.map((s) => ({
        id: s.id,
        owner_id: s.owner_id,
        title: s.title,
        description: s.description,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        price_per_hour: s.price_per_hour,
        photo_url: s.photo_url,
        is_active: s.is_active,
        rating: s.rating,
        review_count: s.review_count,
      }));
    }

    const spaceIds = spaces.map((s) => s.id);

    // 3. Fetch Bookings for Owner's Spaces from Supabase
    let bookings: any[] = [];
    try {
      if (spaceIds.length > 0) {
        const { data: dbBookings } = await supabase
          .from("bookings")
          .select(`
            id,
            space_id,
            driver_id,
            start_time,
            end_time,
            total_price,
            status,
            payment_status,
            otp_code,
            created_at,
            parking_spaces:space_id (title, photo_url, address, price_per_hour),
            profiles:driver_id (full_name, phone, avatar_url)
          `)
          .in("space_id", spaceIds)
          .order("start_time", { ascending: false })
          .limit(20);

        if (dbBookings && dbBookings.length > 0) {
          bookings = dbBookings.map((b: any) => ({
            id: b.id,
            space_id: b.space_id,
            space_title: b.parking_spaces?.title || "Parking Space",
            space_photo: b.parking_spaces?.photo_url || spaces.find((s) => s.id === b.space_id)?.photo_url,
            driver_id: b.driver_id,
            driver_name: b.profiles?.full_name || "Demo Driver",
            driver_phone: b.profiles?.phone || "+91 99100 34001",
            driver_avatar: b.profiles?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
            start_time: b.start_time,
            end_time: b.end_time,
            total_price: Number(b.total_price),
            status: b.status,
            payment_status: b.payment_status,
            otp_code: b.otp_code,
            created_at: b.created_at,
          }));
        }
      }
    } catch (e) {
      console.warn("Could not query Supabase bookings:", e);
    }

    // Merge in-memory demo bookings from local storage/globalThis
    if (typeof globalThis.__PARKIT_DEMO_BOOKINGS !== "undefined") {
      for (const memBooking of globalThis.__PARKIT_DEMO_BOOKINGS) {
        if (spaceIds.includes(memBooking.space_id) && !bookings.some((b) => b.id === memBooking.id)) {
          const matchingSpace = spaces.find((s) => s.id === memBooking.space_id);
          bookings.unshift({
            id: memBooking.id,
            space_id: memBooking.space_id,
            space_title: matchingSpace?.title || "Parking Space",
            space_photo: matchingSpace?.photo_url,
            driver_id: memBooking.driver_id || "demo-driver",
            driver_name: "Rohan Malhotra",
            driver_phone: "+91 99100 34001",
            driver_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
            start_time: memBooking.start_time,
            end_time: memBooking.end_time,
            total_price: Number(memBooking.total_price),
            status: memBooking.status,
            payment_status: memBooking.payment_status,
            otp_code: memBooking.otp_code,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // If still no bookings for demo owner, provide realistic seed upcoming and past bookings
    if (bookings.length === 0 && ownerId === DEFAULT_DEMO_OWNER_ID) {
      const now = new Date();
      bookings = [
        {
          id: "bk-demo-001",
          space_id: spaces[0]?.id || "b0000000-0000-0000-0000-000000000001",
          space_title: spaces[0]?.title || "Pari Chowk Metro Plaza Covered Bay",
          space_photo: spaces[0]?.photo_url,
          driver_id: "d0000000-0000-0000-0000-000000000001",
          driver_name: "Rohan Malhotra",
          driver_phone: "+91 99100 34001",
          driver_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
          start_time: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 3.75 * 60 * 60 * 1000).toISOString(),
          total_price: 135,
          status: "confirmed",
          payment_status: "paid",
          otp_code: "582019",
          created_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
        },
        {
          id: "bk-demo-002",
          space_id: spaces[1]?.id || "b0000000-0000-0000-0000-000000000006",
          space_title: spaces[1]?.title || "Jaypee Greens Pavilion Shaded Carport",
          space_photo: spaces[1]?.photo_url,
          driver_id: "d0000000-0000-0000-0000-000000000002",
          driver_name: "Neha Gupta",
          driver_phone: "+91 99100 34002",
          driver_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
          start_time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
          total_price: 320,
          status: "confirmed",
          payment_status: "paid",
          otp_code: "839210",
          created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        },
        {
          id: "bk-demo-003",
          space_id: spaces[0]?.id || "b0000000-0000-0000-0000-000000000001",
          space_title: spaces[0]?.title || "Pari Chowk Metro Plaza Covered Bay",
          space_photo: spaces[0]?.photo_url,
          driver_id: "d0000000-0000-0000-0000-000000000003",
          driver_name: "Kunal Saxena",
          driver_phone: "+91 99100 34003",
          driver_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
          start_time: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
          total_price: 135,
          status: "checked_in",
          payment_status: "paid",
          otp_code: "291834",
          created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "bk-demo-004",
          space_id: spaces[2]?.id || "b0000000-0000-0000-0000-000000000011",
          space_title: spaces[2]?.title || "Gaur City Mall Covered Basement Slot",
          space_photo: spaces[2]?.photo_url,
          driver_id: "d0000000-0000-0000-0000-000000000004",
          driver_name: "Deepa Ranganathan",
          driver_phone: "+91 99100 34004",
          driver_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
          start_time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
          total_price: 200,
          status: "completed",
          payment_status: "paid",
          otp_code: "651982",
          created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    }

    // 4. Compute Summary Metrics
    const totalEarnings = bookings.reduce((sum, b) => {
      if (b.payment_status === "paid" || ["confirmed", "checked_in", "completed"].includes(b.status)) {
        return sum + (Number(b.total_price) || 0);
      }
      return sum;
    }, 0);

    const activeListingsCount = spaces.filter((s) => s.is_active).length;
    const upcomingBookings = bookings.filter((b) => ["pending_payment", "confirmed", "checked_in"].includes(b.status));
    const upcomingBookingsCount = upcomingBookings.length;
    const pendingCheckinsCount = bookings.filter((b) => b.status === "confirmed").length;

    return NextResponse.json({
      owner: ownerProfile,
      metrics: {
        total_earnings: totalEarnings,
        upcoming_bookings_count: upcomingBookingsCount,
        active_listings_count: activeListingsCount,
        pending_checkins_count: pendingCheckinsCount,
      },
      spaces,
      upcoming_bookings: bookings,
    });
  } catch (err: any) {
    if (
      err?.digest?.includes("DYNAMIC") ||
      err?.digest?.includes("BAILOUT") ||
      err?.digest?.includes("HANGING") ||
      err?.message?.includes("NEXT_REDIRECT") ||
      err?.message?.includes("cookies")
    ) {
      throw err;
    }
    console.error("Error in GET /api/owner/dashboard:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load owner dashboard" },
      { status: 500 }
    );
  }
}
