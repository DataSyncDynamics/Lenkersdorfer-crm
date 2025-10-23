/**
 * Environment Variable Configuration (LEGACY - Use env-runtime.ts instead)
 *
 * IMPORTANT: This file is kept for backward compatibility.
 * For new code, use /src/lib/env-runtime.ts which properly handles
 * browser-side environment variable access in production.
 *
 * The Problem with This Approach:
 * - Lazy initialization doesn't help with build-time variable inlining
 * - Trying multiple sources (process.env, globalThis) adds complexity
 * - Next.js requires DIRECT process.env.VAR_NAME access for proper inlining
 *
 * Migration Path:
 * - Replace: import { env } from '@/lib/env'
 * - With: import { runtimeEnv } from '@/lib/env-runtime'
 * - Or use: import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env-runtime'
 */

import { runtimeEnv } from './env-runtime'

interface EnvironmentConfig {
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
  }
  app: {
    env: 'development' | 'production' | 'test'
    isDevelopment: boolean
    isProduction: boolean
  }
}

/**
 * @deprecated Use runtimeEnv from env-runtime.ts instead
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    supabase: {
      url: runtimeEnv.supabase.url,
      anonKey: runtimeEnv.supabase.anonKey,
      serviceRoleKey: runtimeEnv.supabase.serviceRoleKey,
    },
    app: {
      env: runtimeEnv.app.env,
      isDevelopment: runtimeEnv.app.isDevelopment,
      isProduction: runtimeEnv.app.isProduction,
    }
  }
}

/**
 * @deprecated Use runtimeEnv from env-runtime.ts instead
 */
let _config: EnvironmentConfig | null = null

/**
 * @deprecated Use runtimeEnv from env-runtime.ts instead
 */
export function getConfig(): EnvironmentConfig {
  if (!_config) {
    _config = getEnvironmentConfig()
  }
  return _config
}

/**
 * @deprecated Use runtimeEnv from env-runtime.ts instead
 * Kept for backward compatibility - delegates to runtimeEnv
 */
export const env = runtimeEnv
