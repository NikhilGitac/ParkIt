import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Require authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required for driver verification." },
        { status: 401 }
      );
    }

    // Artificial delay for realistic demo experience (1.4s)
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const body = await request.json().catch(() => ({}));
    const { dlNumber, plate, vehicleType } = body;

    // 2. Validate Driving Licence Number
    // Standard format: 2-letter state code + 2-digit year + 11-digit number
    const cleanDl = String(dlNumber || "").replace(/[\s-]/g, "").toUpperCase();
    if (!/^[A-Z]{2}[0-9]{2}[0-9]{11}$/.test(cleanDl)) {
      return NextResponse.json(
        {
          error:
            "Invalid Driving Licence number format. Example: UP1620210001234 (15 alphanumeric characters).",
        },
        { status: 400 }
      );
    }

    // 3. Validate Vehicle Plate Number
    // Indian standard plate: e.g. UP16AB1234, DL01CA9999, HR26DQ5555
    const cleanPlate = String(plate || "").replace(/[\s-]/g, "").toUpperCase();
    if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/.test(cleanPlate)) {
      return NextResponse.json(
        {
          error:
            "Invalid vehicle plate format. Example: UP16AB1234 or DL01CA9999 (2 letters, 1-2 digits, 1-3 series letters, 4 digits).",
        },
        { status: 400 }
      );
    }

    // 4. Validate Vehicle Type
    const normType = String(vehicleType || "").toLowerCase().trim();
    const validTypes = ["bike", "hatchback", "sedan", "suv"];
    if (!validTypes.includes(normType)) {
      return NextResponse.json(
        {
          error: `Invalid vehicle type. Must be one of: ${validTypes.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // 5. Insert/upsert into vehicles table
    try {
      await supabase
        .from("vehicles")
        .upsert(
          {
            owner_id: user.id,
            plate: cleanPlate,
            type: normType,
            created_at: new Date().toISOString(),
          },
          { onConflict: "owner_id,plate" }
        );
    } catch (vErr) {
      console.warn("[POST /api/verify/driver] Notice inserting into vehicles table:", vErr);
    }

    // 6. Update driver_status in profiles
    try {
      await supabase
        .from("profiles")
        .update({
          driver_status: "verified",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    } catch (pErr) {
      console.warn("[POST /api/verify/driver] Notice updating profile driver_status:", pErr);
    }

    return NextResponse.json({
      success: true,
      driver_status: "verified",
      message: "Driver licence and vehicle verified successfully (Demo mode).",
      vehicle: {
        plate: cleanPlate,
        type: normType,
      },
      dl_last4: cleanDl.slice(-4),
    });
  } catch (err: unknown) {
    console.error("[POST /api/verify/driver] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
