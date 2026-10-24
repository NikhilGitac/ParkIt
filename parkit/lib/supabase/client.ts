import { createBrowserClient } from "@supabase/ssr"

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

export function createClient() {
  const { url, key } = getCredentials()
  return createBrowserClient(url, key)
}
