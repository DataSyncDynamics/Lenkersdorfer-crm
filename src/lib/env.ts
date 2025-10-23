/**
 * Environment Variable Configuration
 *
 * This module provides type-safe access to environment variables
 * with runtime validation and detailed error reporting.
 */

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
 * Get environment variable with validation
 */
function getEnvVar(name: string, required: boolean = true): string | undefined {
  // Try multiple sources for environment variables
  const value =
    // 1. Try process.env (works in Node.js contexts)
    process.env[name] ||
    // 2. Try globalThis for browser contexts (Vercel inlines these)
    (typeof globalThis !== 'undefined' && (globalThis as any)[name]) ||
    undefined

  if (required && !value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Context: ${typeof window !== 'undefined' ? 'browser' : 'server'}\n` +
      `Node ENV: ${process.env.NODE_ENV}\n` +
      `\nPlease ensure this variable is set in:\n` +
      `- .env.local (for local development)\n` +
      `- Vercel project settings (for production)`
    )
  }

  return value
}

/**
 * Validate and return environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', true)!
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true)!
  const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', false)

  const nodeEnv = process.env.NODE_ENV || 'development'

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceKey,
    },
    app: {
      env: nodeEnv as 'development' | 'production' | 'test',
      isDevelopment: nodeEnv === 'development',
      isProduction: nodeEnv === 'production',
    }
  }
}

/**
 * Export individual config values for convenience
 */
let _config: EnvironmentConfig | null = null

export function getConfig(): EnvironmentConfig {
  if (!_config) {
    _config = getEnvironmentConfig()
  }
  return _config
}

// Export for direct access (with lazy initialization)
export const env = {
  get supabase() {
    return getConfig().supabase
  },
  get app() {
    return getConfig().app
  }
}
