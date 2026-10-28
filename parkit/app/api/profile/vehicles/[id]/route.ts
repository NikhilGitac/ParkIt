import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await cookies();
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required to delete vehicles." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Vehicle ID is required." },
        { status: 400 }
      );
    }

    const { error: deleteErr } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);

    if (deleteErr) {
      return NextResponse.json(
        { error: deleteErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle removed successfully.",
    });
  } catch (err: any) {
    console.error("Error in DELETE /api/profile/vehicles/[id]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to remove vehicle." },
      { status: 500 }
    );
  }
}
