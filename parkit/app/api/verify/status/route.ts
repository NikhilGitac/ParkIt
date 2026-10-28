import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    await cookies();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    let profile: any = null;
    let vehicles: any[] = [];

    try {
      const { data: pData } = await supabase
        .from("profiles")
        .select("host_status, driver_status, phone, id_type, id_last4, full_name")
        .eq("id", user.id)
        .maybeSingle();
      profile = pData;
    } catch (pErr) {
      console.warn("[GET /api/verify/status] Profile query notice:", pErr);
    }

    try {
      const { data: vData } = await supabase
        .from("vehicles")
        .select("id, plate, type, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      vehicles = vData || [];
    } catch (vErr) {
      console.warn("[GET /api/verify/status] Vehicles query notice:", vErr);
    }

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      host_status: profile?.host_status || "unverified",
      driver_status: profile?.driver_status || "unverified",
      phone: profile?.phone || user.phone || null,
      id_type: profile?.id_type || null,
      id_last4: profile?.id_last4 || null,
      vehicles: vehicles,
    });
  } catch (err: unknown) {
    console.error("[GET /api/verify/status] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
