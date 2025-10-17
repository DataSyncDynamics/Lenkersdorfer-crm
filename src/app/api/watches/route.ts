import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/watches - List all watches/inventory
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const available = searchParams.get('available')
    const brand = searchParams.get('brand')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('inventory')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (available !== null) {
      query = query.eq('is_available', available === 'true')
    }
    if (brand) {
      query = query.ilike('brand', `%${brand}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching watches:', error)
      return NextResponse.json({ error: 'Failed to fetch watches' }, { status: 500 })
    }

    return NextResponse.json({
      watches: data,
      total: count,
      page,
      limit,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/watches - Create new watch
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from('inventory')
      .insert([{
        brand: body.brand,
        model: body.model,
        category: body.category,
        price: body.price,
        retail_price: body.retail_price,
        reference_number: body.reference_number,
        description: body.description,
        image_url: body.image_url,
        is_available: body.is_available ?? true,
        availability_date: body.availability_date,
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating watch:', error)
      return NextResponse.json({ error: 'Failed to create watch' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
