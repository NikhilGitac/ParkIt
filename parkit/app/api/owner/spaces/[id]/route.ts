import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_PARKING_SPACES } from "@/lib/parking-data";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { is_active, title, price_per_hour, description, address } = body;

    const supabase = await createClient();

    // Prepare update payload
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_active === "boolean") updatePayload.is_active = is_active;
    if (typeof title === "string" && title.trim()) updatePayload.title = title.trim();
    if (typeof price_per_hour === "number" && price_per_hour > 0) updatePayload.price_per_hour = price_per_hour;
    if (typeof description === "string") updatePayload.description = description.trim();
    if (typeof address === "string") updatePayload.address = address.trim();

    // 1. Try updating in Supabase
    const { data: dbData, error } = await supabase
      .from("parking_spaces")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .maybeSingle();

    // 2. Also update in fallback array if present
    const fallbackSpace = FALLBACK_PARKING_SPACES.find((s) => s.id === id);
    if (fallbackSpace) {
      if (typeof is_active === "boolean") fallbackSpace.is_active = is_active;
      if (typeof title === "string" && title.trim()) fallbackSpace.title = title.trim();
      if (typeof price_per_hour === "number" && price_per_hour > 0) fallbackSpace.price_per_hour = price_per_hour;
      if (typeof description === "string") fallbackSpace.description = description.trim();
      if (typeof address === "string") fallbackSpace.address = address.trim();
    }

    if (error && !fallbackSpace) {
      console.warn("Error updating space in Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      space: dbData || fallbackSpace || { id, ...updatePayload },
    });
  } catch (err: any) {
    console.error("Error in PATCH /api/owner/spaces/[id]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update parking space" },
      { status: 500 }
    );
  }
}
