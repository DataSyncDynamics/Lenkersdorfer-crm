import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env-runtime'

/**
 * Browser Supabase Client with Cookie Storage
 *
 * CRITICAL: This client uses cookies instead of localStorage
 * so that server-side middleware can read the session.
 *
 * This solves the redirect issue where:
 * 1. User logs in (session stored in cookies)
 * 2. Page redirects to dashboard
 * 3. Middleware reads cookies and allows access
 */

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  browserClient = createBrowserClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  )

  return browserClient
}

// Export a convenient singleton
export const supabaseBrowser = getSupabaseBrowserClient()
