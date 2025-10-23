'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { formatClientName } from '@/lib/ui-utils'

interface AddWaitlistModalProps {
  open: boolean
  onClose: () => void
}

export const AddWaitlistModal: React.FC<AddWaitlistModalProps> = ({ open, onClose }) => {
  const { clients, watchModels, addToWaitlist } = useAppStore()

  const [clientId, setClientId] = useState('')
  const [watchId, setWatchId] = useState('')
  const [notes, setNotes] = useState('')

  // Sort clients alphabetically by name
  const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name))

  const handleAddToWaitlist = async () => {
    if (!clientId || !watchId) {
      return // Basic validation - both client and watch are required
    }

    try {
      await addToWaitlist(clientId, watchId, notes)

      // Reset form and close modal
      setClientId('')
      setWatchId('')
      setNotes('')
      onClose()
    } catch (error) {
      // Silently handle error - user will see no feedback on success either
    }
  }

  const handleClose = () => {
    // Reset form when closing
    setClientId('')
    setWatchId('')
    setNotes('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] md:w-full">
        <DialogHeader>
          <DialogTitle>Add to Waitlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Client Selection</h3>
            <div>
              <Label htmlFor="clientSelect">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="clientSelect">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {sortedClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {formatClientName(client.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Watch Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Watch Selection</h3>
            <div>
              <Label htmlFor="watchSelect">Watch Model *</Label>
              <Select value={watchId} onValueChange={setWatchId}>
                <SelectTrigger id="watchSelect">
                  <SelectValue placeholder="Select a watch model..." />
                </SelectTrigger>
                <SelectContent>
                  {watchModels.map((watch) => (
                    <SelectItem key={watch.id} value={watch.id}>
                      {watch.brand} {watch.model} - {watch.collection}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Additional Details (Optional)</h3>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any preferences or special requests..."
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToWaitlist}
            disabled={!clientId || !watchId}
          >
            Add to Waitlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
