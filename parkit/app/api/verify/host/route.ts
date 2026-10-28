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
        { error: "Authentication required for host verification." },
        { status: 401 }
      );
    }

    // Artificial delay for realistic demo experience (1.4s)
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const body = await request.json().catch(() => ({}));
    const {
      name,
      idType,
      idLast4,
      ownershipProofName,
      consent,
      photoCount,
      pincode,
      lat,
      lng,
      hasCctv,
      cctvCoverage,
      hasGuard,
      guardHours,
      hasEntryControl,
      entryControlType,
      manualCheckin,
      manualCheckinBy,
    } = body;

    // 2. Clear Validation Checks
    if (!consent) {
      return NextResponse.json(
        {
          error:
            "Consent required: You must agree to terms and confirm legal authority to list this parking space.",
        },
        { status: 400 }
      );
    }

    if (
      !ownershipProofName ||
      typeof ownershipProofName !== "string" ||
      !ownershipProofName.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Ownership verification required: Please upload an electricity bill, property tax receipt, or check permission authorization.",
        },
        { status: 400 }
      );
    }

    const count = Number(photoCount ?? 0);
    if (isNaN(count) || count < 1) {
      return NextResponse.json(
        {
          error:
            "Space inspection check failed: At least 1 clear photo of the parking bay or driveway entrance is required.",
        },
        { status: 400 }
      );
    }

    const cleanIdLast4 = String(idLast4 || "").trim();
    if (!/^[0-9]{4}$/.test(cleanIdLast4)) {
      return NextResponse.json(
        {
          error:
            "Invalid ID details: Please enter exactly the last 4 digits of your chosen government ID.",
        },
        { status: 400 }
      );
    }

    if (!idType || typeof idType !== "string" || !idType.trim()) {
      return NextResponse.json(
        {
          error:
            "Please select your government identity proof type (Aadhaar, PAN, Passport, or Voter ID).",
        },
        { status: 400 }
      );
    }

    // Validate Server-Side Security Selects
    const validCctvCoverage = ["Entrance", "Full area", "Entrance + full area"];
    if (hasCctv && cctvCoverage && !validCctvCoverage.includes(cctvCoverage)) {
      return NextResponse.json(
        {
          error: `Invalid CCTV coverage option '${cctvCoverage}'. Allowed values: ${validCctvCoverage.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validGuardHours = ["24/7", "Day only", "Night only"];
    if (hasGuard && guardHours && !validGuardHours.includes(guardHours)) {
      return NextResponse.json(
        {
          error: `Invalid guard hours option '${guardHours}'. Allowed values: ${validGuardHours.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validEntryControlTypes = ["Gate", "Boom barrier", "Smart lock", "Other"];
    if (
      hasEntryControl &&
      entryControlType &&
      !validEntryControlTypes.includes(entryControlType)
    ) {
      return NextResponse.json(
        {
          error: `Invalid entry control type '${entryControlType}'. Allowed values: ${validEntryControlTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validManualCheckinBy = ["Host", "Guard", "Either"];
    if (
      manualCheckin &&
      manualCheckinBy &&
      !validManualCheckinBy.includes(manualCheckinBy)
    ) {
      return NextResponse.json(
        {
          error: `Invalid manual check-in verifier '${manualCheckinBy}'. Allowed values: ${validManualCheckinBy.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const computedSecurityScore = [
      Boolean(hasCctv),
      Boolean(hasGuard),
      Boolean(hasEntryControl),
      Boolean(manualCheckin),
    ].filter(Boolean).length;

    // 3. Geofence / Bounding Box Check:
    // Accept if coordinates fall inside the Greater Noida / Delhi NCR region:
    // Latitude ~27.8 to 29.2, Longitude ~76.5 to 78.2
    const latNum = parseFloat(String(lat));
    const lngNum = parseFloat(String(lng));

    if (isNaN(latNum) || isNaN(lngNum) || latNum === 0 || lngNum === 0) {
      return NextResponse.json(
        {
          error:
            "Map pin required: Please drop a pin at your exact parking space location.",
        },
        { status: 400 }
      );
    }

    const isInsideNcrBox =
      latNum >= 27.8 && latNum <= 29.2 && lngNum >= 76.5 && lngNum <= 78.2;

    if (!isInsideNcrBox) {
      return NextResponse.json(
        {
          error: `Location mismatch: The selected map pin (${latNum.toFixed(4)}, ${lngNum.toFixed(4)}) is outside the Delhi NCR service zone for pincode ${pincode || "entered"}. Please place pin in Delhi NCR / Greater Noida.`,
        },
        { status: 400 }
      );
    }

    // 4. Update Profile in Supabase
    try {
      await supabase
        .from("profiles")
        .update({
          host_status: "verified",
          id_type: idType.trim(),
          id_last4: cleanIdLast4,
          role: "owner",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    } catch (dbErr) {
      console.warn(
        "[POST /api/verify/host] Database update notice (columns may be pending migration):",
        dbErr
      );
    }

    return NextResponse.json({
      success: true,
      host_status: "verified",
      message: "Host identity and security features verified successfully (Demo mode).",
      verified_badge: true,
      security_score: computedSecurityScore,
      ownership_proof_name: ownershipProofName.trim(),
      has_cctv: Boolean(hasCctv),
      cctv_coverage: hasCctv ? cctvCoverage : null,
      has_guard: Boolean(hasGuard),
      guard_hours: hasGuard ? guardHours : null,
      has_entry_control: Boolean(hasEntryControl),
      entry_control_type: hasEntryControl ? entryControlType : null,
      manual_checkin: Boolean(manualCheckin),
      manual_checkin_by: manualCheckin ? manualCheckinBy : null,
    });
  } catch (err: unknown) {
    console.error("[POST /api/verify/host] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
