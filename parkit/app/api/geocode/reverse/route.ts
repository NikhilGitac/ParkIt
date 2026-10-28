import { NextRequest, NextResponse } from "next/server";
import { defaultGeocoder } from "@/lib/geocoding";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("lat");
    const lonStr = searchParams.get("lon") || searchParams.get("lng");

    if (!latStr || !lonStr) {
      return NextResponse.json(
        { error: "Both 'lat' and 'lon' query parameters are required", result: null },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: "Query parameter 'lat' must be a valid number between -90 and 90", result: null },
        { status: 400 }
      );
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      return NextResponse.json(
        { error: "Query parameter 'lon' must be a valid number between -180 and 180", result: null },
        { status: 400 }
      );
    }

    const { result, error, status } = await defaultGeocoder.reverse(lat, lon);

    if (error && status && status >= 400) {
      return NextResponse.json(
        { error, result: null },
        { status }
      );
    }

    // Return normalized format, plus address dictionary for backwards compatibility
    return NextResponse.json({
      result,
      address: result?.address || (result ? {
        street: result.street,
        city: result.city,
        state: result.state,
        postcode: result.pincode,
        house_number: result.houseNumber,
      } : null),
      name: result?.name || result?.label || "",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Reverse geocoding failed";
    console.error("[GET /api/geocode/reverse] Unexpected error:", msg);
    return NextResponse.json(
      { error: "Reverse geocoding service unavailable", result: null },
      { status: 500 }
    );
  }
}
