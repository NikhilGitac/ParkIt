import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    await cookies();
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to view profile." },
        { status: 401 }
      );
    }

    // 1. Fetch user profile
    const { data: dbProfile, error: profileErr } = await supabase
      .from("profiles")
      .select(
        "id, full_name, phone, role, avatar_url, city, created_at, host_status, driver_status, id_type, id_last4"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      console.warn("Notice reading profile:", profileErr.message);
    }

    const profile = dbProfile || {
      id: user.id,
      full_name:
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "ParkIt Member",
      phone: user.user_metadata?.phone || null,
      role: (user.user_metadata?.role as "driver" | "owner") || "driver",
      avatar_url: user.user_metadata?.avatar_url || null,
      city: "Greater Noida",
      created_at: user.created_at || new Date().toISOString(),
      host_status: "unverified",
      driver_status: "unverified",
      id_type: null,
      id_last4: null,
    };

    // 2. Fetch saved vehicles
    let vehicles: any[] = [];
    try {
      const { data: dbVehicles } = await supabase
        .from("vehicles")
        .select("id, plate, type, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (dbVehicles) {
        vehicles = dbVehicles;
      }
    } catch (vErr) {
      console.warn("Notice reading vehicles:", vErr);
    }

    // 3. Fetch Driver Bookings (where driver_id = user.id)
    let driverBookings: any[] = [];
    let userClaims: any[] = [];
    try {
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
          policy_number,
          insurance_premium,
          insurance_status,
          insurance_plan_id,
          insurance_plans:insurance_plan_id (*),
          parking_spaces:space_id (
            id,
            title,
            address,
            street,
            landmark,
            city,
            pincode,
            photo_url,
            house_no,
            building_name,
            contact_phone,
            latitude,
            longitude
          )
        `)
        .eq("driver_id", user.id)
        .order("start_time", { ascending: false });

      // Fetch driver claims
      try {
        const { data: dbClaims } = await supabase
          .from("insurance_claims")
          .select(`
            id,
            claim_number,
            booking_id,
            plan_id,
            claimant_id,
            damage_type,
            description,
            incident_at,
            estimated_amount,
            evidence_files,
            status,
            approved_amount,
            resolution_note,
            created_at,
            updated_at,
            insurance_plans:plan_id (*)
          `)
          .eq("claimant_id", user.id)
          .order("created_at", { ascending: false });
        if (dbClaims) userClaims = dbClaims;
      } catch (cErr) {
        console.warn("Notice reading user claims:", cErr);
      }

      if (dbBookings && dbBookings.length > 0) {
        driverBookings = dbBookings.map((b: any) => {
          const space = b.parking_spaces || {};
          const isPaidAndConfirmed =
            b.payment_status === "paid" &&
            ["confirmed", "checked_in", "completed"].includes(b.status);

          const publicAddress = [
            space.street,
            space.landmark,
            space.city,
            space.pincode,
          ]
            .filter(Boolean)
            .join(", ") || space.address || "Greater Noida, UP";

          const bookingClaims = userClaims.filter((c: any) => c.booking_id === b.id);

          return {
            id: b.id,
            space_id: b.space_id,
            space_title: space.title || "Parking Bay",
            space_photo: space.photo_url || null,
            public_address: publicAddress,
            latitude: space.latitude,
            longitude: space.longitude,
            // Privacy rule: Only reveal private house/phone if paid and confirmed
            house_no: isPaidAndConfirmed ? space.house_no : null,
            building_name: isPaidAndConfirmed ? space.building_name : null,
            host_phone: isPaidAndConfirmed ? space.contact_phone : null,
            start_time: b.start_time,
            end_time: b.end_time,
            total_price: Number(b.total_price || 0),
            status: b.status,
            payment_status: b.payment_status,
            otp_code: b.otp_code,
            created_at: b.created_at,
            policy_number: b.policy_number,
            insurance_premium: Number(b.insurance_premium || 0),
            insurance_status: b.insurance_status || "active",
            insurance_plan: b.insurance_plans || null,
            claims: bookingClaims,
          };
        });
      }
    } catch (bErr) {
      console.warn("Notice reading driver bookings:", bErr);
    }

    // 4. Fetch Host Spaces (where owner_id = user.id)
    let hostSpaces: any[] = [];
    try {
      const { data: dbSpaces } = await supabase
        .from("parking_spaces")
        .select(`
          id,
          owner_id,
          title,
          description,
          address,
          street,
          landmark,
          city,
          pincode,
          price_per_hour,
          photo_url,
          is_active,
          total_slots,
          max_vehicle_type,
          verified_host,
          created_at,
          space_availability (
            id,
            day_of_week,
            start_time,
            end_time
          )
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (dbSpaces) {
        hostSpaces = dbSpaces;
      }
    } catch (sErr) {
      console.warn("Notice reading host spaces:", sErr);
    }

    // 5. Fetch Bookings Received by Host (where space_id in hostSpaces)
    let hostBookings: any[] = [];
    const hostSpaceIds = hostSpaces.map((s) => s.id);

    if (hostSpaceIds.length > 0) {
      try {
        const { data: dbHostBookings } = await supabase
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
          .in("space_id", hostSpaceIds)
          .order("start_time", { ascending: false });

        if (dbHostBookings && dbHostBookings.length > 0) {
          hostBookings = dbHostBookings.map((b: any) => {
            const rawFullName = b.profiles?.full_name || "Driver";
            // Privacy rule: Host sees driver first name only, NEVER driver phone
            const firstName = rawFullName.trim().split(/\s+/)[0] || "Driver";
            const claims = Array.isArray(b.insurance_claims) ? b.insurance_claims : [];
            const activeClaim = claims.length > 0 ? claims[0] : null;

            return {
              id: b.id,
              space_id: b.space_id,
              space_title: b.parking_spaces?.title || "Parking Spot",
              driver_first_name: firstName,
              driver_avatar: b.profiles?.avatar_url || null,
              start_time: b.start_time,
              end_time: b.end_time,
              total_price: Number(b.total_price || 0),
              status: b.status,
              payment_status: b.payment_status,
              is_otp_verified: b.status === "checked_in" || b.status === "completed",
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
      } catch (hbErr) {
        console.warn("Notice reading host bookings:", hbErr);
      }
    }

    // 6. Compute Driver Metrics
    const now = new Date();
    const totalDriverSpent = driverBookings.reduce((sum, b) => {
      if (b.payment_status === "paid" || ["confirmed", "checked_in", "completed"].includes(b.status)) {
        return sum + b.total_price;
      }
      return sum;
    }, 0);

    const upcomingDriverBookings = driverBookings.filter(
      (b) =>
        ["pending_payment", "confirmed"].includes(b.status) &&
        new Date(b.end_time) >= now
    );

    const driverMetrics = {
      total_bookings: driverBookings.length,
      total_spent: totalDriverSpent,
      upcoming_count: upcomingDriverBookings.length,
      vehicles_saved: vehicles.length,
    };

    // 7. Compute Host Metrics
    const totalHostEarnings = hostBookings.reduce((sum, b) => {
      if (b.payment_status === "paid" || ["confirmed", "checked_in", "completed"].includes(b.status)) {
        return sum + b.total_price;
      }
      return sum;
    }, 0);

    const activeListingsCount = hostSpaces.filter((s) => s.is_active).length;
    const upcomingHostBookings = hostBookings.filter(
      (b) =>
        ["pending_payment", "confirmed"].includes(b.status) &&
        new Date(b.end_time) >= now
    );
    const pendingCheckinsCount = hostBookings.filter((b) => b.status === "confirmed").length;

    // Monthly Occupancy Rate Calculation
    // Total booked hours this month for host spaces / total available hours
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    let bookedHoursThisMonth = 0;
    hostBookings.forEach((b) => {
      if (["confirmed", "checked_in", "completed"].includes(b.status)) {
        const bStart = new Date(b.start_time);
        const bEnd = new Date(b.end_time);
        if (bStart >= startOfMonth && bEnd <= now) {
          const diffHours = (bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60);
          if (diffHours > 0) bookedHoursThisMonth += diffHours;
        }
      }
    });

    // Total available hours = active spaces * 24h * days
    const totalAvailableHours = activeListingsCount * 24 * daysInCurrentMonth;
    const occupancyRate =
      totalAvailableHours > 0
        ? Math.min(100, Math.round((bookedHoursThisMonth / totalAvailableHours) * 100))
        : 0;

    // Earnings breakdown: This month and last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let earningsThisMonth = 0;
    let earningsLast7Days = 0;

    hostBookings.forEach((b) => {
      if (b.payment_status === "paid" || ["confirmed", "checked_in", "completed"].includes(b.status)) {
        const bDate = new Date(b.created_at || b.start_time);
        if (bDate >= startOfMonth) earningsThisMonth += b.total_price;
        if (bDate >= sevenDaysAgo) earningsLast7Days += b.total_price;
      }
    });

    const hostMetrics = {
      spaces_listed: hostSpaces.length,
      active_listings: activeListingsCount,
      total_earnings: totalHostEarnings,
      upcoming_bookings: upcomingHostBookings.length,
      pending_checkins: pendingCheckinsCount,
      occupancy_this_month: occupancyRate,
      earnings_this_month: earningsThisMonth,
      earnings_last_7_days: earningsLast7Days,
    };

    return NextResponse.json({
      profile,
      email: user.email,
      vehicles,
      driver: {
        metrics: driverMetrics,
        bookings: driverBookings,
        claims: userClaims,
      },
      host: {
        metrics: hostMetrics,
        spaces: hostSpaces,
        bookings: hostBookings,
      },
    });
  } catch (err: any) {
    if (
      err?.digest?.includes("DYNAMIC") ||
      err?.digest?.includes("BAILOUT") ||
      err?.digest?.includes("HANGING")
    ) {
      throw err;
    }
    console.error("Error in GET /api/profile:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load profile data." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await cookies();
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to update profile." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { full_name, phone, avatar_url, city } = body;

    // 1. Validate full_name
    if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Full name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    // 2. Validate phone if provided
    let cleanPhone = (phone || "").trim().replace(/\D/g, "").slice(-10);
    if (phone && phone.trim()) {
      if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: "Please enter a valid 10-digit Indian mobile number starting with 6-9." },
          { status: 400 }
        );
      }
    } else {
      cleanPhone = "";
    }

    // 3. Prepare payload for update
    const updatePayload: Record<string, any> = {
      full_name: full_name.trim(),
      phone: cleanPhone || null,
      avatar_url: avatar_url?.trim() || null,
      city: city?.trim() || "Greater Noida",
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProfile, error: updateErr } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id)
      .select()
      .maybeSingle();

    if (updateErr) {
      // If city column is missing prior to migration run, fallback to updating without city
      if (updateErr.message?.includes("city")) {
        delete updatePayload.city;
        const { data: fallbackUpdated, error: fallbackErr } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", user.id)
          .select()
          .maybeSingle();

        if (fallbackErr) {
          return NextResponse.json(
            { error: fallbackErr.message },
            { status: 400 }
          );
        }
        return NextResponse.json({
          success: true,
          profile: fallbackUpdated,
          message: "Profile updated successfully.",
        });
      }

      return NextResponse.json(
        { error: updateErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile || updatePayload,
      message: "Profile updated successfully.",
    });
  } catch (err: any) {
    console.error("Error in PATCH /api/profile:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
