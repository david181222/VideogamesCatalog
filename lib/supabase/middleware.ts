// Supabase client for use inside Next.js Middleware (Edge Runtime).
// Unlike the server client, this variant reads/writes cookies from the
// incoming request and propagates them to the outgoing response so the
// session token is always refreshed on every request.
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write to both request (for current handler) and response (for browser)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() validates the JWT against Supabase Auth server.
  // More secure than getSession() which only reads the local cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user, supabaseResponse }
}
