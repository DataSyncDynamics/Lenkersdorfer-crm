import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { getSupabaseUrl, getSupabaseAnonKey, isDevelopment } from '@/lib/env-runtime'

/**
 * Supabase Client - Browser-safe initialization
 *
 * CRITICAL CHANGE: Now uses direct process.env access via env-runtime.ts
 * This ensures environment variables are properly inlined at BUILD TIME
 * and accessible in BOTH browser AND server contexts in production.
 */

// Lazy initialization to avoid duplicate instances
let supabaseInstance: SupabaseClient<Database> | null = null

function getSupabaseClient(): SupabaseClient<Database> {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance
  }

  // CRITICAL: Direct function calls get inlined at build time
  const supabaseUrl = getSupabaseUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  // Log successful initialization (browser only, dev mode)
  if (typeof window !== 'undefined' && isDevelopment()) {
    console.info('[Supabase Client] Initialized', {
      url: `${supabaseUrl.substring(0, 30)}...`,
      context: 'browser',
      timestamp: new Date().toISOString()
    })
  }

  // Create and cache the client instance
  supabaseInstance = createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'lenkersdorfer-crm',
        },
      },
    }
  )

  return supabaseInstance
}

// Export a getter that lazy-initializes the client
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof SupabaseClient<Database>]

    // Bind functions to maintain correct 'this' context
    if (typeof value === 'function') {
      return value.bind(client)
    }

    return value
  }
})

// Export type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updateable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
