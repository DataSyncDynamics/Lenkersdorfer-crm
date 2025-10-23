/**
 * Runtime Environment Variable Access
 *
 * CRITICAL: This file solves the browser environment variable access problem.
 *
 * The Issue:
 * - Next.js requires NEXT_PUBLIC_* variables to be present at BUILD TIME
 * - Vercel builds in a separate environment from where the app runs
 * - The env{} property in next.config.js is DEPRECATED in Next.js 14+
 *
 * The Solution:
 * - Use direct process.env.VARIABLE_NAME access (gets inlined at build time)
 * - This file creates typed accessors that work in BOTH server AND browser
 * - Variables are inlined as string literals during webpack compilation
 */

/**
 * Get Supabase URL - works in browser AND server
 * This will be replaced with the actual value at build time
 */
export function getSupabaseUrl(): string {
  // Direct access gets inlined by Next.js webpack at BUILD TIME
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!url) {
    throw new Error(
      `CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not defined.\n` +
      `Context: ${typeof window !== 'undefined' ? 'browser' : 'server'}\n` +
      `This must be set in Vercel environment variables BEFORE build.\n\n` +
      `To fix:\n` +
      `1. Go to Vercel project settings\n` +
      `2. Add NEXT_PUBLIC_SUPABASE_URL to Environment Variables\n` +
      `3. Redeploy (trigger new build)`
    )
  }

  return url
}

/**
 * Get Supabase Anon Key - works in browser AND server
 * This will be replaced with the actual value at build time
 */
export function getSupabaseAnonKey(): string {
  // Direct access gets inlined by Next.js webpack at BUILD TIME
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!key) {
    throw new Error(
      `CRITICAL: NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined.\n` +
      `Context: ${typeof window !== 'undefined' ? 'browser' : 'server'}\n` +
      `This must be set in Vercel environment variables BEFORE build.\n\n` +
      `To fix:\n` +
      `1. Go to Vercel project settings\n` +
      `2. Add NEXT_PUBLIC_SUPABASE_ANON_KEY to Environment Variables\n` +
      `3. Redeploy (trigger new build)`
    )
  }

  return key
}

/**
 * Get Service Role Key (server-side only)
 */
export function getSupabaseServiceRoleKey(): string | undefined {
  // This won't work in browser (and shouldn't - it's a secret)
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Export configuration object for compatibility
 */
export const runtimeEnv = {
  supabase: {
    get url() { return getSupabaseUrl() },
    get anonKey() { return getSupabaseAnonKey() },
    get serviceRoleKey() { return getSupabaseServiceRoleKey() }
  },
  app: {
    get isDevelopment() { return isDevelopment() },
    get isProduction() { return isProduction() },
    get env() { return process.env.NODE_ENV as 'development' | 'production' | 'test' }
  }
}
