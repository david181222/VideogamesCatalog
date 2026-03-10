// Browser-side Supabase client — used inside Client Components ('use client').
// createBrowserClient reads env vars at runtime from the window's global env.
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
