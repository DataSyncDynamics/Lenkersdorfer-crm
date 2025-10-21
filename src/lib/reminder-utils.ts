// Utility functions for reminder display and formatting
import type { Reminder } from '@/lib/db/reminders'

export function getReminderUrgency(reminderDate: string): 'overdue' | 'today' | 'upcoming' {
  const now = new Date()
  const reminder = new Date(reminderDate)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const reminderDay = new Date(reminder.getFullYear(), reminder.getMonth(), reminder.getDate())

  if (reminderDay < today) return 'overdue'
  if (reminderDay.getTime() === today.getTime()) return 'today'
  return 'upcoming'
}

export function getReminderTimeAgo(reminderDate: string): string {
  const now = new Date()
  const reminder = new Date(reminderDate)
  const diffMs = reminder.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Overdue
  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays)
    const overdueHours = Math.abs(diffHours)

    if (overdueDays > 0) {
      return `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`
    }
    return `${overdueHours} hour${overdueHours !== 1 ? 's' : ''} overdue`
  }

  // Due soon
  if (diffHours < 1) return 'Due in less than 1 hour'
  if (diffHours < 24) return `Due in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays < 7) return `Due in ${diffDays} days`

  return `Due ${reminder.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export function getReminderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'follow-up': 'Follow-Up',
    'call-back': 'Call Back',
    'meeting': 'Meeting',
    'custom': 'Custom'
  }
  return labels[type] || type
}

export function getReminderTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'follow-up': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    'call-back': 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
    'meeting': 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
    'custom': 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30'
  }
  return colors[type] || colors.custom
}

export function getReminderUrgencyColor(urgency: 'overdue' | 'today' | 'upcoming'): string {
  const colors: Record<typeof urgency, string> = {
    overdue: 'border-red-500 bg-red-500/10',
    today: 'border-orange-500 bg-orange-500/10',
    upcoming: 'border-blue-500 bg-blue-500/10'
  }
  return colors[urgency]
}
