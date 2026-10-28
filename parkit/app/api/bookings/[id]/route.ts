import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // 1. Enforce authenticated session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to view booking details." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. Fetch directly from Supabase
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        insurance_plans:insurance_plan_id (*),
        parking_spaces:space_id (*, profiles:owner_id (full_name, avatar_url, phone)),
        profiles:driver_id (full_name, phone)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Database error retrieving booking: " + error.message },
        { status: 503 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        { error: "Booking reference not found in Supabase" },
        { status: 404 }
      );
    }

    // 3. Verify that the authenticated user is either the driver or the space owner
    const isDriver = booking.driver_id === user.id;
    const isOwner = booking.parking_spaces?.owner_id === user.id;

    if (!isDriver && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to view this reservation." },
        { status: 403 }
      );
    }

    const origin = request.nextUrl.origin || "http://localhost:3000";
    const checkinUrl = `${origin}/verify/${booking.id}`;

    // Generate QR code Data URL
    const qrCodeDataUrl = await QRCode.toDataURL(checkinUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#0B1F3A",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      booking: {
        ...booking,
        qr_code_url: qrCodeDataUrl,
        checkin_url: checkinUrl,
      },
    });
  } catch (err: any) {
    console.error("Error in GET /api/bookings/[id]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch booking details" },
      { status: 500 }
    );
  }
}
