import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { WatchCreateSchema, SearchQuerySchema, sanitizeSearchInput } from '@/lib/validation/schemas'
import { z } from 'zod'
import { rateLimit, addRateLimitHeaders, RateLimits } from '@/lib/rate-limit'
import { createErrorResponse } from '@/lib/error-handler'

// GET /api/watches - List all watches/inventory
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
    const rawPage = parseInt(searchParams.get('page') || '1')
    const rawLimit = parseInt(searchParams.get('limit') || '50')
    const available = searchParams.get('available')
    const rawBrand = searchParams.get('brand') || ''

    // Validate pagination
    const validated = SearchQuerySchema.parse({
      page: rawPage,
      limit: rawLimit,
    })

    let query = supabase
      .from('inventory')
      .select('id, brand, model, collection, reference_number, price, retail_price, year, condition, is_available, watch_tier, description, specifications, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters with sanitization
    if (available !== null) {
      query = query.eq('is_available', available === 'true')
    }
    if (rawBrand) {
      const sanitizedBrand = sanitizeSearchInput(rawBrand)
      query = query.ilike('brand', `%${sanitizedBrand}%`)
    }

    // Safe pagination
    const offset = (validated.page - 1) * validated.limit
    query = query.range(offset, offset + validated.limit - 1)

    const { data, error, count } = await query

    if (error) {
      return createErrorResponse(error, {
        endpoint: '/api/watches',
        userId: user.id,
        code: 'WATCH_FETCH_FAILED'
      })
    }

    const response = NextResponse.json({
      watches: data,
      total: count,
      page: validated.page,
      limit: validated.limit,
    })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/watches',
      code: 'WATCH_SEARCH_ERROR'
    })
  }
}

// POST /api/watches - Create new watch
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
    const validated = WatchCreateSchema.parse(body)

    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        brand: validated.brand,
        model: validated.model,
        collection: validated.collection,
        price: validated.price,
        retail_price: validated.retail_price,
        reference_number: validated.reference_number,
        description: validated.description,
        year: validated.year,
        condition: validated.condition,
        is_available: validated.is_available,
        watch_tier: validated.watch_tier,
        specifications: validated.specifications,
      }])
      .select()
      .single()

    if (error) {
      return createErrorResponse(error, {
        endpoint: '/api/watches',
        userId: user.id,
        code: 'WATCH_CREATE_FAILED'
      })
    }

    const response = NextResponse.json(data, { status: 201 })
    return addRateLimitHeaders(response, rateLimitResult)

  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/watches',
      code: 'WATCH_CREATE_ERROR'
    })
  }
}
