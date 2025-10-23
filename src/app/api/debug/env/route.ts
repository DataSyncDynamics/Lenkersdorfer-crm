import { NextResponse } from 'next/server'
import { getSupabaseUrl, getSupabaseAnonKey, isDevelopment, isProduction } from '@/lib/env-runtime'

/**
 * Environment Debug Endpoint
 *
 * Tests environment variable access in BOTH server AND browser contexts.
 * This endpoint verifies that NEXT_PUBLIC_* variables are properly inlined.
 *
 * Access: GET /api/debug/env
 */
export async function GET() {
  // Only allow in development or if explicitly enabled
  const debugEnabled = process.env.ENABLE_DEBUG_ENDPOINT === 'true'

  if (isProduction() && !debugEnabled) {
    return NextResponse.json(
      { error: 'Debug endpoint is disabled in production. Set ENABLE_DEBUG_ENDPOINT=true to enable.' },
      { status: 403 }
    )
  }

  try {
    // Test 1: Direct process.env access
    const supabaseUrlDirect = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKeyDirect = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Test 2: Function wrapper access (env-runtime.ts)
    const supabaseUrlFunction = getSupabaseUrl()
    const supabaseAnonKeyFunction = getSupabaseAnonKey()

    const envStatus = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isDevelopment: isDevelopment(),
        isProduction: isProduction(),
        runtime: 'server'
      },
      tests: {
        directAccess: {
          NEXT_PUBLIC_SUPABASE_URL: {
            isSet: !!supabaseUrlDirect,
            preview: supabaseUrlDirect ? `${supabaseUrlDirect.substring(0, 40)}...` : 'NOT SET',
            length: supabaseUrlDirect?.length || 0,
          },
          NEXT_PUBLIC_SUPABASE_ANON_KEY: {
            isSet: !!supabaseAnonKeyDirect,
            preview: supabaseAnonKeyDirect ? `${supabaseAnonKeyDirect.substring(0, 40)}...` : 'NOT SET',
            length: supabaseAnonKeyDirect?.length || 0,
          }
        },
        functionAccess: {
          getSupabaseUrl: {
            isSet: !!supabaseUrlFunction,
            preview: supabaseUrlFunction ? `${supabaseUrlFunction.substring(0, 40)}...` : 'NOT SET',
            length: supabaseUrlFunction?.length || 0,
          },
          getSupabaseAnonKey: {
            isSet: !!supabaseAnonKeyFunction,
            preview: supabaseAnonKeyFunction ? `${supabaseAnonKeyFunction.substring(0, 40)}...` : 'NOT SET',
            length: supabaseAnonKeyFunction?.length || 0,
          }
        }
      },
      verdict: (supabaseUrlDirect && supabaseAnonKeyDirect && supabaseUrlFunction && supabaseAnonKeyFunction)
        ? 'ALL TESTS PASSED - Environment variables are accessible'
        : 'FAILED - Some variables are missing',
      notes: [
        'Direct access tests: process.env.VARIABLE_NAME',
        'Function access tests: getSupabaseUrl() and getSupabaseAnonKey()',
        'Both should return the same values',
        'If this endpoint works but browser fails, check browser console for errors'
      ]
    }

    return NextResponse.json(envStatus, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Environment variable access failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, {
      status: 500,
    })
  }
}
