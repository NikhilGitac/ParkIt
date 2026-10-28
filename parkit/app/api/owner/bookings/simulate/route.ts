import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        { error: "Unauthorized. Please log in as a host to simulate a test booking." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { space_id, price_per_hour = 45 } = body;

    // Verify user owns the space or get their first space
    let targetSpaceId = space_id;
    if (!targetSpaceId) {
      const { data: userSpace } = await supabase
        .from("parking_spaces")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      if (!userSpace) {
        return NextResponse.json(
          { error: "No parking spaces found for your account. Please list a space first." },
          { status: 400 }
        );
      }
      targetSpaceId = userSpace.id;
    }

    const otpCode = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date();
    const startTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins from now
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    const totalPrice = Number(price_per_hour) * 2;

    // Insert real booking record into Supabase
    const { data: newBooking, error: insertErr } = await supabase
      .from("bookings")
      .insert({
        space_id: targetSpaceId,
        driver_id: user.id, // self or verified driver
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_price: totalPrice,
        status: "confirmed",
        payment_status: "paid",
        otp_code: otpCode,
      })
      .select()
      .single();

    if (insertErr || !newBooking) {
      return NextResponse.json(
        { error: "Failed to persist simulated booking in Supabase: " + (insertErr?.message || "Unknown error") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: newBooking,
      message: "Simulated booking created and confirmed directly on Supabase.",
    });
  } catch (err: any) {
    console.error("Error simulating booking:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to simulate booking" },
      { status: 500 }
    );
  }
}
