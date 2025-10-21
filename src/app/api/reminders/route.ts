import { NextRequest, NextResponse } from 'next/server'
import {
  getActiveReminders,
  getDueReminders,
  getUpcomingReminders,
  createReminder,
  type CreateReminderData
} from '@/lib/db/reminders'

// GET /api/reminders - Get reminders with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') // 'active', 'due', 'upcoming'
    const daysAhead = searchParams.get('daysAhead')

    let reminders

    switch (filter) {
      case 'due':
        reminders = await getDueReminders()
        break
      case 'upcoming':
        const days = daysAhead ? parseInt(daysAhead) : 7
        reminders = await getUpcomingReminders(days)
        break
      case 'active':
      default:
        reminders = await getActiveReminders()
        break
    }

    return NextResponse.json(reminders, { status: 200 })
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.client_id || !body.reminder_date || !body.reminder_type) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id, reminder_date, reminder_type' },
        { status: 400 }
      )
    }

    // Validate reminder_type
    const validTypes = ['follow-up', 'call-back', 'meeting', 'custom']
    if (!validTypes.includes(body.reminder_type)) {
      return NextResponse.json(
        { error: 'Invalid reminder_type. Must be one of: follow-up, call-back, meeting, custom' },
        { status: 400 }
      )
    }

    const reminderData: CreateReminderData = {
      client_id: body.client_id,
      reminder_date: body.reminder_date,
      reminder_type: body.reminder_type,
      notes: body.notes
    }

    const newReminder = await createReminder(reminderData)

    return NextResponse.json(newReminder, { status: 201 })
  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    )
  }
}
