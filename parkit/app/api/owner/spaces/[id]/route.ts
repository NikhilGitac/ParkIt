import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // 1. Enforce authenticated session on the server
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in as a host to update this space." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { is_active, title, price_per_hour, description, address } = body;

    // Prepare update payload
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_active === "boolean") updatePayload.is_active = is_active;
    if (typeof title === "string" && title.trim()) updatePayload.title = title.trim();
    if (typeof price_per_hour === "number" && price_per_hour > 0) updatePayload.price_per_hour = price_per_hour;
    if (typeof description === "string") updatePayload.description = description.trim();
    if (typeof address === "string") updatePayload.address = address.trim();

    // 2. Update only if space belongs to the authenticated user
    const { data: dbData, error } = await supabase
      .from("parking_spaces")
      .update(updatePayload)
      .eq("id", id)
      .eq("owner_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating space in Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!dbData) {
      return NextResponse.json(
        { error: "Parking space not found or you do not have permission to edit it." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      space: dbData,
    });
  } catch (err: any) {
    console.error("Error in PATCH /api/owner/spaces/[id]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update parking space" },
      { status: 500 }
    );
  }
}
