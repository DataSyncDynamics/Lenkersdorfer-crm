import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ClientUpdateSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

// GET /api/clients/[id] - Get single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone, vip_tier, lifetime_spend, last_purchase_date, last_contact_date, preferred_brands, notes, created_at, assigned_to')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get and validate request body
    const body = await request.json()

    // CRITICAL: Validate with strict schema (rejects unknown fields)
    const validated = ClientUpdateSchema.parse(body)

    // Prepare update data - ONLY whitelisted fields
    const updateData: any = {}

    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.email !== undefined) updateData.email = validated.email
    if (validated.phone !== undefined) updateData.phone = validated.phone
    if (validated.notes !== undefined) updateData.notes = validated.notes
    if (validated.preferred_brands !== undefined) updateData.preferred_brands = validated.preferred_brands
    if (validated.last_contact_date !== undefined) updateData.last_contact_date = validated.last_contact_date

    // If lifetime_spend is updated, recalculate tier
    if (body.lifetime_spend !== undefined) {
      const spendValidation = z.number().min(0).max(100000000).parse(body.lifetime_spend)
      updateData.lifetime_spend = spendValidation

      const { data: tierData } = await supabase.rpc('calculate_vip_tier', {
        spend: spendValidation
      })
      updateData.vip_tier = tierData || 'Bronze'
    }

    // NEVER allow updating: id, created_at, assigned_to
    // These are protected by the schema and not included

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/clients/[id] - Delete client (soft delete by marking inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Don't actually delete - just mark as inactive (if you have that field)
    // For now, we'll actually delete but in production you'd want soft delete
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting client:', error)
      return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
