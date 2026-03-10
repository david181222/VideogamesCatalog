// Route guard middleware — runs on every request except static assets.
// Three rules applied in order:
//   1. Unauthenticated + protected route  → redirect /login
//   2. Authenticated + auth route          → redirect /
//   3. /admin/* + non-admin role           → redirect /
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // updateSession refreshes the Supabase session cookie and returns the user
  const { supabase, user, supabaseResponse } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Rule 1: unauthenticated users can only access /login and /register
  if (
    !user &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/register')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Rule 2: authenticated users are redirected away from auth pages
  if (
    user &&
    (pathname.startsWith('/login') || pathname.startsWith('/register'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Rule 3: /admin/* requires role = 'admin' in the profiles table
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

// Exclude Next.js internals and static files from middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
