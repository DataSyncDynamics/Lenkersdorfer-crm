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
import { formatClientName } from '@/lib/ui-utils'

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
    calculateMatchStatus
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

  // Edit mode state - always start in read-only mode
  const [isEditing, setIsEditing] = useState(false)

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
    const status = calculateMatchStatus(clientTier, watchTier, clientLifetimeSpend, watchPrice)
    switch (status) {
      case 'GREEN':
        return { text: 'Perfect Match', className: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700' }
      case 'YELLOW':
        return { text: 'Upgrade Opportunity', className: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700' }
      case 'RED':
        return { text: 'Not Suitable', className: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700' }
      default:
        return { text: 'Unknown', className: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700' }
    }
  }

  if (!selectedClient) return null

  return (
    <Dialog open={!!selectedClient} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>{formatClientName(selectedClient.name)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Client Information</h3>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-300 font-medium">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" : ""}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-300 font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" : ""}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" : ""}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" : ""}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300 font-medium">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                readOnly={!isEditing}
                className={!isEditing ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" : ""}
              />
            </div>
          </div>

          {/* Preferred Brands */}
          <div className="space-y-4 bg-blue-50 dark:bg-blue-950/30 p-5 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Preferred Brands</h3>
            <div className="flex flex-wrap gap-2">
              {formData.preferredBrands.map((brand) => (
                <Badge
                  key={brand}
                  variant="secondary"
                  className={`${isEditing ? "cursor-pointer" : ""} bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors font-medium`}
                >
                  {brand}
                  {isEditing && (
                    <X
                      className="ml-1 h-3 w-3 hover:text-red-600 dark:hover:text-red-400"
                      onClick={() => handleRemoveBrand(brand)}
                    />
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add preferred brand..."
                  className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddBrand(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Wishlist Management */}
          <div className="space-y-4 bg-purple-50 dark:bg-purple-950/30 p-5 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Wishlist Management</h3>

            {/* Add to Wishlist - Only show in edit mode */}
            {isEditing && (
              <div className="bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Add Watch to Wishlist</h4>
                <div className="grid grid-cols-1 gap-3">
                  <Select value={selectedWatchId} onValueChange={setSelectedWatchId}>
                    <SelectTrigger className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600">
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
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                  />
                  <Button
                    onClick={handleAddToWishlist}
                    disabled={!selectedWatchId}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Wishlist
                  </Button>
                </div>
              </div>
            )}

            {/* Current Wishlist */}
            {clientWishlist.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900 dark:text-slate-100">Current Wishlist ({clientWishlist.length} items)</h4>
                <div className="space-y-2">
                  {clientWishlist.map((entry) => {
                    const watch = getWatchModelById(entry.watchModelId)
                    if (!watch) return null

                    const tierMatch = getTierMatchStatus(selectedClient.clientTier, watch.watchTier, selectedClient.lifetimeSpend, watch.price)

                    return (
                      <div key={entry.id} className="flex items-center justify-between bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 p-4 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Watch className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{watch.brand} {watch.model}</span>
                            <Badge className={`${tierMatch.className} dark:bg-opacity-20 font-semibold border`} variant="outline">
                              {tierMatch.text}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {watch.collection} • Added {new Date(entry.dateAdded).toLocaleDateString()}
                          </div>
                          {entry.notes && (
                            <div className="text-sm text-slate-700 dark:text-slate-300 italic mt-2 bg-slate-100 dark:bg-slate-700 p-2 rounded">
                              "{entry.notes}"
                            </div>
                          )}
                        </div>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromWishlist(entry.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Purchase History */}
          {selectedClient.purchases && selectedClient.purchases.length > 0 && (
            <div className="space-y-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 rounded-lg border border-emerald-300 dark:border-emerald-800 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Purchase History</h3>
                <Badge className="ml-auto bg-emerald-600 text-white">{selectedClient.purchases.length}</Badge>
              </div>
              <div className="space-y-3">
                {selectedClient.purchases.map((purchase, index) => {
                  const purchaseDate = new Date(purchase.date)
                  const monthYear = purchaseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  const day = purchaseDate.toLocaleDateString('en-US', { day: 'numeric' })

                  return (
                    <div key={purchase.id} className="group relative overflow-hidden bg-white dark:bg-slate-800/90 border-2 border-emerald-100 dark:border-emerald-900/50 rounded-xl p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg transition-all duration-200">
                      {/* Purchase number badge */}
                      <div className="absolute top-3 right-3 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">
                        #{selectedClient.purchases.length - index}
                      </div>

                      <div className="flex gap-4">
                        {/* Date Badge */}
                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex flex-col items-center justify-center text-white shadow-md">
                          <div className="text-xs font-medium opacity-90">{monthYear.split(' ')[0]}</div>
                          <div className="text-2xl font-bold leading-none">{day}</div>
                          <div className="text-xs font-medium opacity-90">{monthYear.split(' ')[1]}</div>
                        </div>

                        {/* Watch Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight mb-1">
                                {purchase.brand}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                {purchase.watchModel}
                              </p>
                            </div>
                          </div>

                          {/* Serial Number */}
                          <div className="flex items-center gap-2 mt-3">
                            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-md font-mono">
                              SN: {purchase.serialNumber}
                            </div>
                            {/* Price */}
                            <div className="ml-auto font-bold text-xl text-emerald-600 dark:text-emerald-400">
                              ${purchase.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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