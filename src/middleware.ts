import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware for Authentication & Authorization
 *
 * This middleware:
 * 1. Refreshes expired sessions automatically
 * 2. Protects API routes (except public endpoints)
 * 3. Protects dashboard and client pages
 * 4. Redirects unauthenticated users to login
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - this updates the cookie
  const { data: { session }, error } = await supabase.auth.getSession()

  // Define public endpoints that don't require authentication
  const publicEndpoints = [
    '/api/health',
    '/login',
    '/signup',
    '/auth/callback',
    '/_next',
    '/favicon.ico',
    '/static'
  ]

  // Check if current path is public
  const isPublicEndpoint = publicEndpoints.some(path =>
    req.nextUrl.pathname.startsWith(path)
  )

  // If accessing a public endpoint, allow through
  if (isPublicEndpoint) {
    // If user has session and is accessing login page, redirect to dashboard
    if (session && req.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return res
  }

  // Protect API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    return res
  }

  // Protect all application routes (including home page)
  const protectedRoutes = [
    '/',
    '/dashboard',
    '/clients',
    '/inventory',
    '/waitlist',
    '/allocation',
    '/messages',
    '/analytics',
    '/reminders',
    '/notifications',
    '/import'
  ]

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route === '/') {
      // Exact match for home page
      return req.nextUrl.pathname === '/'
    }
    // Starts with for other routes (includes subroutes like /clients/123)
    return req.nextUrl.pathname.startsWith(route)
  })

  // If this is a protected route and user is not authenticated, redirect to login
  if (isProtectedRoute && !session) {
    console.log('[Middleware] Redirecting unauthenticated user to /login from:', req.nextUrl.pathname)
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If we've made it here and there's no session, something is wrong - deny access
  if (!session) {
    console.log('[Middleware] Denying access to:', req.nextUrl.pathname, '- No session')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}
