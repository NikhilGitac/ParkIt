import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { space_id, space_title, price_per_hour = 45 } = body;

    const supabase = await createClient();

    const targetSpaceId = space_id || "b0000000-0000-0000-0000-000000000001";
    const bookingId = `bk-${Date.now().toString(36)}`;
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));

    const now = new Date();
    const startTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins from now
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    const totalPrice = price_per_hour * 2;

    const demoDrivers = [
      { name: "Aarav Kapoor", phone: "+91 98765 43210" },
      { name: "Pooja Malhotra", phone: "+91 98111 22334" },
      { name: "Tanmay Sen", phone: "+91 99223 34455" },
      { name: "Ishaan Bhatia", phone: "+91 97334 45566" },
    ];
    const driver = demoDrivers[Math.floor(Math.random() * demoDrivers.length)];

    const newBooking = {
      id: bookingId,
      space_id: targetSpaceId,
      driver_id: "d0000000-0000-0000-0000-000000000001",
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      total_price: totalPrice,
      status: "confirmed",
      payment_status: "paid",
      otp_code: otpCode,
      created_at: new Date().toISOString(),
    };

    // Store in global memory store
    if (typeof globalThis.__PARKIT_DEMO_BOOKINGS !== "undefined") {
      globalThis.__PARKIT_DEMO_BOOKINGS.unshift(newBooking);
    } else {
      globalThis.__PARKIT_DEMO_BOOKINGS = [newBooking];
    }

    // Try inserting in Supabase
    try {
      await supabase.from("bookings").insert({
        id: bookingId,
        space_id: targetSpaceId,
        driver_id: "d0000000-0000-0000-0000-000000000001",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_price: totalPrice,
        status: "confirmed",
        payment_status: "paid",
        otp_code: otpCode,
      });
    } catch (e) {
      // ignore if Supabase offline or RLS
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...newBooking,
        space_title: space_title || "Pari Chowk Metro Plaza Covered Bay",
        driver_name: driver.name,
        driver_phone: driver.phone,
      },
    });
  } catch (err: any) {
    console.error("Error in simulate booking:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
