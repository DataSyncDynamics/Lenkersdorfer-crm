import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/clients/initialize-contact-dates
 * One-time migration to set last_contact_date to last_purchase_date for existing clients
 * This gives Jason a starting point - he can manually update if he's contacted them more recently
 */
export async function POST(request: NextRequest) {
  try {
    // First, get all clients with no contact date but has purchase date
    const { data: clientsToUpdate, error: fetchError } = await supabase
      .from('clients')
      .select('id, name, last_purchase_date')
      .is('last_contact_date', null)
      .not('last_purchase_date', 'is', null)

    if (fetchError) {
      console.error('Error fetching clients:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch clients',
        details: fetchError.message
      }, { status: 500 })
    }

    if (!clientsToUpdate || clientsToUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No clients need contact date initialization',
        updatedClients: 0
      })
    }

    // Update each client individually
    let updatedCount = 0
    const errors: string[] = []

    for (const client of clientsToUpdate) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ last_contact_date: client.last_purchase_date })
        .eq('id', client.id)

      if (updateError) {
        console.error(`Error updating client ${client.name}:`, updateError)
        errors.push(`Failed to update ${client.name}: ${updateError.message}`)
      } else {
        updatedCount++
        console.log(`✓ Initialized contact date for ${client.name}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Initialized last_contact_date for ${updatedCount} clients`,
      updatedClients: updatedCount,
      totalFound: clientsToUpdate.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Initialize contact dates error:', error)
    return NextResponse.json({
      error: 'Failed to initialize contact dates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
