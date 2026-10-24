import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return false
  if (url.includes("your_supabase_project_url") || url.includes("placeholder-project")) return false
  if (key.includes("your_supabase_anon_key") || key.includes("placeholder-anon-key")) return false
  return url.startsWith("http://") || url.startsWith("https://")
}

function getCredentials() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co"
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://placeholder-project.supabase.co"
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
  return { url, key }
}

export async function createClient() {
  const cookieStore = await cookies()
  const { url, key } = getCredentials()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignored if called from a Server Component
        }
      },
    },
  })
}
