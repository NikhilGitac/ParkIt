import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Enforce server-side authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. You must be signed in to confirm payment." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: "Missing required booking_id parameter" }, { status: 400 });
    }

    // 2. Verify that this booking exists and belongs to the authenticated driver
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, driver_id, status, payment_status")
      .eq("id", booking_id)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json(
        { error: "Database error retrieving booking: " + fetchErr.message },
        { status: 503 }
      );
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found in Supabase" }, { status: 404 });
    }

    if (booking.driver_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only authorize payment for your own reservation." },
        { status: 403 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot pay for a cancelled booking." },
        { status: 400 }
      );
    }

    // 3. Generate 6-digit OTP
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));

    // 4. Generate Check-in URL for Owner: e.g. /verify/${booking_id}
    const origin = request.nextUrl.origin || "http://localhost:3000";
    const checkinUrl = `${origin}/verify/${booking_id}`;

    // 5. Generate QR code base64 Data URL using `qrcode` package
    const qrCodeDataUrl = await QRCode.toDataURL(checkinUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#0B1F3A",
        light: "#FFFFFF",
      },
    });

    // 6. Execute database RPC confirm_booking_payment
    const { data: rpcData, error: rpcError } = await supabase.rpc("confirm_booking_payment", {
      p_booking_id: booking_id,
      p_otp_code: generatedOtp,
    });

    if (!rpcError && rpcData) {
      return NextResponse.json({
        ...rpcData,
        qr_code_url: qrCodeDataUrl,
        checkin_url: checkinUrl,
      });
    }

    // 7. Fallback update directly to Supabase bookings table
    const { data: updatedBooking, error: updateErr } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        otp_code: generatedOtp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id)
      .select()
      .maybeSingle();

    if (updateErr || !updatedBooking) {
      return NextResponse.json(
        { error: "Failed to confirm payment in Supabase: " + (updateErr?.message || "Unknown error") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking_id,
      status: updatedBooking.status,
      payment_status: updatedBooking.payment_status,
      otp_code: updatedBooking.otp_code || generatedOtp,
      qr_code_url: qrCodeDataUrl,
      checkin_url: checkinUrl,
    });
  } catch (err: any) {
    console.error("Error in /api/bookings/pay:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process payment confirmation" },
      { status: 500 }
    );
  }
}
