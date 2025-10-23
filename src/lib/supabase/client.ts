import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { env } from '@/lib/env'

// Lazy initialization to avoid build-time errors on Vercel
let supabaseInstance: SupabaseClient<Database> | null = null

function getSupabaseClient(): SupabaseClient<Database> {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Use centralized environment configuration with validation
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = env.supabase

  // Log successful initialization (browser only)
  if (typeof window !== 'undefined' && env.app.isDevelopment) {
    console.info('[Supabase Client] Initialized', {
      url: `${supabaseUrl.substring(0, 30)}...`,
      context: 'browser'
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
