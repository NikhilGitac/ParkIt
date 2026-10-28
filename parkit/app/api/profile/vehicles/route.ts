import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    await cookies();
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to add vehicles." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { plate, type } = body;

    // 1. Validate plate format
    const cleanPlate = String(plate || "")
      .replace(/[\s-]/g, "")
      .toUpperCase();

    if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/.test(cleanPlate)) {
      return NextResponse.json(
        {
          error:
            "Invalid vehicle plate format. Example: UP16AB1234 or DL01CA9999 (2 state letters, 1-2 district digits, 1-3 series letters, 4 digits).",
        },
        { status: 400 }
      );
    }

    // 2. Validate type
    const normType = String(type || "").toLowerCase().trim();
    const validTypes = ["bike", "hatchback", "sedan", "suv"];
    if (!validTypes.includes(normType)) {
      return NextResponse.json(
        {
          error: `Invalid vehicle type. Must be one of: ${validTypes.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // 3. Insert vehicle
    const { data: vehicle, error: insertErr } = await supabase
      .from("vehicles")
      .insert({
        owner_id: user.id,
        plate: cleanPlate,
        type: normType,
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === "23505" || insertErr.message?.includes("unique")) {
        return NextResponse.json(
          { error: `Vehicle with plate ${cleanPlate} is already registered to your profile.` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: insertErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicle,
      message: "Vehicle added successfully.",
    });
  } catch (err: any) {
    console.error("Error in POST /api/profile/vehicles:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to add vehicle." },
      { status: 500 }
    );
  }
}
