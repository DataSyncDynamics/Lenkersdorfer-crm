'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Watch, Edit, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { Client, ClientTier, WatchTier } from '@/types'

interface ClientModalProps {
  selectedClient: Client | null
  onClose: () => void
  onSave: (clientData: Partial<Client>) => void
  readonly?: boolean
}

export const ClientModal: React.FC<ClientModalProps> = ({ selectedClient, onClose, onSave, readonly = false }) => {
  const {
    watchModels,
    getWaitlistForClient,
    addToWaitlist,
    removeFromWaitlist,
    getWatchModelById,
    calculateGreenBoxStatus
  } = useAppStore()

  // Form state for client editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    preferredBrands: [] as string[]
  })

  // Wishlist state
  const [selectedWatchId, setSelectedWatchId] = useState('')
  const [wishlistNotes, setWishlistNotes] = useState('')

  // Edit mode state
  const [isEditing, setIsEditing] = useState(!readonly)

  // Update form data when selected client changes
  useEffect(() => {
    if (selectedClient) {
      // Split the full name into first and last name
      const nameParts = selectedClient.name.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      setFormData({
        firstName,
        lastName,
        email: selectedClient.email,
        phone: selectedClient.phone,
        notes: selectedClient.notes || '',
        preferredBrands: selectedClient.preferredBrands
      })
    }
  }, [selectedClient])

  const handleSaveClient = () => {
    // Combine first and last name into full name for saving
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
    const clientData = {
      ...formData,
      name: fullName
    }
    delete clientData.firstName
    delete clientData.lastName
    onSave(clientData)
  }

  const handleAddBrand = (brand: string) => {
    if (brand && !formData.preferredBrands.includes(brand)) {
      setFormData({
        ...formData,
        preferredBrands: [...formData.preferredBrands, brand]
      })
    }
  }

  const handleRemoveBrand = (brandToRemove: string) => {
    setFormData({
      ...formData,
      preferredBrands: formData.preferredBrands.filter(brand => brand !== brandToRemove)
    })
  }

  // Get client's current wishlist
  const clientWishlist = selectedClient ? getWaitlistForClient(selectedClient.id) : []

  // Add watch to wishlist
  const handleAddToWishlist = () => {
    if (!selectedClient || !selectedWatchId) return

    addToWaitlist(selectedClient.id, selectedWatchId, wishlistNotes)
    setSelectedWatchId('')
    setWishlistNotes('')
  }

  // Remove watch from wishlist
  const handleRemoveFromWishlist = (entryId: string) => {
    removeFromWaitlist(entryId)
  }

  // Get tier match status for display
  const getTierMatchStatus = (clientTier: ClientTier, watchTier: WatchTier, clientLifetimeSpend: number, watchPrice: number) => {
    const status = calculateGreenBoxStatus(clientTier, watchTier, clientLifetimeSpend, watchPrice)
    switch (status) {
      case 'GREEN':
        return { text: 'Perfect Match', className: 'bg-green-100 text-green-800' }
      case 'YELLOW':
        return { text: 'Upgrade Opportunity', className: 'bg-yellow-100 text-yellow-800' }
      case 'RED':
        return { text: 'Not Suitable', className: 'bg-red-100 text-red-800' }
      default:
        return { text: 'Unknown', className: 'bg-gray-100 text-gray-800' }
    }
  }

  if (!selectedClient) return null

  return (
    <Dialog open={!!selectedClient} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{isEditing ? 'Edit Client:' : 'View Client:'} {selectedClient.name}</DialogTitle>
            {readonly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                readOnly={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
              />
            </div>
          </div>

          {/* Preferred Brands */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preferred Brands</h3>
            <div className="flex flex-wrap gap-2">
              {formData.preferredBrands.map((brand) => (
                <Badge key={brand} variant="secondary" className="cursor-pointer">
                  {brand}
                  <X
                    className="ml-1 h-3 w-3"
                    onClick={() => handleRemoveBrand(brand)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add preferred brand..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddBrand(e.currentTarget.value)
                    e.currentTarget.value = ''
                  }
                }}
              />
            </div>
          </div>

          {/* Wishlist Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Wishlist Management</h3>

            {/* Add to Wishlist */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Add Watch to Wishlist</h4>
              <div className="grid grid-cols-1 gap-3">
                <Select value={selectedWatchId} onValueChange={setSelectedWatchId}>
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
                  value={wishlistNotes}
                  onChange={(e) => setWishlistNotes(e.target.value)}
                />
                <Button
                  onClick={handleAddToWishlist}
                  disabled={!selectedWatchId}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Wishlist
                </Button>
              </div>
            </div>

            {/* Current Wishlist */}
            {clientWishlist.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Current Wishlist ({clientWishlist.length} items)</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {clientWishlist.map((entry) => {
                    const watch = getWatchModelById(entry.watchModelId)
                    if (!watch) return null

                    const tierMatch = getTierMatchStatus(selectedClient.clientTier, watch.watchTier, selectedClient.lifetimeSpend, watch.price)

                    return (
                      <div key={entry.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Watch className="h-4 w-4" />
                            <span className="font-medium">{watch.brand} {watch.model}</span>
                            <Badge className={tierMatch.className} variant="outline">
                              {tierMatch.text}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {watch.collection} • Added {new Date(entry.dateAdded).toLocaleDateString()}
                          </div>
                          {entry.notes && (
                            <div className="text-sm text-muted-foreground italic mt-1">
                              "{entry.notes}"
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromWishlist(entry.id)}
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

          {/* Purchase History */}
          {selectedClient.purchases && selectedClient.purchases.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Purchase History</h3>
              <div className="space-y-3">
                {selectedClient.purchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {purchase.brand} {purchase.watchModel}
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        {new Date(purchase.date).toLocaleDateString('de-DE')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Serial: {purchase.serialNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ${purchase.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isEditing ? 'Cancel' : 'Close'}
          </Button>
          {isEditing && (
            <Button onClick={handleSaveClient}>
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}