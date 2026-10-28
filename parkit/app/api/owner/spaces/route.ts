
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Enforce authenticated host session on the server
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("[POST /api/owner/spaces] Unauthenticated request rejected with 401.");
      return NextResponse.json(
        { error: "Unauthorized. Please log in to publish a parking space." },
        { status: 401 }
      );
    }

    // Strictly derive owner_id from server session
    const ownerId = user.id;

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const {
      title,
      description = "",
      latitude,
      longitude,
      price_per_hour,
      photo_url,
      photoUrl,
      house_no,
      building_name = "",
      street,
      landmark = "",
      city,
      state,
      pincode,
      space_type = "Home",
      vehicle_types = ["Car"],
      total_slots = 1,
      entry_instructions = "",
      contact_phone,
      amenities = [],
      availability_slots = [],
      max_vehicle_type = "suv",
      verified_host = false,
      has_cctv = false,
      cctv_coverage = null,
      has_guard = false,
      guard_hours = null,
      has_entry_control = false,
      entry_control_type = null,
      manual_checkin = false,
      manual_checkin_by = null,
      security_score = 0,
      ownership_proof_name = null,
    } = body;

    // 2. Comprehensive Server-Side Validation
    const errors: Record<string, string> = {};

    if (!title || typeof title !== "string" || !title.trim()) {
      errors.title = "Space title is required.";
    }

    const priceNum = parseFloat(price_per_hour);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price_per_hour = "Hourly rate must be a positive number.";
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum) || latNum === 0 || lngNum === 0) {
      errors.location = "Valid map coordinates (latitude and longitude) are required.";
    }

    if (!house_no || typeof house_no !== "string" || !house_no.trim()) {
      errors.house_no = "House / Flat / Shop / Plot number is required.";
    }

    if (!street || typeof street !== "string" || !street.trim()) {
      errors.street = "Street / Area / Sector is required.";
    }

    if (!city || typeof city !== "string" || !city.trim()) {
      errors.city = "City is required.";
    }

    if (!state || typeof state !== "string" || !state.trim()) {
      errors.state = "State is required.";
    }

    const pinStr = String(pincode || "").trim();
    if (!pinStr || !/^[1-9][0-9]{5}$/.test(pinStr)) {
      errors.pincode = "Enter a valid 6-digit Indian postal code.";
    }

    const validSpaceTypes = ["Home", "Office", "Shop", "Banquet hall", "Coaching institute", "Other"];
    if (!validSpaceTypes.includes(space_type)) {
      errors.space_type = `Invalid space type. Must be one of: ${validSpaceTypes.join(", ")}`;
    }

    if (!Array.isArray(vehicle_types) || vehicle_types.length === 0) {
      errors.vehicle_types = "At least one allowed vehicle type must be selected.";
    }

    const slotsNum = parseInt(String(total_slots), 10);
    if (isNaN(slotsNum) || slotsNum < 1) {
      errors.total_slots = "Total parking slots must be at least 1.";
    }

    if (entry_instructions && entry_instructions.length > 200) {
      errors.entry_instructions = "Entry instructions must be 200 characters or fewer.";
    }

    // Validate 10-digit Indian phone (optionally with +91)
    const cleanPhone = String(contact_phone || "").replace(/\D/g, "");
    const last10Phone = cleanPhone.slice(-10);
    if (!last10Phone || !/^[6-9]\d{9}$/.test(last10Phone)) {
      errors.contact_phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (Object.keys(errors).length > 0) {
      console.warn("[POST /api/owner/spaces] Validation failed:", errors);
      return NextResponse.json(
        { error: "Validation failed. Please correct the highlighted errors.", validation_errors: errors },
        { status: 400 }
      );
    }

    // 3. Compose standard full address for backwards compatibility (search, map, recommendations)
    const composedAddress = [
      house_no.trim(),
      building_name?.trim() || null,
      street.trim(),
      landmark?.trim() || null,
      city.trim(),
      state.trim(),
      pinStr,
    ]
      .filter(Boolean)
      .join(", ");

    const formattedPhone = `+91 ${last10Phone}`;

    // Ensure host role on profile to satisfy RLS owner policies
    try {
      await supabase.from("profiles").upsert(
        {
          id: ownerId,
          role: "owner",
          phone: formattedPhone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (e) {
      console.warn("[POST /api/owner/spaces] Profile update note:", e);
    }

    // Check if host profile has verified status
    let isHostVerified = Boolean(verified_host);
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("host_status")
        .eq("id", ownerId)
        .maybeSingle();
      if (prof?.host_status === "verified") {
        isHostVerified = true;
      }
    } catch (e) {
      // ignore
    }

    const normMaxVehicle = ["bike", "hatchback", "sedan", "suv"].includes(String(max_vehicle_type || "").toLowerCase())
      ? String(max_vehicle_type).toLowerCase()
      : "suv";

    // 4. Atomic Execution: Try Postgres RPC first
    const spacePayload = {
      owner_id: ownerId,
      owner_name: user.user_metadata?.full_name || "Verified Host",
      title: title.trim(),
      description: description.trim(),
      address: composedAddress,
      latitude: latNum,
      longitude: lngNum,
      price_per_hour: priceNum,
      photo_url: (photo_url || photoUrl)?.trim() || "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
      house_no: house_no.trim(),
      building_name: building_name.trim(),
      street: street.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pinStr,
      space_type,
      vehicle_types,
      max_vehicle_type: normMaxVehicle,
      verified_host: isHostVerified,
      total_slots: slotsNum,
      entry_instructions: entry_instructions.trim(),
      contact_phone: formattedPhone,
      amenities: Array.isArray(amenities) ? amenities : [],
    };

    const availabilityPayload = Array.isArray(availability_slots)
      ? availability_slots.map((s: any) => ({
          day_of_week: Number(s.dayOfWeek ?? s.day_of_week ?? 1),
          start_time: s.startTime ?? s.start_time ?? "06:00",
          end_time: s.endTime ?? s.end_time ?? "23:00",
        }))
      : [];

    let createdSpace: any = null;

    // Try transactional RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "create_parking_space_with_availability",
      {
        p_space: spacePayload,
        p_availability: availabilityPayload,
      }
    );

    if (!rpcError && rpcData) {
      createdSpace = rpcData;
    } else {
      if (rpcError) {
        console.warn("[POST /api/owner/spaces] RPC attempt error:", {
          message: rpcError.message,
          code: rpcError.code,
          details: rpcError.details,
          hint: rpcError.hint,
        });
      }

      // Fallback: Transactional route execution with automatic rollback if availability fails
      console.log("[POST /api/owner/spaces] Falling back to transactional table operations...");
      const { data: spaceData, error: spaceErr } = await supabase
        .from("parking_spaces")
        .insert({
          owner_id: ownerId,
          title: spacePayload.title,
          description: spacePayload.description,
          address: spacePayload.address,
          latitude: spacePayload.latitude,
          longitude: spacePayload.longitude,
          price_per_hour: spacePayload.price_per_hour,
          photo_url: spacePayload.photo_url,
          is_active: true,
          house_no: spacePayload.house_no,
          building_name: spacePayload.building_name,
          street: spacePayload.street,
          landmark: spacePayload.landmark,
          city: spacePayload.city,
          state: spacePayload.state,
          pincode: spacePayload.pincode,
          space_type: spacePayload.space_type,
          vehicle_types: spacePayload.vehicle_types,
          total_slots: spacePayload.total_slots,
          entry_instructions: spacePayload.entry_instructions,
          contact_phone: spacePayload.contact_phone,
          amenities: spacePayload.amenities,
          max_vehicle_type: spacePayload.max_vehicle_type,
          verified_host: spacePayload.verified_host,
        })
        .select()
        .single();

      let targetSpaceData = spaceData;
      if (
        spaceErr &&
        (spaceErr.code === "PGRST204" ||
          spaceErr.code === "42703" ||
          spaceErr.message?.toLowerCase().includes("column"))
      ) {
        console.warn("[POST /api/owner/spaces] Detailed columns not yet added to remote database (migration pending). Inserting with core schema columns and composed address...");
        const { data: baseSpaceData, error: baseErr } = await supabase
          .from("parking_spaces")
          .insert({
            owner_id: ownerId,
            title: spacePayload.title,
            description: spacePayload.description,
            address: spacePayload.address,
            latitude: spacePayload.latitude,
            longitude: spacePayload.longitude,
            price_per_hour: spacePayload.price_per_hour,
            photo_url: spacePayload.photo_url,
            is_active: true,
          })
          .select()
          .single();

        if (baseErr) {
          console.error("[POST /api/owner/spaces] Core insert error:", baseErr);
          return NextResponse.json(
            {
              error: `Failed to save parking space: ${baseErr.message}`,
              code: baseErr.code,
              details: baseErr.details,
            },
            { status: 500 }
          );
        }
        targetSpaceData = baseSpaceData;
      } else if (spaceErr) {
        console.error("[POST /api/owner/spaces] Database error inserting parking_spaces:", {
          message: spaceErr.message,
          code: spaceErr.code,
          details: spaceErr.details,
          hint: spaceErr.hint,
        });
        return NextResponse.json(
          {
            error: `Failed to save parking space: ${spaceErr.message}`,
            code: spaceErr.code,
            details: spaceErr.details,
          },
          { status: 500 }
        );
      }

      createdSpace = targetSpaceData;
      const spaceId = targetSpaceData.id;

      // Insert availability rows
      if (availabilityPayload.length > 0) {
        const rows = availabilityPayload.map((slot: any) => ({
          space_id: spaceId,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
        }));

        const { error: availErr } = await supabase.from("space_availability").insert(rows);

        if (availErr) {
          console.error("[POST /api/owner/spaces] Availability insert failed. Rolling back space:", {
            message: availErr.message,
            code: availErr.code,
            details: availErr.details,
          });

          // ROLLBACK: Delete space to avoid half-saved listing
          await supabase.from("parking_spaces").delete().eq("id", spaceId);

          return NextResponse.json(
            {
              error: `Failed to save weekly availability: ${availErr.message}. Listing was not published.`,
              code: availErr.code,
            },
            { status: 500 }
          );
        }
      }
    }

    console.log(`✅ [POST /api/owner/spaces] Successfully published space ${createdSpace.id} for owner ${ownerId}`);

    return NextResponse.json(
      {
        success: true,
        space: createdSpace,
        message: "Parking space published successfully!",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    console.error("[POST /api/owner/spaces] Unexpected server exception:", {
      message: errorObj.message,
      stack: errorObj.stack,
    });
    return NextResponse.json(
      {
        error: `Unexpected error publishing listing: ${errorObj.message}`,
      },
      { status: 500 }
    );
  }
}
