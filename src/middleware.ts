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

  // Get environment variables - they MUST be accessed directly for Vercel edge runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If environment variables are missing in edge runtime, log and allow through
  // The error will be caught and displayed at the component level
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Middleware] CRITICAL: Missing Supabase environment variables in edge runtime')
    console.error('[Middleware] URL present:', !!supabaseUrl)
    console.error('[Middleware] Key present:', !!supabaseAnonKey)
    console.error('[Middleware] This indicates variables were not set at build time')
    return res
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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

  if (error) {
    console.error('[Middleware] Error getting session:', error.message)
  }

  // Log session status for debugging (only for non-static assets)
  if (!req.nextUrl.pathname.startsWith('/_next')) {
    console.log('[Middleware]', {
      path: req.nextUrl.pathname,
      hasSession: !!session,
      userId: session?.user?.id?.substring(0, 8) || 'none'
    })
  }

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
      console.log('[Middleware] User has session on /login, redirecting to dashboard')
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
