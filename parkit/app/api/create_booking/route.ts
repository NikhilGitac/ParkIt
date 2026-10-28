import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  FALLBACK_INSURANCE_PLANS,
  generatePolicyNumber,
  InsurancePlan,
} from "@/lib/insurance-data";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Enforce authenticated session on the server
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be logged in to reserve a parking space." },
        { status: 401 }
      );
    }

    // Never trust client-sent driver_id; strictly derive from authenticated user
    const driverId = user.id;

    const body = await request.json();
    const { space_id, start_time, end_time, insurance_plan_id } = body;

    if (!space_id || !start_time || !end_time) {
      return NextResponse.json(
        { error: "Missing required booking fields: space_id, start_time, end_time" },
        { status: 400 }
      );
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format provided for start_time or end_time." },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 }
      );
    }

    // 2. Try invoking the atomic database procedure `create_booking`
    const { data: rpcData, error: rpcError } = await supabase.rpc("create_booking", {
      p_space_id: space_id,
      p_start_time: startDate.toISOString(),
      p_end_time: endDate.toISOString(),
      p_driver_id: driverId,
      p_insurance_plan_id: insurance_plan_id || null,
    });

    if (!rpcError && rpcData) {
      return NextResponse.json(rpcData);
    }

    // If RPC returned a known business error (conflict, availability, inactive)
    const isRpcMissing =
      rpcError &&
      (rpcError.code === "PGRST202" ||
        rpcError.message?.toLowerCase().includes("could not find the function") ||
        rpcError.message?.toLowerCase().includes("does not exist") ||
        rpcError.message?.toLowerCase().includes("too many arguments"));

    if (rpcError && !isRpcMissing) {
      if (rpcError.code === "P0001" || rpcError.message?.toLowerCase().includes("no longer available")) {
        return NextResponse.json(
          { error: "This slot is no longer available." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: rpcError.message },
        { status: 400 }
      );
    }

    // 3. Direct Supabase transactional check if RPC is not present
    const { data: space, error: spaceErr } = await supabase
      .from("parking_spaces")
      .select("id, is_active, price_per_hour, space_availability(*)")
      .eq("id", space_id)
      .maybeSingle();

    if (spaceErr) {
      return NextResponse.json(
        { error: "Database error connecting to Supabase: " + spaceErr.message },
        { status: 503 }
      );
    }

    if (!space) {
      return NextResponse.json(
        { error: "Parking space not found in database." },
        { status: 404 }
      );
    }

    if (!space.is_active) {
      return NextResponse.json(
        { error: "This parking space is currently inactive." },
        { status: 400 }
      );
    }

    // Check availability windows
    const dayOfWeek = startDate.getDay();
    const availabilitySlots = space.space_availability || [];
    if (availabilitySlots.length > 0) {
      const daySlot = availabilitySlots.find((s: any) => s.day_of_week === dayOfWeek);
      if (!daySlot) {
        return NextResponse.json(
          { error: "The selected day is outside the space operating days." },
          { status: 400 }
        );
      }

      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
      const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
      const [opStartH, opStartM] = daySlot.start_time.split(":").map(Number);
      const [opEndH, opEndM] = daySlot.end_time.split(":").map(Number);
      const opStartMinutes = opStartH * 60 + (opStartM || 0);
      const opEndMinutes = opEndH * 60 + (opEndM || 0);

      if (startMinutes < opStartMinutes || endMinutes > opEndMinutes) {
        return NextResponse.json(
          { error: `The selected time is outside the space operating hours (${daySlot.start_time} - ${daySlot.end_time}).` },
          { status: 400 }
        );
      }
    }

    // Check overlapping bookings in Supabase
    const { data: overlapping, error: overlapErr } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("space_id", space_id)
      .in("status", ["pending_payment", "confirmed", "checked_in"])
      .lt("start_time", endDate.toISOString())
      .gt("end_time", startDate.toISOString())
      .limit(1);

    if (overlapErr) {
      return NextResponse.json(
        { error: "Database error checking slot availability: " + overlapErr.message },
        { status: 503 }
      );
    }

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { error: "This slot is no longer available." },
        { status: 409 }
      );
    }

    // 4. Calculate total price and insurance premium strictly server-side
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const hourlyPrice = Number(space.price_per_hour);

    // Fetch insurance plan server-side; NEVER trust client-supplied premium amounts
    let plan: InsurancePlan | undefined;
    if (insurance_plan_id) {
      const { data: dbPlan } = await supabase
        .from("insurance_plans")
        .select("*")
        .eq("id", insurance_plan_id)
        .maybeSingle();
      if (dbPlan) plan = dbPlan;
      if (!plan) {
        plan = FALLBACK_INSURANCE_PLANS.find((p) => p.id === insurance_plan_id);
      }
    }

    if (!plan) {
      plan = FALLBACK_INSURANCE_PLANS[0]; // Default: ParkIt Protect Basic
    }

    const insurancePremium = Number((plan.premium_flat + durationHours * plan.premium_per_hour).toFixed(2));
    const totalPrice = Number(((durationHours * hourlyPrice) + insurancePremium).toFixed(2));
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const policyNumber = generatePolicyNumber();

    // 5. Insert booking into Supabase
    const { data: newBooking, error: insertErr } = await supabase
      .from("bookings")
      .insert({
        space_id,
        driver_id: driverId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        total_price: totalPrice,
        status: "pending_payment",
        payment_status: "unpaid",
        otp_code: otpCode,
        insurance_plan_id: plan.id,
        insurance_premium: insurancePremium,
        policy_number: policyNumber,
        insurance_status: "active",
      })
      .select("id, space_id, driver_id, start_time, end_time, total_price, status, payment_status, otp_code, insurance_plan_id, insurance_premium, policy_number, insurance_status")
      .single();

    if (insertErr || !newBooking) {
      return NextResponse.json(
        { error: "Failed to persist booking in Supabase: " + (insertErr?.message || "Unknown error") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking_id: newBooking.id,
      space_id: newBooking.space_id,
      driver_id: newBooking.driver_id,
      start_time: newBooking.start_time,
      end_time: newBooking.end_time,
      total_price: newBooking.total_price,
      insurance_premium: newBooking.insurance_premium,
      policy_number: newBooking.policy_number,
      insurance_plan_id: newBooking.insurance_plan_id,
      insurance_plan_name: plan.plan_name,
      status: newBooking.status,
      payment_status: newBooking.payment_status,
      otp_code: newBooking.otp_code,
    });
  } catch (error: any) {
    console.error("API create_booking exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error creating booking" },
      { status: 500 }
    );
  }
}
