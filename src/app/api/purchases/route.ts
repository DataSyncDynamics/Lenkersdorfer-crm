import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/purchases - List purchases
export async function GET(request: NextRequest) {
  try {
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
        *,
        client:clients(*),
        watch:inventory(*)
      `)
      .order('purchase_date', { ascending: false })

    // Filter by client if specified
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching purchases:', error)
      return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/purchases - Create new purchase
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Calculate commission based on category
    const { data: commissionRate } = await supabase.rpc('calculate_commission_rate', {
      category: body.category || 'Steel',
    })

    const commission_amount = body.price * (commissionRate || 0.10)

    const { data, error } = await supabase
      .from('purchases')
      .insert([{
        client_id: body.client_id,
        watch_id: body.watch_id,
        brand: body.brand,
        model: body.model,
        price: body.price,
        purchase_date: body.purchase_date || new Date().toISOString(),
        commission_rate: commissionRate || 0.10,
        commission_amount,
        salesperson_id: user.id,
      }])
      .select(`
        *,
        client:clients(*),
        watch:inventory(*)
      `)
      .single()

    if (error) {
      console.error('Error creating purchase:', error)
      return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
    }

    // Update client lifetime spend
    const { error: updateError } = await supabase.rpc('update_client_lifetime_spend', {
      client_id: body.client_id,
    })

    if (updateError) {
      console.error('Error updating client lifetime spend:', updateError)
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
