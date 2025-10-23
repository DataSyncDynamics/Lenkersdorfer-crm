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
import { XCircle, Clock, Calendar, MessageSquare, Phone, Mail, Users, Video } from 'lucide-react'

interface LogContactModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  onSuccess?: () => void
}

type ContactType = 'call' | 'text' | 'email' | 'in-person' | 'meeting'

const CONTACT_TYPES: { value: ContactType; label: string; icon: any; description: string }[] = [
  {
    value: 'call',
    label: 'Phone Call',
    icon: Phone,
    description: 'Spoke on the phone'
  },
  {
    value: 'text',
    label: 'Text Message',
    icon: MessageSquare,
    description: 'SMS conversation'
  },
  {
    value: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Email exchange'
  },
  {
    value: 'in-person',
    label: 'In-Person',
    icon: Users,
    description: 'Met face-to-face'
  },
  {
    value: 'meeting',
    label: 'Meeting',
    icon: Video,
    description: 'Scheduled meeting'
  }
]

const QUICK_DATES = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: -1 },
  { label: '2 days ago', days: -2 },
  { label: '3 days ago', days: -3 },
  { label: 'Last week', days: -7 }
]

export function LogContactModal({ isOpen, onClose, clientId, clientName, onSuccess }: LogContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<{
    contactType: ContactType
    contactDate: string
    contactTime: string
    notes: string
  }>({
    contactType: 'call',
    contactDate: new Date().toISOString().split('T')[0], // Default to today
    contactTime: new Date().toTimeString().split(' ')[0].substring(0, 5), // Current time HH:MM
    notes: ''
  })

  const handleQuickDate = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    setFormData(prev => ({
      ...prev,
      contactDate: date.toISOString().split('T')[0]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Combine date and time
      const contactDateTime = `${formData.contactDate}T${formData.contactTime}:00.000Z`

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_contact_date: contactDateTime,
          // Optionally store contact type and notes in a separate table in future
        })
      })

      if (!response.ok) {
        throw new Error('Failed to log contact')
      }

      // Success!
      onSuccess?.()
      onClose()

      // Reset form
      setFormData({
        contactType: 'call',
        contactDate: new Date().toISOString().split('T')[0],
        contactTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        notes: ''
      })
    } catch (error) {
      console.error('Error logging contact:', error)
      // TODO: Add toast notification
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Log Contact
          </DialogTitle>
          <DialogDescription>
            Record a past contact with <span className="font-semibold text-foreground">{clientName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4" onClick={(e) => e.stopPropagation()}>
          {/* Contact Type */}
          <div className="space-y-2">
            <Label>Contact Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              {CONTACT_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFormData(prev => ({ ...prev, contactType: type.value }))
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.contactType === type.value
                        ? 'bg-green-500/20 border-green-500 text-green-600 dark:text-green-400'
                        : 'bg-card border-border hover:bg-accent hover:border-green-400 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${formData.contactType === type.value ? '' : 'text-foreground'}`} />
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                    <p className={`text-xs ${formData.contactType === type.value ? 'text-green-500/70 dark:text-green-400/70' : 'text-muted-foreground'}`}>{type.description}</p>
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
                  onClick={(e) => {
                    e.stopPropagation()
                    handleQuickDate(quick.days)
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-card hover:bg-accent hover:border-green-400 text-foreground transition-all"
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
              Contact Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.contactDate}
              onChange={(e) => setFormData(prev => ({ ...prev, contactDate: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => {
                e.stopPropagation()
                e.currentTarget.showPicker?.()
              }}
              max={new Date().toISOString().split('T')[0]} // Can't log future contacts
              className="cursor-pointer"
              style={{ textAlign: 'center', paddingLeft: '0', paddingRight: '0' }}
              required
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Contact Time
            </Label>
            <Input
              id="time"
              type="time"
              value={formData.contactTime}
              onChange={(e) => setFormData(prev => ({ ...prev, contactTime: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => {
                e.stopPropagation()
                e.currentTarget.showPicker?.()
              }}
              className="cursor-pointer"
              style={{ textAlign: 'center', paddingLeft: '0', paddingRight: '0' }}
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
              onClick={(e) => e.stopPropagation()}
              placeholder="What did you discuss? Any follow-up needed?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Preview */}
          {formData.contactDate && (
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Contact logged on:</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(`${formData.contactDate}T${formData.contactTime}`).toLocaleString('en-US', {
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
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isSubmitting || !formData.contactDate}
            >
              {isSubmitting ? 'Logging...' : 'Log Contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
