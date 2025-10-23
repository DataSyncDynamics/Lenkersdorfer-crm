import { NextResponse } from 'next/server'

/**
 * Environment Debug Endpoint
 *
 * SECURITY: This endpoint should be REMOVED or PROTECTED in production!
 * It's only for debugging the environment variable issue.
 *
 * Access: GET /api/debug/env
 */
export async function GET() {
  // Only allow in development or if explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development'
  const debugEnabled = process.env.ENABLE_DEBUG_ENDPOINT === 'true'

  if (!isDevelopment && !debugEnabled) {
    return NextResponse.json(
      { error: 'Debug endpoint is disabled in production' },
      { status: 403 }
    )
  }

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const envStatus = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    runtime: 'server',
    environmentVariables: {
      NEXT_PUBLIC_SUPABASE_URL: {
        isSet: !!supabaseUrl,
        value: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET',
        length: supabaseUrl?.length || 0,
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        isSet: !!supabaseAnonKey,
        value: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET',
        length: supabaseAnonKey?.length || 0,
      }
    },
    verdict: (supabaseUrl && supabaseAnonKey) ? 'HEALTHY' : 'MISSING VARIABLES'
  }

  return NextResponse.json(envStatus, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    }
  })
}
