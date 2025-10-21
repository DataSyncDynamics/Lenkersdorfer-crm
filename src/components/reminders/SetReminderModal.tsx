'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { XCircle, Bell, Calendar, Clock, MessageSquare, Phone, Users } from 'lucide-react'
import type { ReminderType } from '@/lib/db/reminders'

interface SetReminderModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  onSuccess?: () => void
}

const REMINDER_TYPES: { value: ReminderType; label: string; icon: any; description: string }[] = [
  {
    value: 'follow-up',
    label: 'Follow-Up',
    icon: Users,
    description: 'General client check-in'
  },
  {
    value: 'call-back',
    label: 'Call Back',
    icon: Phone,
    description: 'Return client call'
  },
  {
    value: 'meeting',
    label: 'Meeting',
    icon: Calendar,
    description: 'Scheduled appointment'
  },
  {
    value: 'custom',
    label: 'Custom',
    icon: MessageSquare,
    description: 'Other reminder'
  }
]

const QUICK_DATES = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
  { label: 'In 1 month', days: 30 }
]

export function SetReminderModal({ isOpen, onClose, clientId, clientName, onSuccess }: SetReminderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<{
    reminderType: ReminderType
    reminderDate: string
    reminderTime: string
    notes: string
  }>({
    reminderType: 'follow-up',
    reminderDate: '',
    reminderTime: '09:00',
    notes: ''
  })

  const handleQuickDate = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    setFormData(prev => ({
      ...prev,
      reminderDate: date.toISOString().split('T')[0]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Combine date and time
      const reminderDateTime = `${formData.reminderDate}T${formData.reminderTime}:00.000Z`

      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          reminder_date: reminderDateTime,
          reminder_type: formData.reminderType,
          notes: formData.notes || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create reminder')
      }

      // Success!
      onSuccess?.()
      onClose()

      // Reset form
      setFormData({
        reminderType: 'follow-up',
        reminderDate: '',
        reminderTime: '09:00',
        notes: ''
      })
    } catch (error) {
      console.error('Error creating reminder:', error)
      alert('Failed to set reminder. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Set Reminder
          </DialogTitle>
          <DialogDescription>
            Create a reminder for <span className="font-semibold text-foreground">{clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Reminder Type */}
          <div className="space-y-2">
            <Label>Reminder Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              {REMINDER_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, reminderType: type.value }))}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.reminderType === type.value
                        ? 'bg-blue-500/20 border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-background border-input hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Date Selection */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_DATES.map((quick) => (
                <button
                  key={quick.label}
                  type="button"
                  onClick={() => handleQuickDate(quick.days)}
                  className="px-3 py-1.5 text-xs rounded-full border border-input bg-background hover:bg-muted transition-colors"
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Reminder Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.reminderDate}
              onChange={(e) => setFormData(prev => ({ ...prev, reminderDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reminder Time
            </Label>
            <Input
              id="time"
              type="time"
              value={formData.reminderTime}
              onChange={(e) => setFormData(prev => ({ ...prev, reminderTime: e.target.value }))}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="What do you want to discuss or follow up on?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Preview */}
          {formData.reminderDate && (
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-sm text-muted-foreground">Reminder will trigger on:</p>
              <p className="text-sm font-medium mt-1">
                {new Date(`${formData.reminderDate}T${formData.reminderTime}`).toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || !formData.reminderDate}
            >
              {isSubmitting ? 'Setting...' : 'Set Reminder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
