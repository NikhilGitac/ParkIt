import { createBrowserClient } from "@supabase/ssr"

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
