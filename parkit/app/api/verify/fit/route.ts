import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_PARKING_SPACES } from "@/lib/parking-data";

const VEHICLE_RANKS: Record<string, number> = {
  bike: 1,
  hatchback: 2,
  sedan: 3,
  suv: 4,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { spaceId, vehicleType } = body;

    const normType = String(vehicleType || "").toLowerCase().trim();
    if (!VEHICLE_RANKS[normType]) {
      return NextResponse.json(
        {
          error: "Invalid vehicle type. Must be bike, hatchback, sedan, or suv.",
        },
        { status: 400 }
      );
    }

    let maxVehicleType = body.targetMaxVehicleType
      ? String(body.targetMaxVehicleType).toLowerCase()
      : "suv";

    // 1. Check in database first
    if (spaceId) {
      try {
        const supabase = await createClient();
        const { data: space } = await supabase
          .from("parking_spaces")
          .select("max_vehicle_type, vehicle_types, space_type")
          .eq("id", spaceId)
          .maybeSingle();

        if (space) {
          if (space.max_vehicle_type) {
            maxVehicleType = String(space.max_vehicle_type).toLowerCase();
          } else if (Array.isArray(space.vehicle_types) && space.vehicle_types.length > 0) {
            const types = space.vehicle_types.map((v: string) => String(v).toLowerCase());
            if (types.includes("suv")) maxVehicleType = "suv";
            else if (types.includes("sedan") || types.includes("car")) maxVehicleType = "sedan";
            else if (types.includes("hatchback")) maxVehicleType = "hatchback";
            else if (types.includes("bike")) maxVehicleType = "bike";
          }
        } else {
          // Check fallback list
          const fallback = FALLBACK_PARKING_SPACES.find((s) => s.id === spaceId);
          if (fallback) {
            if (fallback.vehicle_types) {
              const types = fallback.vehicle_types.map((v) => v.toLowerCase());
              if (types.includes("suv")) maxVehicleType = "suv";
              else if (types.includes("sedan") || types.includes("car")) maxVehicleType = "sedan";
              else if (types.includes("bike")) maxVehicleType = "bike";
            }
          }
        }
      } catch (err) {
        console.warn("[POST /api/verify/fit] Database query notice:", err);
      }
    }

    const driverRank = VEHICLE_RANKS[normType];
    const spotRank = VEHICLE_RANKS[maxVehicleType] ?? 4;

    if (driverRank > spotRank) {
      return NextResponse.json(
        {
          fits: false,
          maxVehicleType: maxVehicleType,
          vehicleType: normType,
          error: `This spot only fits ${maxVehicleType}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      fits: true,
      maxVehicleType: maxVehicleType,
      vehicleType: normType,
      message: `Fit confirmed! Your ${normType} comfortably fits within this ${maxVehicleType} designated spot.`,
    });
  } catch (err: unknown) {
    console.error("[POST /api/verify/fit] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
