import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

function isConfigured(url?: string, key?: string): boolean {
  if (!url || !key) return false
  if (url.includes("your_supabase_project_url") || url.includes("placeholder-project")) return false
  if (key.includes("your_supabase_anon_key") || key.includes("placeholder-anon-key")) return false
  return url.startsWith("http://") || url.startsWith("https://")
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!isConfigured(supabaseUrl, supabaseAnonKey)) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Protected routes: /driver, /owner/dashboard, /onboarding
    // Note: /owner/list-space allows pre-login drafting or driver-to-owner listing
    const isProtected =
      pathname.startsWith("/driver") ||
      pathname.startsWith("/owner/dashboard") ||
      pathname === "/owner" ||
      pathname.startsWith("/onboarding")

    if (!user && isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }

    // Redirect logged-in users away from auth pages
    if (user && (pathname === "/login" || pathname === "/signup")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const url = request.nextUrl.clone()
      if (!profile || !profile.role) {
        url.pathname = "/onboarding"
      } else if (profile.role === "owner") {
        url.pathname = "/owner/dashboard"
      } else {
        url.pathname = "/driver"
      }
      return NextResponse.redirect(url)
    }

    // Role validation on protected portals
    if (user && (pathname.startsWith("/driver") || pathname === "/owner" || pathname.startsWith("/owner/dashboard"))) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      if (!profile || !profile.role) {
        const url = request.nextUrl.clone()
        url.pathname = "/onboarding"
        return NextResponse.redirect(url)
      }

      if (pathname.startsWith("/driver") && profile.role !== "driver") {
        const url = request.nextUrl.clone()
        url.pathname = "/owner/dashboard"
        return NextResponse.redirect(url)
      }

      if ((pathname === "/owner" || pathname.startsWith("/owner/dashboard")) && profile.role !== "owner") {
        const url = request.nextUrl.clone()
        url.pathname = "/driver"
        return NextResponse.redirect(url)
      }
    }
  } catch (err) {
    // Gracefully fallback on any connection / network error
    console.error("Supabase middleware error:", err)
    return supabaseResponse
  }

  return supabaseResponse
}
