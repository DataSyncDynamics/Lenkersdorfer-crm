import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { WaitlistCreateSchema, sanitizeSearchInput } from '@/lib/validation/schemas'
import { z } from 'zod'
import { rateLimit, addRateLimitHeaders, RateLimits } from '@/lib/rate-limit'
import { createErrorResponse } from '@/lib/error-handler'

// GET /api/waitlist - List waitlist entries
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

    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const rawBrand = searchParams.get('brand') || ''
    const rawModel = searchParams.get('model') || ''
    const active = searchParams.get('active')

    let query = supabase
      .from('waitlist')
      .select(`
        id,
        client_id,
        watch_model_id,
        priority_score,
        status,
        date_added,
        notes,
        created_at,
        client:clients(id, name, email, vip_tier, lifetime_spend, phone)
      `)
      .order('priority_score', { ascending: false })

    // Apply filters with sanitization
    if (rawBrand) {
      const sanitizedBrand = sanitizeSearchInput(rawBrand)
      query = query.eq('brand', sanitizedBrand)
    }
    if (rawModel) {
      const sanitizedModel = sanitizeSearchInput(rawModel)
      query = query.eq('model', sanitizedModel)
    }
    if (active !== null) {
      query = query.eq('is_active', active === 'true')
    }

    const { data, error } = await query

    if (error) {
      return createErrorResponse(error, {
        endpoint: '/api/waitlist',
        userId: user.id,
        code: 'WAITLIST_FETCH_FAILED'
      })
    }

    const response = NextResponse.json(data)
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/waitlist',
      code: 'WAITLIST_LIST_ERROR'
    })
  }
}

// POST /api/waitlist - Add to waitlist
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

    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input with Zod
    const validated = WaitlistCreateSchema.parse(body)

    const { data, error } = await supabase
      .from('waitlist')
      .insert([{
        client_id: validated.client_id,
        watch_model_id: validated.watch_model_id,
        priority_score: validated.priority_score,
        notes: validated.notes,
        status: 'active',
      }])
      .select(`
        id,
        client_id,
        watch_model_id,
        priority_score,
        status,
        date_added,
        notes,
        created_at,
        client:clients(id, name, email, vip_tier, lifetime_spend, phone)
      `)
      .single()

    if (error) {
      return createErrorResponse(error, {
        endpoint: '/api/waitlist',
        userId: user.id,
        code: 'WAITLIST_CREATE_FAILED'
      })
    }

    const response = NextResponse.json(data, { status: 201 })
    return addRateLimitHeaders(response, rateLimitResult)

  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/waitlist',
      code: 'WAITLIST_CREATE_ERROR'
    })
  }
}
