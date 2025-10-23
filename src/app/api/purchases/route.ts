import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PurchaseCreateSchema } from '@/lib/validation/schemas'
import { z } from 'zod'
import { rateLimit, addRateLimitHeaders, RateLimits } from '@/lib/rate-limit'
import { createErrorResponse } from '@/lib/error-handler'
import { BusinessConfig } from '@/config/business'

// GET /api/purchases - List purchases
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
    const clientId = searchParams.get('client_id')

    let query = supabase
      .from('purchases')
      .select(`
        id,
        client_id,
        watch_model_id,
        brand,
        model,
        price,
        commission_rate,
        commission_amount,
        purchase_date,
        serial_number,
        salesperson_id,
        created_at,
        client:clients(id, name, email, vip_tier, lifetime_spend),
        watch:inventory(id, brand, model, reference_number, price)
      `)
      .order('purchase_date', { ascending: false })

    // Filter by client if specified
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) {
      return createErrorResponse(error, {
        endpoint: '/api/purchases',
        userId: user.id,
        code: 'PURCHASE_FETCH_FAILED'
      })
    }

    const response = NextResponse.json(data)
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/purchases',
      code: 'PURCHASE_LIST_ERROR'
    })
  }
}

// POST /api/purchases - Create new purchase with FULL TRANSACTION INTEGRITY
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - strict for write operations
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
    const validated = PurchaseCreateSchema.parse(body)

    // Calculate commission if not provided
    const commission_amount = validated.commission_amount || (validated.price * validated.commission_rate / 100)

    // TRANSACTION STEP 1: Verify client exists and user has access
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, lifetime_spend, assigned_to')
      .eq('id', validated.client_id)
      .eq('assigned_to', user.id) // Ensure user owns this client
      .single()

    if (clientError || !client) {
      return NextResponse.json({
        error: 'Client not found or access denied'
      }, { status: 404 })
    }

    // TRANSACTION STEP 2: If watch_model_id provided, verify availability and price
    if (validated.watch_model_id) {
      const { data: watch, error: watchError } = await supabase
        .from('inventory')
        .select('id, is_available, price')
        .eq('id', validated.watch_model_id)
        .eq('is_available', true)
        .single()

      if (watchError || !watch) {
        return NextResponse.json({
          error: 'Watch not available for purchase'
        }, { status: 400 })
      }

      // Verify price matches (prevent price manipulation)
      if (!BusinessConfig.isPriceWithinTolerance(validated.price, watch.price)) {
        return NextResponse.json({
          error: `Price mismatch with inventory (tolerance: $${BusinessConfig.rules.purchasePriceTolerance})`
        }, { status: 400 })
      }
    }

    // TRANSACTION STEP 3: Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert([{
        client_id: validated.client_id,
        watch_model_id: validated.watch_model_id,
        brand: validated.brand,
        model: validated.model,
        price: validated.price,
        purchase_date: validated.purchase_date,
        commission_rate: validated.commission_rate,
        commission_amount,
        serial_number: validated.serial_number,
        salesperson_id: user.id,
      }])
      .select(`
        id,
        client_id,
        watch_model_id,
        brand,
        model,
        price,
        commission_rate,
        commission_amount,
        purchase_date,
        serial_number,
        salesperson_id,
        created_at,
        client:clients(id, name, email, vip_tier, lifetime_spend),
        watch:inventory(id, brand, model, reference_number, price)
      `)
      .single()

    if (purchaseError) {
      return createErrorResponse(purchaseError, {
        endpoint: '/api/purchases',
        userId: user.id,
        code: 'PURCHASE_CREATE_FAILED'
      })
    }

    // TRANSACTION STEP 4: Update client lifetime spend and last contact date (atomic operation)
    const newLifetimeSpend = client.lifetime_spend + validated.price
    const { error: clientUpdateError } = await supabase
      .from('clients')
      .update({
        lifetime_spend: newLifetimeSpend,
        last_purchase_date: validated.purchase_date,
        last_contact_date: validated.purchase_date // Set last contact to purchase date
      })
      .eq('id', validated.client_id)

    if (clientUpdateError) {
      // ROLLBACK: Delete the purchase we just created
      await supabase
        .from('purchases')
        .delete()
        .eq('id', purchase.id)

      return createErrorResponse(clientUpdateError, {
        endpoint: '/api/purchases',
        userId: user.id,
        code: 'CLIENT_UPDATE_FAILED'
      })
    }

    // TRANSACTION STEP 5: Recalculate VIP tier based on new spend
    const { data: tierData } = await supabase.rpc('calculate_vip_tier', {
      spend: newLifetimeSpend
    })

    if (tierData) {
      await supabase
        .from('clients')
        .update({ vip_tier: tierData })
        .eq('id', validated.client_id)
    }

    // TRANSACTION STEP 6: If inventory item, mark as sold
    if (validated.watch_model_id) {
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          is_available: false,
          sold_date: validated.purchase_date
        })
        .eq('id', validated.watch_model_id)

      if (inventoryError) {
        // Log warning but don't fail the transaction
        console.warn('[PURCHASE] Failed to update inventory availability:', {
          watch_id: validated.watch_model_id,
          error: inventoryError
        })
      }
    }

    // SUCCESS - Return purchase with updated client data
    const response = NextResponse.json(purchase, { status: 201 })
    return addRateLimitHeaders(response, rateLimitResult)

  } catch (error) {
    return createErrorResponse(error, {
      endpoint: '/api/purchases',
      code: 'PURCHASE_TRANSACTION_FAILED'
    })
  }
}
