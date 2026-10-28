import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_INSURANCE_PLANS } from "@/lib/insurance-data";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: plans, error } = await supabase
      .from("insurance_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !plans || plans.length === 0) {
      return NextResponse.json({
        success: true,
        plans: FALLBACK_INSURANCE_PLANS,
      });
    }

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (err) {
    console.warn("Notice loading insurance plans, using fallback:", err);
    return NextResponse.json({
      success: true,
      plans: FALLBACK_INSURANCE_PLANS,
    });
  }
}
