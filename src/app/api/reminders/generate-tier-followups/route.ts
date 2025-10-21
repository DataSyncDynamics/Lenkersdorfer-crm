import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateNextFollowUpDate, needsFollowUpReminder } from '@/lib/tier-follow-up'
import type { VipTier } from '@/types'

/**
 * POST /api/reminders/generate-tier-followups
 * Generate follow-up reminders for all clients based on their tier
 */
export async function POST(request: NextRequest) {
  try {
    // Fetch all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, vip_tier, last_contact_date')

    if (clientsError) {
      console.error('Error fetching clients:', clientsError)
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      )
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        message: 'No clients found',
        created: 0
      })
    }

    // Filter clients who need follow-ups
    const clientsNeedingFollowUp = clients.filter(client =>
      needsFollowUpReminder(client.vip_tier as VipTier | null, client.last_contact_date)
    )

    if (clientsNeedingFollowUp.length === 0) {
      return NextResponse.json({
        message: 'No clients need follow-up reminders at this time',
        created: 0,
        total_clients: clients.length
      })
    }

    // For each client, check if a follow-up reminder already exists
    const remindersToCreate = []

    for (const client of clientsNeedingFollowUp) {
      // Check for existing active follow-up reminder
      const { data: existingReminders } = await supabase
        .from('reminders')
        .select('id')
        .eq('client_id', client.id)
        .eq('reminder_type', 'follow-up')
        .eq('is_completed', false)

      // Only create if no active follow-up reminder exists
      if (!existingReminders || existingReminders.length === 0) {
        const nextFollowUpDate = calculateNextFollowUpDate(
          client.vip_tier as VipTier | null,
          client.last_contact_date
        )

        remindersToCreate.push({
          client_id: client.id,
          reminder_date: nextFollowUpDate.toISOString(),
          reminder_type: 'follow-up',
          notes: `Tier-based follow-up for ${client.name}`,
          is_completed: false
        })
      }
    }

    if (remindersToCreate.length === 0) {
      return NextResponse.json({
        message: 'All clients already have active follow-up reminders',
        created: 0,
        total_clients: clients.length,
        clients_needing_followup: clientsNeedingFollowUp.length
      })
    }

    // Batch insert reminders
    const { data: createdReminders, error: insertError } = await supabase
      .from('reminders')
      .insert(remindersToCreate)
      .select()

    if (insertError) {
      console.error('Error creating reminders:', insertError)
      return NextResponse.json(
        { error: 'Failed to create reminders' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Successfully created ${createdReminders?.length || 0} tier-based follow-up reminders`,
      created: createdReminders?.length || 0,
      total_clients: clients.length,
      clients_needing_followup: clientsNeedingFollowUp.length,
      reminders: createdReminders
    })
  } catch (error) {
    console.error('Error generating tier-based follow-ups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
