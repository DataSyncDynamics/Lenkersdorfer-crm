/**
 * Audit Logging Utility
 * Phase 4: Security Remediation - Comprehensive Audit Trail
 *
 * Provides functions for logging security and business-critical events
 * to the audit_logs table via Supabase RPC.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'ALLOCATE'

export interface AuditLogEntry {
  action: AuditAction
  tableName: string
  recordId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an audit event to the database
 * This function is fail-safe - it will not throw errors if audit logging fails
 *
 * @param entry - The audit log entry to record
 * @returns Promise<string | null> - The audit log ID if successful, null if failed
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.rpc('log_audit_event', {
      p_action: entry.action,
      p_table_name: entry.tableName,
      p_record_id: entry.recordId || null,
      p_old_values: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
      p_new_values: entry.newValues ? JSON.stringify(entry.newValues) : null,
      p_ip_address: entry.ipAddress || null,
      p_user_agent: entry.userAgent || null,
    })

    if (error) {
      // Don't fail the request if audit logging fails
      console.error('[AUDIT] Failed to log audit event:', {
        action: entry.action,
        table: entry.tableName,
        error: error.message
      })
      return null
    }

    return data as string
  } catch (error) {
    // Catch any unexpected errors and log them
    console.error('[AUDIT] Unexpected error logging audit event:', error)
    return null
  }
}

/**
 * Extract client IP address from NextRequest headers
 * Handles various proxy configurations (Vercel, Cloudflare, etc.)
 *
 * @param request - The Next.js request object
 * @returns string | undefined - The client IP address
 */
export function getClientIP(request: Request): string | undefined {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2)
    // The first one is the original client IP
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }

  return undefined
}

/**
 * Extract user agent from NextRequest headers
 *
 * @param request - The Next.js request object
 * @returns string | undefined - The user agent string
 */
export function getUserAgent(request: Request): string | undefined {
  const userAgent = request.headers.get('user-agent')
  return userAgent || undefined
}

/**
 * Create a complete audit log entry from a request
 * Convenience function that extracts IP and user agent automatically
 *
 * @param request - The Next.js request object
 * @param action - The audit action type
 * @param tableName - The table being modified
 * @param recordId - Optional record ID
 * @param oldValues - Optional old values (for updates/deletes)
 * @param newValues - Optional new values (for creates/updates)
 * @returns AuditLogEntry
 */
export function createAuditEntry(
  request: Request,
  action: AuditAction,
  tableName: string,
  recordId?: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>
): AuditLogEntry {
  return {
    action,
    tableName,
    recordId,
    oldValues,
    newValues,
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request)
  }
}

/**
 * Log a client creation event
 */
export async function logClientCreated(
  request: Request,
  clientId: string,
  clientData: Record<string, any>
): Promise<string | null> {
  return logAuditEvent(
    createAuditEntry(request, 'CREATE', 'clients', clientId, undefined, clientData)
  )
}

/**
 * Log a client update event
 */
export async function logClientUpdated(
  request: Request,
  clientId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>
): Promise<string | null> {
  return logAuditEvent(
    createAuditEntry(request, 'UPDATE', 'clients', clientId, oldData, newData)
  )
}

/**
 * Log a client deletion event
 */
export async function logClientDeleted(
  request: Request,
  clientId: string,
  clientData: Record<string, any>
): Promise<string | null> {
  return logAuditEvent(
    createAuditEntry(request, 'DELETE', 'clients', clientId, clientData, undefined)
  )
}

/**
 * Log a purchase creation event
 */
export async function logPurchaseCreated(
  request: Request,
  purchaseId: string,
  purchaseData: Record<string, any>
): Promise<string | null> {
  return logAuditEvent(
    createAuditEntry(request, 'CREATE', 'purchases', purchaseId, undefined, purchaseData)
  )
}

/**
 * Log a watch allocation event
 */
export async function logWatchAllocated(
  request: Request,
  allocationId: string,
  allocationData: Record<string, any>
): Promise<string | null> {
  return logAuditEvent(
    createAuditEntry(request, 'ALLOCATE', 'allocations', allocationId, undefined, allocationData)
  )
}

/**
 * Log a data export event
 */
export async function logDataExport(
  request: Request,
  tableName: string,
  exportMetadata: Record<string, any>
): Promise<string | null> {
  return logAuditEvent(
    createAuditEntry(request, 'EXPORT', tableName, undefined, undefined, exportMetadata)
  )
}

/**
 * Log a user login event
 */
export async function logUserLogin(
  request: Request,
  userId: string,
  loginMetadata?: Record<string, any>
): Promise<string | null> {
  return logAuditEvent(
    createAuditEntry(request, 'LOGIN', 'auth', userId, undefined, loginMetadata)
  )
}

/**
 * Log a user logout event
 */
export async function logUserLogout(
  request: Request,
  userId: string
): Promise<string | null> {
  return logAuditEvent(
    createAuditEntry(request, 'LOGOUT', 'auth', userId, undefined, undefined)
  )
}

/**
 * Sanitize sensitive data before logging
 * Removes passwords, tokens, and other sensitive fields
 *
 * @param data - The data to sanitize
 * @returns Sanitized data safe for audit logging
 */
export function sanitizeAuditData(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = [
    'password',
    'password_hash',
    'token',
    'access_token',
    'refresh_token',
    'secret',
    'api_key',
    'private_key',
    'ssn',
    'social_security',
    'credit_card',
    'cvv'
  ]

  const sanitized = { ...data }

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}
