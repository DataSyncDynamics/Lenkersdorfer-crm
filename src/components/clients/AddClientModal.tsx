'use client'

import React, { useState } from 'react'
import { X, Plus, Watch } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'

interface AddClientModalProps {
  open: boolean
  onClose: () => void
  onAdd: (clientData: NewClientData) => void
}

interface NewClientData {
  firstName: string
  lastName: string
  email: string
  phone: string
  notes: string
  wishlistWatches: { watchId: string; notes: string }[]
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ open, onClose, onAdd }) => {
  const { watchModels, getWatchModelById } = useAppStore()

  // Add client modal state
  const [newClientData, setNewClientData] = useState<NewClientData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    wishlistWatches: []
  })
  const [newClientWatchId, setNewClientWatchId] = useState('')
  const [newClientWatchNotes, setNewClientWatchNotes] = useState('')

  // Add new client functionality
  const handleAddNewClient = () => {
    if (!newClientData.firstName || !newClientData.lastName || !newClientData.email || !newClientData.phone) {
      return // Basic validation
    }

    onAdd(newClientData)

    // Reset form and close modal
    setNewClientData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
      wishlistWatches: []
    })
    setNewClientWatchId('')
    setNewClientWatchNotes('')
  }

  const handleAddWatchToNewClient = () => {
    if (!newClientWatchId) return

    const watchExists = newClientData.wishlistWatches.some(w => w.watchId === newClientWatchId)
    if (watchExists) return

    setNewClientData({
      ...newClientData,
      wishlistWatches: [...newClientData.wishlistWatches, {
        watchId: newClientWatchId,
        notes: newClientWatchNotes
      }]
    })
    setNewClientWatchId('')
    setNewClientWatchNotes('')
  }

  const handleRemoveWatchFromNewClient = (watchIdToRemove: string) => {
    setNewClientData({
      ...newClientData,
      wishlistWatches: newClientData.wishlistWatches.filter(w => w.watchId !== watchIdToRemove)
    })
  }

  const handleClose = () => {
    // Reset form when closing
    setNewClientData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      notes: '',
      wishlistWatches: []
    })
    setNewClientWatchId('')
    setNewClientWatchNotes('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] md:w-full">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={newClientData.firstName}
                  onChange={(e) => setNewClientData({ ...newClientData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={newClientData.lastName}
                  onChange={(e) => setNewClientData({ ...newClientData, lastName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newEmail">Email *</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="newPhone">Phone *</Label>
                <Input
                  id="newPhone"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="newNotes">Notes</Label>
              <Textarea
                id="newNotes"
                value={newClientData.notes}
                onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about the client..."
              />
            </div>
          </div>

          {/* Initial Wishlist */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Initial Wishlist (Optional)</h3>

            {/* Add to Wishlist */}
            <div className="border border-border rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-foreground">Add Watch to Initial Wishlist</h4>
              <div className="grid grid-cols-1 gap-3">
                <Select value={newClientWatchId} onValueChange={setNewClientWatchId}>
                  <SelectTrigger>
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
                <Input
                  placeholder="Optional notes..."
                  value={newClientWatchNotes}
                  onChange={(e) => setNewClientWatchNotes(e.target.value)}
                />
                <Button
                  onClick={handleAddWatchToNewClient}
                  disabled={!newClientWatchId}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Initial Wishlist
                </Button>
              </div>
            </div>

            {/* Current Wishlist */}
            {newClientData.wishlistWatches.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Initial Wishlist ({newClientData.wishlistWatches.length} items)</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {newClientData.wishlistWatches.map((watchEntry, index) => {
                    const watch = getWatchModelById(watchEntry.watchId)
                    if (!watch) return null

                    return (
                      <div key={index} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Watch className="h-4 w-4" />
                            <span className="font-medium text-foreground">{watch.brand} {watch.model}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {watch.collection}
                          </div>
                          {watchEntry.notes && (
                            <div className="text-sm text-muted-foreground italic mt-1">
                              "{watchEntry.notes}"
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveWatchFromNewClient(watchEntry.watchId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddNewClient}
            disabled={!newClientData.firstName || !newClientData.lastName || !newClientData.email || !newClientData.phone}
          >
            Add Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}