import { NextRequest, NextResponse } from 'next/server'
import {
  completeReminder,
  updateReminder,
  deleteReminder,
  snoozeReminder
} from '@/lib/db/reminders'

// PATCH /api/reminders/[id] - Update or complete a reminder
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const reminderId = params.id

    // Handle complete action
    if (body.action === 'complete') {
      await completeReminder(reminderId)
      return NextResponse.json({ message: 'Reminder completed' }, { status: 200 })
    }

    // Handle snooze action
    if (body.action === 'snooze' && body.new_date) {
      const updatedReminder = await snoozeReminder(reminderId, body.new_date)
      return NextResponse.json(updatedReminder, { status: 200 })
    }

    // Handle general update
    const updates: any = {}
    if (body.reminder_date) updates.reminder_date = body.reminder_date
    if (body.reminder_type) updates.reminder_type = body.reminder_type
    if (body.notes !== undefined) updates.notes = body.notes

    const updatedReminder = await updateReminder(reminderId, updates)
    return NextResponse.json(updatedReminder, { status: 200 })
  } catch (error) {
    console.error('Error updating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    )
  }
}

// DELETE /api/reminders/[id] - Delete a reminder
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reminderId = params.id
    await deleteReminder(reminderId)

    return NextResponse.json({ message: 'Reminder deleted' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    )
  }
}
