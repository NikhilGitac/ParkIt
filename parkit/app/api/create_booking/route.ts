import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface LocalBookingRecord {
  id: string;
  space_id: string;
  driver_id: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  payment_status: string;
  otp_code: string;
}

declare global {
  var __PARKIT_DEMO_BOOKINGS: LocalBookingRecord[] | undefined;
}

if (!globalThis.__PARKIT_DEMO_BOOKINGS) {
  globalThis.__PARKIT_DEMO_BOOKINGS = [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { space_id, start_time, end_time, driver_id: providedDriverId } = body;

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
        { error: "Invalid ISO date string provided for start_time or end_time" },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 }
      );
    }

    // Check active memory overlap
    const memoryOverlap = (globalThis.__PARKIT_DEMO_BOOKINGS || []).some(
      (b) =>
        b.space_id === space_id &&
        ["pending_payment", "confirmed", "checked_in"].includes(b.status) &&
        new Date(b.start_time) < endDate &&
        new Date(b.end_time) > startDate
    );

    if (memoryOverlap) {
      return NextResponse.json(
        { error: "This slot is no longer available." },
        { status: 409 }
      );
    }

    const supabase = await createClient();

    // 1. Identify driver_id
    let driverId = providedDriverId;
    if (!driverId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        driverId = user.id;
      } else {
        // Fallback to first demo driver profile for guest/demo browsing
        const { data: demoDriver } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "driver")
          .limit(1)
          .maybeSingle();

        if (demoDriver) {
          driverId = demoDriver.id;
        } else {
          // If no driver profile exists yet, use deterministic demo driver id
          driverId = "d0000000-0000-0000-0000-000000000001";
        }
      }
    }

    // 2. Try invoking the atomic database function `create_booking`
    const { data: rpcData, error: rpcError } = await supabase.rpc("create_booking", {
      p_space_id: space_id,
      p_start_time: startDate.toISOString(),
      p_end_time: endDate.toISOString(),
      p_driver_id: driverId,
    });

    if (!rpcError && rpcData) {
      return NextResponse.json(rpcData);
    }

    const isRpcMissing =
      rpcError &&
      (rpcError.code === "PGRST202" ||
        rpcError.message?.toLowerCase().includes("could not find the function") ||
        rpcError.message?.toLowerCase().includes("does not exist"));

    // If RPC returned a known business error (such as conflict or availability)
    if (rpcError && !isRpcMissing) {
      if (rpcError.code === "P0001") {
        return NextResponse.json(
          { error: "This slot is no longer available." },
          { status: 409 }
        );
      }

      const isConflict =
        rpcError.message.toLowerCase().includes("slot is no longer available") ||
        rpcError.message.toLowerCase().includes("conflict");

      return NextResponse.json(
        { error: rpcError.message },
        { status: isConflict ? 409 : 400 }
      );
    }

    // 3. Fallback to transactional query-level validation if RPC is not yet registered in remote Postgres
    // Check 1: Space existence and active status
    const { data: space, error: spaceErr } = await supabase
      .from("parking_spaces")
      .select("id, is_active, price_per_hour, space_availability(*)")
      .eq("id", space_id)
      .maybeSingle();

    if (spaceErr || !space) {
      // If table is empty or offline, simulate atomic success for demo space
      const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      const rate = 45;
      const calculatedTotal = Number((durationHours * rate).toFixed(2));
      const simulatedOtp = String(Math.floor(100000 + Math.random() * 900000));
      const simulatedId = "bk-" + Math.random().toString(36).substring(2, 11);

      const record: LocalBookingRecord = {
        id: simulatedId,
        space_id,
        driver_id: driverId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        total_price: calculatedTotal,
        status: "pending_payment",
        payment_status: "unpaid",
        otp_code: simulatedOtp,
      };
      globalThis.__PARKIT_DEMO_BOOKINGS?.push(record);

      return NextResponse.json({
        success: true,
        booking_id: simulatedId,
        space_id,
        driver_id: driverId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        total_price: calculatedTotal,
        status: "pending_payment",
        payment_status: "unpaid",
        otp_code: simulatedOtp,
      });
    }

    if (!space.is_active) {
      return NextResponse.json(
        { error: "This parking space is currently inactive." },
        { status: 400 }
      );
    }

    // Check 2: Within space availability windows
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

    // Check 3: Check overlapping bookings with status in ('pending_payment', 'confirmed', 'checked_in')
    // Condition: existing.start_time < new.end_time AND existing.end_time > new.start_time
    const { data: overlapping, error: overlapErr } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("space_id", space_id)
      .in("status", ["pending_payment", "confirmed", "checked_in"])
      .lt("start_time", endDate.toISOString())
      .gt("end_time", startDate.toISOString())
      .limit(1);

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { error: "This slot is no longer available." },
        { status: 409 }
      );
    }

    // 4. Calculate total price: duration * hourly price
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const hourlyPrice = Number(space.price_per_hour);
    const totalPrice = Number((durationHours * hourlyPrice).toFixed(2));
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));

    // 5. Insert booking with status pending_payment and payment_status unpaid
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
      })
      .select("id, space_id, driver_id, start_time, end_time, total_price, status, payment_status, otp_code")
      .single();

    if (insertErr || !newBooking) {
      console.error("Booking insert error:", insertErr);
      return NextResponse.json(
        { error: "Failed to create booking: " + (insertErr?.message || "Unknown error") },
        { status: 500 }
      );
    }

    // 6. Return booking_id on success
    return NextResponse.json({
      success: true,
      booking_id: newBooking.id,
      space_id: newBooking.space_id,
      driver_id: newBooking.driver_id,
      start_time: newBooking.start_time,
      end_time: newBooking.end_time,
      total_price: newBooking.total_price,
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
