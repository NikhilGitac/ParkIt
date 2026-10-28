import { NextRequest, NextResponse } from "next/server";
import { defaultGeocoder } from "@/lib/geocoding";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    // Validation
    if (q === null || typeof q !== "string") {
      return NextResponse.json(
        { error: "Query parameter 'q' is required", suggestions: [] },
        { status: 400 }
      );
    }

    if (q.length > 200) {
      return NextResponse.json(
        { error: "Search query exceeds maximum length of 200 characters", suggestions: [] },
        { status: 400 }
      );
    }

    const trimmed = q.trim();
    if (trimmed.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const limitParam = searchParams.get("limit");

    let lat: number | undefined = undefined;
    let lon: number | undefined = undefined;
    let limit: number | undefined = undefined;

    if (latParam !== null) {
      const parsedLat = parseFloat(latParam);
      if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
        return NextResponse.json(
          { error: "Query parameter 'lat' must be a valid number between -90 and 90", suggestions: [] },
          { status: 400 }
        );
      }
      lat = parsedLat;
    }

    if (lonParam !== null) {
      const parsedLon = parseFloat(lonParam);
      if (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180) {
        return NextResponse.json(
          { error: "Query parameter 'lon' must be a valid number between -180 and 180", suggestions: [] },
          { status: 400 }
        );
      }
      lon = parsedLon;
    }

    if (limitParam !== null) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 20) {
        return NextResponse.json(
          { error: "Query parameter 'limit' must be an integer between 1 and 20", suggestions: [] },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    const result = await defaultGeocoder.search(trimmed, { lat, lon, limit });

    if (result.error && result.status && result.status >= 400) {
      return NextResponse.json(
        { error: result.error, suggestions: [] },
        { status: result.status }
      );
    }

    return NextResponse.json({ suggestions: result.suggestions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Geocode search failed";
    console.error("[GET /api/geocode/search] Unexpected error:", msg);
    return NextResponse.json(
      { error: "Geocoding service unavailable", suggestions: [] },
      { status: 500 }
    );
  }
}
