import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check user profile role to route appropriately
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        if (!profile || !profile.role) {
          return NextResponse.redirect(new URL("/onboarding", requestUrl.origin))
        }

        if (profile.role === "owner") {
          return NextResponse.redirect(new URL("/owner", requestUrl.origin))
        }

        return NextResponse.redirect(new URL("/driver", requestUrl.origin))
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Return the user to login with an error notification if exchange fails
  return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin))
}
