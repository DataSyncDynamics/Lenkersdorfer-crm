import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SearchQuerySchema, ClientCreateSchema, sanitizeSearchInput } from '@/lib/validation/schemas'
import { z } from 'zod'
import { rateLimit, addRateLimitHeaders, RateLimits } from '@/lib/rate-limit'
import { createErrorResponse } from '@/lib/error-handler'

// GET /api/clients - List all clients with optional search
export async function GET(request: NextRequest) {
  try {
    // Rate limiting for search operations
    const rateLimitResult = await rateLimit(request, RateLimits.SEARCH.limit, {
      interval: RateLimits.SEARCH.interval,
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

    // Validate and sanitize query parameters
    const searchParams = request.nextUrl.searchParams
    const rawPage = parseInt(searchParams.get('page') || '1')
    const rawLimit = parseInt(searchParams.get('limit') || '50')
    const rawSearch = searchParams.get('search') || ''

    // Validate with schema
    const validated = SearchQuerySchema.parse({
      page: rawPage,
      limit: rawLimit,
      search: rawSearch || undefined
    })

    let query = supabase
      .from('clients')
      .select('id, name, email, phone, vip_tier, lifetime_spend, last_purchase_date, last_contact_date, preferred_brands, notes, created_at, assigned_to', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Safe search implementation - NO string interpolation without sanitization
    if (validated.search) {
      const sanitized = sanitizeSearchInput(validated.search)
      // Use Supabase's built-in parameterization with sanitized input
      query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`)
    }

    // Safe pagination
    const offset = (validated.page - 1) * validated.limit
    query = query.range(offset, offset + validated.limit - 1)

    const { data, error, count } = await query

    if (error) {
      return createErrorResponse(error, {
        endpoint: '/api/clients',
        userId: user.id,
        code: 'CLIENT_FETCH_FAILED'
      })
    }

    const response = NextResponse.json({
      clients: data,
      total: count,
      page: validated.page,
      limit: validated.limit,
    })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/clients',
      code: 'CLIENT_SEARCH_ERROR'
    })
  }
}

// POST /api/clients - Create new client
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

    // Get and validate request body
    const body = await request.json()

    // CRITICAL: Validate input with Zod
    const validated = ClientCreateSchema.parse(body)

    // Calculate VIP tier based on lifetime spend
    const { data: tierData } = await supabase.rpc('calculate_vip_tier', {
      spend: validated.lifetime_spend
    })
    const vipTier = tierData || 'Bronze'

    // Insert with ONLY validated fields
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        lifetime_spend: validated.lifetime_spend,
        vip_tier: vipTier,
        preferred_brands: validated.preferred_brands,
        notes: validated.notes,
        last_contact_date: validated.last_contact_date,
        assigned_to: user.id, // Always set to current user
      }])
      .select()
      .single()

    if (error) {
      return createErrorResponse(error, {
        endpoint: '/api/clients',
        userId: user.id,
        code: 'CLIENT_CREATE_FAILED'
      })
    }

    const response = NextResponse.json(data, { status: 201 })
    return addRateLimitHeaders(response, rateLimitResult)

  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/clients',
      code: 'CLIENT_CREATE_ERROR'
    })
  }
}
