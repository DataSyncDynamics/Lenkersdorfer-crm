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
import { XCircle, DollarSign, Calendar, Tag, Percent } from 'lucide-react'

interface AddPurchaseModalProps {
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

export function AddPurchaseModal({ isOpen, onClose, clientId, clientName, onSuccess }: AddPurchaseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    price: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    commissionRate: '10'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const price = parseFloat(formData.price)
      const commissionRate = parseFloat(formData.commissionRate)

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          brand: formData.brand,
          model: formData.model,
          price,
          commission_rate: commissionRate,
          commission_amount: (price * commissionRate) / 100,
          purchase_date: formData.purchaseDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create purchase')
      }

      // Success!
      onSuccess?.()
      onClose()

      // Reset form
      setFormData({
        brand: '',
        model: '',
        price: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        commissionRate: '10'
      })
    } catch (error) {
      console.error('Error creating purchase:', error)
      // TODO: Add toast notification
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePriceChange = (value: string) => {
    // Only allow numbers and one decimal point
    const cleaned = value.replace(/[^\d.]/g, '')
    const parts = cleaned.split('.')
    if (parts.length > 2) return // Prevent multiple decimals

    setFormData(prev => ({ ...prev, price: cleaned }))

    // Auto-adjust commission rate based on price
    const price = parseFloat(cleaned)
    if (!isNaN(price)) {
      if (price > 100000) {
        setFormData(prev => ({ ...prev, commissionRate: '20' }))
      } else if (price > 50000) {
        setFormData(prev => ({ ...prev, commissionRate: '15' }))
      } else {
        setFormData(prev => ({ ...prev, commissionRate: '10' }))
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Add Purchase
          </DialogTitle>
          <DialogDescription>
            Record a new purchase for <span className="font-semibold text-foreground">{clientName}</span>
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
              placeholder="e.g., Submariner 126610LN"
              required
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Sale Price *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="price"
                type="text"
                value={formData.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                className="pl-7"
                required
              />
            </div>
            {formData.price && (
              <p className="text-xs text-muted-foreground">
                Commission ({formData.commissionRate}%): ${((parseFloat(formData.price) * parseFloat(formData.commissionRate)) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Commission Rate */}
          <div className="space-y-2">
            <Label htmlFor="commission" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Commission Rate
            </Label>
            <select
              id="commission"
              value={formData.commissionRate}
              onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="15">15%</option>
              <option value="20">20%</option>
              <option value="25">25%</option>
            </select>
          </div>

          {/* Purchase Date */}
          <div className="space-y-2 relative z-10">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Purchase Date
            </Label>
            <div className="relative">
              <Input
                id="date"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
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
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Purchase'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
