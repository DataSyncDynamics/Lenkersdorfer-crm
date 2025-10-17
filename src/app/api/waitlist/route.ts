import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/waitlist - List waitlist entries
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const brand = searchParams.get('brand')
    const model = searchParams.get('model')
    const active = searchParams.get('active')

    let query = supabase
      .from('waitlist')
      .select(`
        *,
        client:clients(*)
      `)
      .order('priority_score', { ascending: false })

    // Apply filters
    if (brand) {
      query = query.eq('brand', brand)
    }
    if (model) {
      query = query.eq('model', model)
    }
    if (active !== null) {
      query = query.eq('is_active', active === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching waitlist:', error)
      return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/waitlist - Add to waitlist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Calculate priority score
    const { data: priorityScore } = await supabase.rpc('calculate_priority_score', {
      client_id_param: body.client_id,
      brand_param: body.brand,
      wait_start_date_param: body.wait_start_date || new Date().toISOString(),
    })

    const { data, error } = await supabase
      .from('waitlist')
      .insert([{
        client_id: body.client_id,
        brand: body.brand,
        model: body.model,
        reference_number: body.reference_number,
        wait_start_date: body.wait_start_date || new Date().toISOString(),
        priority_score: priorityScore || 0,
        notes: body.notes,
        is_active: true,
      }])
      .select(`
        *,
        client:clients(*)
      `)
      .single()

    if (error) {
      console.error('Error adding to waitlist:', error)
      return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
