import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { env } from '@/lib/env'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  const { url, anonKey: key } = env.supabase

  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const { url, serviceRoleKey: serviceKey } = env.supabase

  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin operations. ' +
      'This key should only be used in server-side code and never exposed to the client.'
    )
  }

  return createServerClient<Database>(
    url,
    serviceKey,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      },
    }
  )
}
