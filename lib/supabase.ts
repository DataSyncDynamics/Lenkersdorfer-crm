/**
 * CANONICAL Supabase Client Configuration
 *
 * CRITICAL: This is the ONLY file that should create Supabase clients.
 * All other files should import from here.
 *
 * Environment variables are inlined by Next.js at BUILD TIME for NEXT_PUBLIC_* vars.
 * Vercel automatically inlines these during the build process.
 */

import { createClient } from '@supabase/supabase-js';

// CRITICAL: Direct access to process.env with proper validation
// Next.js inlines NEXT_PUBLIC_* variables at build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  throw new Error(
    `CRITICAL: Missing required environment variables: ${missing.join(', ')}\n` +
    `These must be set in Vercel project settings for production.\n` +
    `For local development, ensure .env.local exists with these values.`
  );
}

// Client-side Supabase client (safe for browser and server)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Server-side Supabase client with service role key (for API routes only)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey, // Fallback to anon key if service key not set
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Error handling utility
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string,
    public hint?: string
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export function handleSupabaseError(error: any): SupabaseError {
  if (error?.code) {
    return new SupabaseError(
      error.message || 'Database operation failed',
      error.code,
      error.details,
      error.hint
    );
  }
  return new SupabaseError(error?.message || 'Unknown database error');
}

// Performance monitoring
export async function withPerformanceLogging<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    if (duration > 100) {
      console.warn(`Slow query detected: ${operation} took ${duration}ms`);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Query failed: ${operation} took ${duration}ms`, error);
    throw error;
  }
}

// Export default for convenience
export default supabase;