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
import { XCircle, Clock, Tag, FileText } from 'lucide-react'

interface AddToWaitlistModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  onSuccess?: () => void
}

const WATCH_BRANDS = [
  'ROLEX', 'PATEK PHILIPPE', 'AUDEMARS PIGUET', 'CARTIER',
  'OMEGA', 'VACHERON CONSTANTIN', 'JAEGER-LECOULTRE', 'IWC',
  'BREITLING', 'TAG HEUER', 'PANERAI', 'HUBLOT', 'Other'
]

export function AddToWaitlistModal({ isOpen, onClose, clientId, clientName, onSuccess }: AddToWaitlistModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    referenceNumber: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          brand: formData.brand,
          model: formData.model,
          reference_number: formData.referenceNumber || null,
          notes: formData.notes || null,
          priority_score: 50, // Default priority
          wait_start_date: new Date().toISOString(),
          is_active: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add to waitlist')
      }

      // Success!
      onSuccess?.()
      onClose()

      // Reset form
      setFormData({
        brand: '',
        model: '',
        referenceNumber: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error adding to waitlist:', error)
      alert('Failed to add to waitlist. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Add to Waitlist
          </DialogTitle>
          <DialogDescription>
            Add <span className="font-semibold text-foreground">{clientName}</span> to the waitlist for a specific watch
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Watch Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Watch Brand *
            </Label>
            <select
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              required
            >
              <option value="">Select brand...</option>
              {WATCH_BRANDS.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="e.g., Daytona, Nautilus, Royal Oak"
              required
            />
          </div>

          {/* Reference Number (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number (Optional)</Label>
            <Input
              id="reference"
              value={formData.referenceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
              placeholder="e.g., 126500LN, 5711/1A"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes / Preferences
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Dial color, case material, specific requirements..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Add any specific preferences: dial color, case size, condition requirements, etc.
            </p>
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
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add to Waitlist'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
