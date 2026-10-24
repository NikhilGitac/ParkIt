import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://"))) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
        )
      },
    },
  })

  // IMPORTANT: Do NOT run code between createServerClient and supabase.auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes: /driver, /owner, /onboarding
  const isProtected =
    pathname.startsWith("/driver") ||
    pathname.startsWith("/owner") ||
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
      url.pathname = "/owner"
    } else {
      url.pathname = "/driver"
    }
    return NextResponse.redirect(url)
  }

  // Role validation on protected portals
  if (user && (pathname.startsWith("/driver") || pathname.startsWith("/owner"))) {
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
      url.pathname = "/owner"
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith("/owner") && profile.role !== "owner") {
      const url = request.nextUrl.clone()
      url.pathname = "/driver"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
