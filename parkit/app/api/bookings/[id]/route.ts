import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";
import { FALLBACK_PARKING_SPACES } from "@/lib/parking-data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch from Supabase
    const { data: dbBooking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        parking_spaces:space_id (*, profiles:owner_id (full_name, avatar_url, phone)),
        profiles:driver_id (full_name, phone)
      `)
      .eq("id", id)
      .maybeSingle();

    let booking = dbBooking;

    // 2. Check in-memory demo registry if not in Supabase
    if (!booking && typeof globalThis.__PARKIT_DEMO_BOOKINGS !== "undefined") {
      const memoryItem = globalThis.__PARKIT_DEMO_BOOKINGS.find((b) => b.id === id);
      if (memoryItem) {
        const fallbackSpace = FALLBACK_PARKING_SPACES.find((s) => s.id === memoryItem.space_id) || FALLBACK_PARKING_SPACES[0];
        booking = {
          ...memoryItem,
          parking_spaces: {
            ...fallbackSpace,
            profiles: {
              full_name: fallbackSpace.owner_name,
              avatar_url: fallbackSpace.owner_avatar,
              phone: "+91 98100 12001",
            },
          },
          profiles: {
            full_name: "Demo Driver",
            phone: "+91 99100 34001",
          },
        };
      }
    }

    if (!booking) {
      return NextResponse.json(
        { error: "Booking reference not found" },
        { status: 404 }
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
