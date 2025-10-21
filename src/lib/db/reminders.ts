// Reminder database operations
import { supabase } from '@/lib/supabase/client'

export type ReminderType = 'follow-up' | 'call-back' | 'meeting' | 'custom'

export interface Reminder {
  id: string
  client_id: string
  reminder_date: string
  reminder_type: ReminderType
  notes: string | null
  is_completed: boolean
  created_at: string
  completed_at: string | null
}

export interface CreateReminderData {
  client_id: string
  reminder_date: string
  reminder_type: ReminderType
  notes?: string
}

// Get all active reminders (not completed)
export const getActiveReminders = async (): Promise<Reminder[]> => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false)
      .order('reminder_date', { ascending: true })

    if (error) {
      console.error('Error fetching active reminders:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getActiveReminders:', error)
    return []
  }
}

// Get due reminders (reminder_date <= now)
export const getDueReminders = async (): Promise<Reminder[]> => {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false)
      .lte('reminder_date', now)
      .order('reminder_date', { ascending: true })

    if (error) {
      console.error('Error fetching due reminders:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getDueReminders:', error)
    return []
  }
}

// Get upcoming reminders (next 7 days)
export const getUpcomingReminders = async (daysAhead: number = 7): Promise<Reminder[]> => {
  try {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(now.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false)
      .gt('reminder_date', now.toISOString())
      .lte('reminder_date', futureDate.toISOString())
      .order('reminder_date', { ascending: true })

    if (error) {
      console.error('Error fetching upcoming reminders:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUpcomingReminders:', error)
    return []
  }
}

// Get reminders for a specific client
export const getRemindersForClient = async (clientId: string): Promise<Reminder[]> => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_completed', false)
      .order('reminder_date', { ascending: true })

    if (error) {
      console.error('Error fetching client reminders:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getRemindersForClient:', error)
    return []
  }
}

// Create a new reminder
export const createReminder = async (reminderData: CreateReminderData): Promise<Reminder | null> => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .insert([{
        client_id: reminderData.client_id,
        reminder_date: reminderData.reminder_date,
        reminder_type: reminderData.reminder_type,
        notes: reminderData.notes || null,
        is_completed: false
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating reminder:', error)
      throw new Error(`Failed to create reminder: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in createReminder:', error)
    throw error
  }
}

// Complete a reminder
export const completeReminder = async (reminderId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('reminders')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', reminderId)

    if (error) {
      console.error('Error completing reminder:', error)
      throw new Error(`Failed to complete reminder: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in completeReminder:', error)
    throw error
  }
}

// Update a reminder
export const updateReminder = async (
  reminderId: string,
  updates: Partial<CreateReminderData>
): Promise<Reminder | null> => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', reminderId)
      .select()
      .single()

    if (error) {
      console.error('Error updating reminder:', error)
      throw new Error(`Failed to update reminder: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in updateReminder:', error)
    throw error
  }
}

// Delete a reminder
export const deleteReminder = async (reminderId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId)

    if (error) {
      console.error('Error deleting reminder:', error)
      throw new Error(`Failed to delete reminder: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in deleteReminder:', error)
    throw error
  }
}

// Get reminder count by type
export const getReminderCountByType = async (): Promise<Record<ReminderType, number>> => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('reminder_type')
      .eq('is_completed', false)

    if (error) {
      console.error('Error fetching reminder counts:', error)
      return { 'follow-up': 0, 'call-back': 0, 'meeting': 0, 'custom': 0 }
    }

    const counts: Record<ReminderType, number> = {
      'follow-up': 0,
      'call-back': 0,
      'meeting': 0,
      'custom': 0
    }

    data?.forEach(reminder => {
      counts[reminder.reminder_type as ReminderType]++
    })

    return counts
  } catch (error) {
    console.error('Error in getReminderCountByType:', error)
    return { 'follow-up': 0, 'call-back': 0, 'meeting': 0, 'custom': 0 }
  }
}

// Snooze a reminder (reschedule to future date)
export const snoozeReminder = async (
  reminderId: string,
  newDate: string
): Promise<Reminder | null> => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .update({ reminder_date: newDate })
      .eq('id', reminderId)
      .select()
      .single()

    if (error) {
      console.error('Error snoozing reminder:', error)
      throw new Error(`Failed to snooze reminder: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in snoozeReminder:', error)
    throw error
  }
}
