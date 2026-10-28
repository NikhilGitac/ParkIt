import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Enforce authenticated host session on the server
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in as a host to access your dashboard." },
        { status: 401 }
      );
    }

    // Strictly derive ownerId from the authenticated session
    const ownerId = authUser.id;

    // 2. Fetch Owner Profile from Supabase
    const { data: dbProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url, phone")
      .eq("id", ownerId)
      .maybeSingle();

    if (profileErr) {
      return NextResponse.json(
        { error: "Database error retrieving host profile: " + profileErr.message },
        { status: 503 }
      );
    }

    const ownerProfile = dbProfile || {
      id: ownerId,
      full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Host",
      role: "owner",
      avatar_url: authUser.user_metadata?.avatar_url || null,
      phone: authUser.user_metadata?.phone || null,
    };

    // 3. Fetch Owner's Spaces from Supabase
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

    if (spacesErr) {
      return NextResponse.json(
        { error: "Database error retrieving host spaces: " + spacesErr.message },
        { status: 503 }
      );
    }

    const spaces = (dbSpaces || []).map((s) => {
      const revs = s.reviews || [];
      const avgRating =
        revs.length > 0
          ? Number((revs.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / revs.length).toFixed(1))
          : 5.0;
      return {
        ...s,
        rating: avgRating,
        review_count: revs.length,
      };
    });

    const spaceIds = spaces.map((s) => s.id);

    // 4. Fetch Real Bookings for Owner's Spaces from Supabase
    let bookings: any[] = [];
    if (spaceIds.length > 0) {
      const { data: dbBookings, error: bookingsErr } = await supabase
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
          policy_number,
          insurance_plan_id,
          parking_spaces:space_id (title, photo_url),
          profiles:driver_id (full_name, avatar_url),
          insurance_plans:insurance_plan_id (plan_name, provider),
          insurance_claims (id, damage_type, status, created_at)
        `)
        .in("space_id", spaceIds)
        .order("start_time", { ascending: true });

      if (bookingsErr) {
        return NextResponse.json(
          { error: "Database error retrieving host bookings: " + bookingsErr.message },
          { status: 503 }
        );
      }

      if (dbBookings && dbBookings.length > 0) {
        bookings = dbBookings.map((b: any) => {
          const rawName = b.profiles?.full_name || "Driver";
          const firstName = rawName.trim().split(/\s+/)[0] || "Driver";
          const claims = Array.isArray(b.insurance_claims) ? b.insurance_claims : [];
          const activeClaim = claims.length > 0 ? claims[0] : null;

          return {
            id: b.id,
            space_id: b.space_id,
            space_title: b.parking_spaces?.title || "Parking Space",
            space_photo: b.parking_spaces?.photo_url || spaces.find((s) => s.id === b.space_id)?.photo_url,
            driver_id: b.driver_id,
            driver_name: firstName,
            // Privacy rule: Host sees driver first name only, NEVER driver phone
            driver_phone: null,
            driver_avatar: b.profiles?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
            start_time: b.start_time,
            end_time: b.end_time,
            total_price: Number(b.total_price),
            status: b.status,
            payment_status: b.payment_status,
            otp_code: b.otp_code,
            created_at: b.created_at,
            policy_number: b.policy_number,
            insurance_plan_name: b.insurance_plans?.plan_name || "ParkIt Protect Basic",
            insurance_provider: b.insurance_plans?.provider || "ParkIt",
            claim: activeClaim
              ? {
                  id: activeClaim.id,
                  damage_type: activeClaim.damage_type,
                  status: activeClaim.status,
                }
              : null,
          };
        });
      }
    }

    // 5. Compute Summary Metrics strictly from database
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
      err?.digest?.includes("HANGING")
    ) {
      throw err;
    }
    console.error("Error in GET /api/owner/dashboard:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
