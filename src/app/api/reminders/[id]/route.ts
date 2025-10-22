import { NextRequest, NextResponse } from 'next/server'
import {
  completeReminder,
  updateReminder,
  deleteReminder,
  snoozeReminder
} from '@/lib/db/reminders'
import { ReminderUpdateSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

// PATCH /api/reminders/[id] - Update or complete a reminder
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const reminderId = params.id

    // Handle complete action (special case, bypass validation)
    if (body.action === 'complete') {
      await completeReminder(reminderId)
      return NextResponse.json({ message: 'Reminder completed' }, { status: 200 })
    }

    // Handle snooze action (validate new_date)
    if (body.action === 'snooze' && body.new_date) {
      const validatedDate = z.string().datetime().parse(body.new_date)
      const updatedReminder = await snoozeReminder(reminderId, validatedDate)
      return NextResponse.json(updatedReminder, { status: 200 })
    }

    // Handle general update - validate with strict schema
    const validated = ReminderUpdateSchema.parse(body)

    const updatedReminder = await updateReminder(reminderId, validated)
    return NextResponse.json(updatedReminder, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

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
