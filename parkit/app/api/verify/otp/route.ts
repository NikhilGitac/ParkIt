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
        { error: "Authentication required to verify phone number." },
        { status: 401 }
      );
    }

    // Artificial delay for realistic demo experience (1.2s)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const body = await request.json().catch(() => ({}));
    const { phone, code } = body;

    // Validate 10-digit Indian mobile number
    const cleanPhone = String(phone || "").replace(/\D/g, "").slice(-10);
    if (!cleanPhone || !/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        {
          error:
            "Invalid mobile number. Please enter a valid 10-digit Indian phone number starting with 6-9.",
        },
        { status: 400 }
      );
    }

    // If OTP code is submitted for verification
    if (code !== undefined && code !== null) {
      const cleanCode = String(code).trim();
      if (!/^[0-9]{6}$/.test(cleanCode)) {
        return NextResponse.json(
          { error: "Invalid OTP. Please enter a valid 6-digit verification code." },
          { status: 400 }
        );
      }

      // Any 6-digit code passes in demo mode (hint 123456)
      const formattedPhone = `+91 ${cleanPhone}`;

      // Update phone on profile if profiles table exists
      try {
        await supabase
          .from("profiles")
          .update({
            phone: formattedPhone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      } catch (e) {
        console.warn("[POST /api/verify/otp] Non-fatal profile phone update note:", e);
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: "Mobile number verified successfully (Demo mode).",
        phone: formattedPhone,
      });
    }

    // If requesting OTP send
    return NextResponse.json({
      success: true,
      message: "Demo OTP dispatched. Use test code 123456.",
      hint: "123456",
      phone: `+91 ${cleanPhone}`,
    });
  } catch (err: unknown) {
    console.error("[POST /api/verify/otp] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
