import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  FALLBACK_INSURANCE_PLANS,
  DAMAGE_TYPE_LABELS,
  generateClaimNumber,
  InsurancePlan,
} from "@/lib/insurance-data";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to view claims." },
        { status: 401 }
      );
    }

    const { data: claims, error } = await supabase
      .from("insurance_claims")
      .select(`
        id,
        claim_number,
        booking_id,
        plan_id,
        claimant_id,
        damage_type,
        description,
        incident_at,
        estimated_amount,
        evidence_files,
        status,
        approved_amount,
        resolution_note,
        created_at,
        updated_at,
        insurance_plans:plan_id (*),
        bookings:booking_id (
          id,
          space_id,
          start_time,
          end_time,
          policy_number,
          parking_spaces:space_id (title)
        )
      `)
      .eq("claimant_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Notice reading insurance claims:", error.message);
      return NextResponse.json({ success: true, claims: [] });
    }

    return NextResponse.json({
      success: true,
      claims: claims || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load claims" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to submit an insurance claim." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      booking_id,
      damage_type,
      description,
      incident_at,
      estimated_amount,
      evidence_files = [],
      confirmation_checked,
    } = body;

    if (!booking_id) {
      return NextResponse.json(
        { error: "Booking reference is required to file a claim." },
        { status: 400 }
      );
    }

    if (!damage_type) {
      return NextResponse.json(
        { error: "Please select the damage type." },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "Please provide a detailed description of the incident." },
        { status: 400 }
      );
    }

    const parsedEstimate = parseFloat(String(estimated_amount));
    if (isNaN(parsedEstimate) || parsedEstimate <= 0) {
      return NextResponse.json(
        { error: "Estimated repair cost must be a positive number greater than 0." },
        { status: 400 }
      );
    }

    if (!incident_at) {
      return NextResponse.json(
        { error: "Incident date and time are required." },
        { status: 400 }
      );
    }

    const incidentDate = new Date(incident_at);
    if (isNaN(incidentDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid incident date/time format." },
        { status: 400 }
      );
    }

    // 1. Fetch booking and verify driver ownership and eligibility
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, driver_id, space_id, start_time, end_time, status, payment_status, insurance_plan_id, policy_number")
      .eq("id", booking_id)
      .maybeSingle();

    if (bookingErr || !booking) {
      return NextResponse.json(
        { error: "Booking not found in database." },
        { status: 404 }
      );
    }

    if (booking.driver_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only file claims on your own bookings." },
        { status: 403 }
      );
    }

    if (booking.payment_status !== "paid" || !["confirmed", "checked_in", "completed"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Claims can only be filed for confirmed and paid bookings." },
        { status: 400 }
      );
    }

    // 2. Fetch policy plan
    let plan: InsurancePlan | undefined;
    if (booking.insurance_plan_id) {
      const { data: dbPlan } = await supabase
        .from("insurance_plans")
        .select("*")
        .eq("id", booking.insurance_plan_id)
        .maybeSingle();
      if (dbPlan) plan = dbPlan;
    }

    if (!plan) {
      plan = FALLBACK_INSURANCE_PLANS[0]; // ParkIt Protect Basic
    }

    // 3. Verify Claim Window & Incident Window
    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);
    const claimWindowHours = plan.claim_window_hours || 48;
    const maxClaimTime = new Date(bookingEnd.getTime() + claimWindowHours * 3600 * 1000);

    const now = new Date();
    if (now > maxClaimTime) {
      return NextResponse.json(
        {
          error: `Claim window expired. Claims under your plan must be reported within ${claimWindowHours} hours of reservation end.`,
        },
        { status: 400 }
      );
    }

    if (incidentDate < new Date(bookingStart.getTime() - 15 * 60 * 1000) || incidentDate > maxClaimTime) {
      return NextResponse.json(
        {
          error: `Incident time must fall within your booking window or the ${claimWindowHours}-hour post-stay claim period.`,
        },
        { status: 400 }
      );
    }

    // 4. Validate Damage Type against Plan Covers
    const allowedCovers = plan.covers || ["mirror", "bumper", "scratch_dent"];
    if (!allowedCovers.includes(damage_type)) {
      const damageLabel = DAMAGE_TYPE_LABELS[damage_type] || damage_type;
      return NextResponse.json(
        {
          error: `Your ${plan.plan_name} doesn't cover ${damageLabel.toLowerCase()}. Upgrade next time or choose Protect Plus.`,
        },
        { status: 400 }
      );
    }

    // 5. Prevent duplicate active claim for same damage type on this booking
    const { data: existingClaims } = await supabase
      .from("insurance_claims")
      .select("id, status")
      .eq("booking_id", booking_id)
      .eq("damage_type", damage_type)
      .in("status", ["submitted", "under_review", "approved"]);

    if (existingClaims && existingClaims.length > 0) {
      return NextResponse.json(
        {
          error: `An active claim for ${DAMAGE_TYPE_LABELS[damage_type] || damage_type} is already on file for this booking.`,
        },
        { status: 409 }
      );
    }

    // 6. Compute Estimated Payout: min(max(estimate - deductible, 0), limit)
    const deductible = plan.deductible || 0;
    const limit = plan.coverage_limit || 10000;
    const estimatedPayout = Math.min(Math.max(parsedEstimate - deductible, 0), limit);

    // Filter evidence files to keep only clean file names (up to 5)
    const cleanFiles = Array.isArray(evidence_files)
      ? evidence_files
          .slice(0, 5)
          .map((f: any) => (typeof f === "string" ? f.trim() : f?.name || "photo.jpg"))
          .filter(Boolean)
      : [];

    const claimNumber = generateClaimNumber();

    // 7. Insert Claim
    const { data: newClaim, error: insertErr } = await supabase
      .from("insurance_claims")
      .insert({
        claim_number: claimNumber,
        booking_id,
        plan_id: plan.id,
        claimant_id: user.id,
        damage_type,
        description: description.trim(),
        incident_at: incidentDate.toISOString(),
        estimated_amount: parsedEstimate,
        evidence_files: cleanFiles,
        status: "submitted",
        approved_amount: null,
        resolution_note: null,
      })
      .select()
      .single();

    if (insertErr || !newClaim) {
      console.error("Failed to insert claim:", insertErr);
      return NextResponse.json(
        { error: "Failed to record claim: " + (insertErr?.message || "Unknown error") },
        { status: 500 }
      );
    }

    // Auto-move submitted claim to 'under_review' after 5 seconds in background
    setTimeout(async () => {
      try {
        const updateClient = await createClient();
        await updateClient
          .from("insurance_claims")
          .update({
            status: "under_review",
            updated_at: new Date().toISOString(),
          })
          .eq("id", newClaim.id);
      } catch (autoErr) {
        console.warn("Auto-transition to under_review note:", autoErr);
      }
    }, 5000);

    return NextResponse.json({
      success: true,
      claim: newClaim,
      claim_number: claimNumber,
      plan_name: plan.plan_name,
      deductible,
      coverage_limit: limit,
      estimated_payout: estimatedPayout,
      status: "submitted",
      timeline: [
        { step: "submitted", label: "Submitted", active: true, completed: true, timestamp: new Date().toISOString() },
        { step: "under_review", label: "Under review", active: false, completed: false },
        { step: "decision", label: "Approved / Resolution", active: false, completed: false },
      ],
      message: "Insurance claim successfully submitted. Our team will review within 24 hours.",
    });
  } catch (err: any) {
    console.error("Error creating claim:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to submit claim" },
      { status: 500 }
    );
  }
}
