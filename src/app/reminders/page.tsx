'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, CheckCircle, X, Calendar, Phone, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Reminder } from '@/lib/db/reminders'
import {
  getReminderUrgency,
  getReminderTimeAgo,
  getReminderTypeLabel,
  getReminderTypeColor,
  getReminderUrgencyColor
} from '@/lib/reminder-utils'

export default function RemindersPage() {
  const [reminders, setReminders] = useState<(Reminder & { client_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'due' | 'upcoming'>('all')
  const [generatingFollowUps, setGeneratingFollowUps] = useState(false)

  useEffect(() => {
    loadReminders()
  }, [filter])

  const loadReminders = async () => {
    setLoading(true)
    try {
      const filterParam = filter === 'all' ? 'active' : filter
      const response = await fetch(`/api/reminders?filter=${filterParam}`)
      const data = await response.json()

      // Fetch client names for each reminder
      const remindersWithClients = await Promise.all(
        data.map(async (reminder: Reminder) => {
          try {
            const clientResponse = await fetch(`/api/clients/${reminder.client_id}`)
            const client = await clientResponse.json()
            return { ...reminder, client_name: client.name || 'Unknown Client' }
          } catch {
            return { ...reminder, client_name: 'Unknown Client' }
          }
        })
      )

      setReminders(remindersWithClients)
    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (reminderId: string) => {
    try {
      await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' })
      })

      // Remove from list
      setReminders(prev => prev.filter(r => r.id !== reminderId))
    } catch (error) {
      console.error('Error completing reminder:', error)
    }
  }

  const handleSnooze = async (reminderId: string) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    try {
      await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'snooze',
          new_date: tomorrow.toISOString()
        })
      })

      loadReminders()
    } catch (error) {
      console.error('Error snoozing reminder:', error)
    }
  }

  const handleGenerateTierFollowUps = async () => {
    setGeneratingFollowUps(true)
    try {
      const response = await fetch('/api/reminders/generate-tier-followups', {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate follow-ups')
      }

      // TODO: Add toast notification
      loadReminders() // Reload to show new reminders
    } catch (error) {
      console.error('Error generating tier follow-ups:', error)
      // TODO: Add toast notification
    } finally {
      setGeneratingFollowUps(false)
    }
  }

  const stats = {
    overdue: reminders.filter(r => getReminderUrgency(r.reminder_date) === 'overdue').length,
    today: reminders.filter(r => getReminderUrgency(r.reminder_date) === 'today').length,
    upcoming: reminders.filter(r => getReminderUrgency(r.reminder_date) === 'upcoming').length
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Bell className="h-8 w-8 text-blue-500" />
            Reminders
          </h1>
          <p className="text-muted-foreground">
            Manage your client follow-ups and scheduled reminders
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{stats.overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-500">{stats.today}</div>
              <div className="text-sm text-muted-foreground">Due Today</div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.upcoming}</div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Filters */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All Active
            </Button>
            <Button
              variant={filter === 'due' ? 'default' : 'outline'}
              onClick={() => setFilter('due')}
              size="sm"
            >
              Due Now
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setFilter('upcoming')}
              size="sm"
            >
              Upcoming
            </Button>
          </div>

          {/* Generate Tier Follow-ups Button */}
          <Button
            onClick={handleGenerateTierFollowUps}
            disabled={generatingFollowUps}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {generatingFollowUps ? 'Generating...' : 'Generate Tier Follow-Ups'}
          </Button>
        </div>

        {/* Reminders List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading reminders...
          </div>
        ) : reminders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No reminders found</h3>
              <p className="text-muted-foreground">
                Set reminders from client detail pages to keep track of follow-ups
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const urgency = getReminderUrgency(reminder.reminder_date)
              const timeAgo = getReminderTimeAgo(reminder.reminder_date)

              return (
                <Card key={reminder.id} className={`${getReminderUrgencyColor(urgency)} border-2`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getReminderTypeColor(reminder.reminder_type)}>
                            {getReminderTypeLabel(reminder.reminder_type)}
                          </Badge>
                          <span className="text-sm font-semibold">{reminder.client_name}</span>
                        </div>

                        {reminder.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{reminder.notes}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(reminder.reminder_date).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSnooze(reminder.id)}
                          title="Snooze until tomorrow"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleComplete(reminder.id)}
                          title="Mark as complete"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
