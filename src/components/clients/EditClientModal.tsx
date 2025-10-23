'use client'

import { useState, useEffect } from 'react'
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
import { XCircle, Save, User, Mail, Phone, Clock, Calendar } from 'lucide-react'
import type { Client } from '@/types'

interface EditClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
  onSuccess?: () => void
}

export function EditClientModal({ isOpen, onClose, client, onSuccess }: EditClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    lastContactDate: '',
    lastContactTime: ''
  })

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      const lastContact = client.lastContactDate ? new Date(client.lastContactDate) : null
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || '',
        lastContactDate: lastContact ? lastContact.toISOString().split('T')[0] : '',
        lastContactTime: lastContact ? lastContact.toTimeString().split(' ')[0].substring(0, 5) : '09:00'
      })
    }
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Combine date and time if both are provided
      let lastContactDateTime = null
      if (formData.lastContactDate && formData.lastContactTime) {
        lastContactDateTime = `${formData.lastContactDate}T${formData.lastContactTime}:00.000Z`
      }

      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
          last_contact_date: lastContactDateTime
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update client')
      }

      // Success!
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating client:', error)
      // TODO: Add toast notification
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Edit Client
          </DialogTitle>
          <DialogDescription>
            Update client information for <span className="font-semibold text-foreground">{client.name}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4" onClick={(e) => e.stopPropagation()}>
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
              placeholder="John Smith"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
              placeholder="john@example.com"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
              placeholder="(555) 123-4567"
              required
            />
          </div>

          {/* Last Contact Date */}
          <div className="space-y-2">
            <Label htmlFor="lastContactDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last Contact Date
            </Label>
            <Input
              id="lastContactDate"
              type="date"
              value={formData.lastContactDate}
              onChange={(e) => setFormData(prev => ({ ...prev, lastContactDate: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => {
                e.stopPropagation()
                e.currentTarget.showPicker?.()
              }}
              max={new Date().toISOString().split('T')[0]}
              className="cursor-pointer"
              style={{ textAlign: 'center', paddingLeft: '0', paddingRight: '0' }}
            />
          </div>

          {/* Last Contact Time */}
          {formData.lastContactDate && (
            <div className="space-y-2">
              <Label htmlFor="lastContactTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last Contact Time
              </Label>
              <Input
                id="lastContactTime"
                type="time"
                value={formData.lastContactTime}
                onChange={(e) => setFormData(prev => ({ ...prev, lastContactTime: e.target.value }))}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => {
                  e.stopPropagation()
                  e.currentTarget.showPicker?.()
                }}
                className="cursor-pointer"
                style={{ textAlign: 'center', paddingLeft: '0', paddingRight: '0' }}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              onClick={(e) => e.stopPropagation()}
              placeholder="Additional notes about this client..."
              rows={3}
              className="resize-none"
            />
          </div>

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
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
