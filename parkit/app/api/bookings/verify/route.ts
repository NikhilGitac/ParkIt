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
        { error: "Unauthorized. You must be signed in as a host to verify driver check-ins." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { booking_id, otp_code } = body;

    if (!booking_id || !otp_code) {
      return NextResponse.json(
        { error: "Both booking_id and 6-digit otp_code are required" },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp_code).trim();
    if (cleanOtp.length !== 6) {
      return NextResponse.json(
        { error: "OTP must be exactly 6 numeric digits" },
        { status: 400 }
      );
    }

    // 2. Fetch booking and verify ownership of the space
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, space_id, driver_id, status, payment_status, otp_code, start_time, end_time, parking_spaces:space_id (owner_id)")
      .eq("id", booking_id)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json(
        { error: "Database error retrieving booking: " + fetchErr.message },
        { status: 503 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        { error: "Booking reference not found in Supabase" },
        { status: 404 }
      );
    }

    const spaceOwnerId = (booking.parking_spaces as any)?.owner_id;
    if (spaceOwnerId && spaceOwnerId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only verify check-ins for parking spaces that you own." },
        { status: 403 }
      );
    }

    // 3. Try invoking database RPC verify_booking_checkin
    const { data: rpcData, error: rpcError } = await supabase.rpc("verify_booking_checkin", {
      p_booking_id: booking_id,
      p_otp_code: cleanOtp,
    });

    if (!rpcError && rpcData) {
      return NextResponse.json(rpcData);
    }

    // Handle known RPC validation errors
    if (rpcError && rpcError.code === "P0010") {
      return NextResponse.json(
        { error: "Invalid OTP code. Please enter the correct 6-digit code provided by the driver." },
        { status: 400 }
      );
    }

    const isRpcMissing =
      !rpcError ||
      rpcError.code === "PGRST202" ||
      rpcError.message?.toLowerCase().includes("schema cache") ||
      rpcError.message?.toLowerCase().includes("not found") ||
      rpcError.message?.toLowerCase().includes("does not exist");

    if (rpcError && !isRpcMissing) {
      return NextResponse.json(
        { error: rpcError.message },
        { status: 400 }
      );
    }

    // 4. Fallback verification directly on Supabase bookings table
    if (booking.status === "checked_in") {
      return NextResponse.json({
        success: true,
        already_checked_in: true,
        status: "checked_in",
        message: "Driver has already checked in to this parking spot.",
      });
    }

    if (booking.payment_status !== "paid" || booking.status === "pending_payment") {
      return NextResponse.json(
        { error: "Cannot check in: Booking has not been paid yet (status: pending_payment)." },
        { status: 400 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot check in: This booking was cancelled." },
        { status: 400 }
      );
    }

    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Cannot check in: This booking has already ended and was completed." },
        { status: 400 }
      );
    }

    // Validate OTP match
    if (String(booking.otp_code).trim() !== cleanOtp) {
      return NextResponse.json(
        { error: "Invalid OTP code. Please enter the correct 6-digit code provided by the driver." },
        { status: 400 }
      );
    }

    // OTP matches: update status to checked_in in Supabase
    const { error: updateErr } = await supabase
      .from("bookings")
      .update({
        status: "checked_in",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update check-in status in Supabase: " + updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      already_checked_in: false,
      status: "checked_in",
      booking_id,
      message: "Check-in verified successfully! Gate access granted to driver.",
    });
  } catch (err: any) {
    console.error("Error in /api/bookings/verify:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to verify check-in" },
      { status: 500 }
    );
  }
}
