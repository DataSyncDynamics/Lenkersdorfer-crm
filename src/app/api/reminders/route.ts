import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ReminderCreateSchema } from '@/lib/validation/schemas'
import { z } from 'zod'
import { rateLimit, addRateLimitHeaders, RateLimits } from '@/lib/rate-limit'
import { createErrorResponse } from '@/lib/error-handler'

// GET /api/reminders - Get reminders with optional filters
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, RateLimits.READ.limit, {
      interval: RateLimits.READ.interval,
      uniqueTokenPerInterval: 500
    })

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
      return addRateLimitHeaders(response, rateLimitResult)
    }

    // CRITICAL: Use server-side client with authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') // 'active', 'due', 'upcoming'
    const clientId = searchParams.get('clientId')
    const rawDaysAhead = searchParams.get('daysAhead')

    // Validate daysAhead if provided
    let daysAhead = 7
    if (rawDaysAhead) {
      const validated = z.number().int().min(1).max(365).parse(parseInt(rawDaysAhead))
      daysAhead = validated
    }

    // Build base query - CRITICAL: Only show reminders for user's clients
    let query = supabase
      .from('reminders')
      .select(`
        *,
        client:clients!inner(id, name, email, assigned_to)
      `)
      .eq('clients.assigned_to', user.id) // SECURITY: Only user's clients
      .eq('is_completed', false)
      .order('reminder_date', { ascending: true })

    // Apply additional filters
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    // Apply date filters
    const now = new Date().toISOString()
    switch (filter) {
      case 'due':
        query = query.lte('reminder_date', now)
        break
      case 'upcoming':
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + daysAhead)
        query = query.gt('reminder_date', now).lte('reminder_date', futureDate.toISOString())
        break
      // 'active' or default: no date filter, just not completed
    }

    const { data, error } = await query

    if (error) {
      return createErrorResponse(error, {
        endpoint: '/api/reminders',
        userId: user.id,
        code: 'REMINDER_FETCH_FAILED'
      })
    }

    const response = NextResponse.json(data || [])
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/reminders',
      code: 'REMINDER_LIST_ERROR'
    })
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for write operations
    const rateLimitResult = await rateLimit(request, RateLimits.WRITE.limit, {
      interval: RateLimits.WRITE.interval,
      uniqueTokenPerInterval: 500
    })

    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
      return addRateLimitHeaders(response, rateLimitResult)
    }

    // CRITICAL: Use server-side client with authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input with Zod
    const validated = ReminderCreateSchema.parse(body)

    // SECURITY: Verify user owns the client before creating reminder
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, assigned_to')
      .eq('id', validated.client_id)
      .eq('assigned_to', user.id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({
        error: 'Client not found or access denied'
      }, { status: 404 })
    }

    // Create reminder
    const { data, error } = await supabase
      .from('reminders')
      .insert([{
        client_id: validated.client_id,
        reminder_date: validated.reminder_date,
        reminder_type: validated.reminder_type,
        notes: validated.notes || null,
        is_completed: false
      }])
      .select(`
        *,
        client:clients(*)
      `)
      .single()

    if (error) {
      return createErrorResponse(error, {
        endpoint: '/api/reminders',
        userId: user.id,
        code: 'REMINDER_CREATE_FAILED'
      })
    }

    const response = NextResponse.json(data, { status: 201 })
    return addRateLimitHeaders(response, rateLimitResult)

  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/reminders',
      code: 'REMINDER_CREATE_ERROR'
    })
  }
}
