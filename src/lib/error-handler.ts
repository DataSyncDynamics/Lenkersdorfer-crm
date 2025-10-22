import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// Generic error messages that don't leak implementation details
const GENERIC_ERRORS = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION: 'Invalid request data',
  DATABASE: 'Unable to process request',
  INTERNAL: 'Internal server error',
  RATE_LIMIT: 'Too many requests',
}

export interface ErrorContext {
  code?: string
  userId?: string
  endpoint?: string
  timestamp?: Date
}

// Safe error response - never exposes internal details
export function createErrorResponse(
  error: unknown,
  context?: ErrorContext
): NextResponse {
  // Log full error server-side (for debugging)
  const errorLog = {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : error,
    context,
    timestamp: new Date().toISOString(),
  }

  console.error('[ERROR]', JSON.stringify(errorLog, null, 2))

  // Zod validation errors - safe to return detailed info
  if (error instanceof ZodError) {
    return NextResponse.json({
      error: GENERIC_ERRORS.VALIDATION,
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    }, { status: 400 })
  }

  // Supabase errors - sanitize messages
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any

    // Map common Supabase error codes to user-friendly messages
    const errorMap: Record<string, { message: string; status: number }> = {
      '23505': { message: 'A record with this information already exists', status: 409 },
      '23503': { message: 'Related record not found', status: 404 },
      'PGRST116': { message: 'Resource not found', status: 404 },
      '42P01': { message: GENERIC_ERRORS.DATABASE, status: 500 },
    }

    const mapped = errorMap[dbError.code]
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status })
    }
  }

  // Default: Generic error message
  return NextResponse.json(
    { error: GENERIC_ERRORS.INTERNAL },
    { status: 500 }
  )
}

// Type-safe error checking
export function isAuthError(error: unknown): boolean {
  return error && typeof error === 'object' && 'message' in error &&
         (error as any).message?.includes('auth')
}

export function isDatabaseError(error: unknown): boolean {
  return error && typeof error === 'object' && 'code' in error
}
