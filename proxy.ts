import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // These endpoints already enforce role/auth server-side; skip proxy refresh work to cut latency.
  if (pathname.startsWith('/api/admin/')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // This refreshes the session if expired - required for Server Components
  try {
    const hasSupabaseAuthCookie = request.cookies
      .getAll()
      .some((cookie) => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))

    if (hasSupabaseAuthCookie) {
      await supabase.auth.getUser()
    }
  } catch (error) {
    // "Refresh Token Not Found" is expected when user has no active session
    const isExpectedNoSession = error instanceof Error && 
      error.message?.includes('Refresh Token Not Found')
    
    if (isExpectedNoSession) {
      console.debug('Auth refresh attempted with no valid session')
    } else {
      console.error('Unexpected auth error in proxy:', error)
    }
  }
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|__server_sent_events__|api/auth/audit|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)',
  ],
}
