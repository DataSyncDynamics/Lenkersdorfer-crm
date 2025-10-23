'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Watch, Edit, Eye, AlertTriangle, Flame, Clock, Phone, MessageSquare, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore, formatCurrency } from '@/lib/store'
import { useNotifications } from '@/contexts/NotificationContext'
import { Client, ClientTier, WatchTier } from '@/types'
import { formatClientName, getTierColorClasses } from '@/lib/ui-utils'
import { cn } from '@/lib/utils'
import { Crown, Star, Users, TrendingUp, Activity, TrendingDown, Minus, Briefcase } from 'lucide-react'
import { analyzePurchasePattern } from '@/lib/purchase-patterns'

// Comprehensive luxury watch brands list
const LUXURY_WATCH_BRANDS = [
  'ROLEX',
  'OMEGA',
  'PATEK PHILIPPE',
  'AUDEMARS PIGUET',
  'CARTIER',
  'TAG HEUER',
  'BREITLING',
  'IWC',
  'TUDOR',
  'ZENITH',
  'SEIKO',
  'CHANEL',
  'VACHERON CONSTANTIN',
  'A. LANGE & SÖHNE',
  'JAEGER-LECOULTRE',
  'PANERAI',
  'HUBLOT',
  'RICHARD MILLE',
  'F.P. JOURNE',
  'GREUBEL FORSEY'
]

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

  const { notifications, markAsRead, removeNotification } = useNotifications()

  // Form state for client editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    preferredBrands: [] as string[],
    lastContactDate: '',
    lastContactTime: ''
  })

  // Wishlist state
  const [selectedWatchId, setSelectedWatchId] = useState('')
  const [wishlistNotes, setWishlistNotes] = useState('')

  // Purchase state
  const [purchaseData, setPurchaseData] = useState({
    brand: '',
    model: '',
    price: '',
    serialNumber: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Edit mode state - always start in read-only mode
  const [isEditing, setIsEditing] = useState(false)

  // Update form data when selected client changes
  useEffect(() => {
    if (selectedClient) {
      // Split the full name into first and last name
      const nameParts = selectedClient.name.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Parse lastContactDate if it exists
      const lastContact = selectedClient.lastContactDate ? new Date(selectedClient.lastContactDate) : null
      const lastContactDate = lastContact ? lastContact.toISOString().split('T')[0] : ''
      const lastContactTime = lastContact ? lastContact.toTimeString().split(' ')[0].substring(0, 5) : '09:00'

      setFormData({
        firstName,
        lastName,
        email: selectedClient.email,
        phone: selectedClient.phone,
        notes: selectedClient.notes || '',
        preferredBrands: selectedClient.preferredBrands,
        lastContactDate,
        lastContactTime
      })
    }
  }, [selectedClient])

  const handleSaveClient = async () => {
    if (!selectedClient) return

    // Combine first and last name into full name for saving
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()

    // Combine date and time for lastContactDate if both are provided
    let lastContactDateTime = null
    if (formData.lastContactDate && formData.lastContactTime) {
      lastContactDateTime = `${formData.lastContactDate}T${formData.lastContactTime}:00.000Z`
    }

    // Update via API
    try {
      const response = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
          last_contact_date: lastContactDateTime
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update client')
      }

      // Also call the original onSave callback for backwards compatibility
      const clientData = {
        ...formData,
        name: fullName
      }
      delete clientData.firstName
      delete clientData.lastName
      delete clientData.lastContactDate
      delete clientData.lastContactTime
      onSave(clientData)
    } catch (error) {
      console.error('Error updating client:', error)
      alert('Failed to update client. Please try again.')
    }
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

  // Add purchase
  const handleAddPurchase = async () => {
    if (!selectedClient || !purchaseData.brand || !purchaseData.model || !purchaseData.price) {
      alert('Please fill in all required fields (Brand, Model, Price)')
      return
    }

    try {
      const price = parseFloat(purchaseData.price)
      if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price')
        return
      }

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          brand: purchaseData.brand,
          model: purchaseData.model,
          price,
          serial_number: purchaseData.serialNumber || `SN${Date.now()}`,
          purchase_date: purchaseData.date,
          commission_rate: 15,
          commission_amount: price * 0.15
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add purchase')
      }

      // Reset form
      setPurchaseData({
        brand: '',
        model: '',
        price: '',
        serialNumber: '',
        date: new Date().toISOString().split('T')[0]
      })

      // Refresh the page to show the new purchase
      alert('Purchase added successfully!')
      window.location.reload()
    } catch (error) {
      console.error('Error adding purchase:', error)
      alert('Failed to add purchase. Please try again.')
    }
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

  const handleContactClient = () => {
    if (selectedClient?.phone) {
      window.location.href = `sms:${selectedClient.phone}`
    }
  }

  const getTierIcon = (tier: number) => {
    if (tier <= 2) return <Crown className="h-4 w-4" />
    if (tier <= 3) return <Star className="h-4 w-4" />
    return <Users className="h-4 w-4" />
  }

  const getTemperatureIcon = (temperature: string) => {
    switch (temperature) {
      case 'HOT': return TrendingUp
      case 'WARM': return Activity
      case 'COOLING': return TrendingDown
      case 'COLD': return Minus
      case 'NEW': return Briefcase
      default: return Activity
    }
  }

  // Get client's current wishlist and notifications BEFORE early return
  const clientWishlist = selectedClient ? getWaitlistForClient(selectedClient.id) : []
  const clientNotifications = selectedClient ? notifications.filter(n =>
    n.clientId === selectedClient.id || n.clientName === selectedClient.name
  ) : []

  // Analyze purchase pattern for temperature
  const purchasePattern = selectedClient ? analyzePurchasePattern(selectedClient) : null

  if (!selectedClient) return null

  return (
    <Dialog open={!!selectedClient} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] md:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between gap-4 pr-14">
            <DialogTitle className="text-2xl">{formatClientName(selectedClient.name)}</DialogTitle>
            <Badge
              className={cn("text-sm font-medium flex-shrink-0 border", getTierColorClasses(selectedClient.clientTier))}
            >
              {getTierIcon(selectedClient.clientTier)}
              <span className="ml-1.5">Tier {selectedClient.clientTier}</span>
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-lg font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(selectedClient.lifetimeSpend)}
            <span className="text-sm font-normal text-muted-foreground">lifetime spend</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notification Alerts */}
          {clientNotifications.length > 0 && (
            <div className="space-y-3">
              {clientNotifications.map((notification) => {
                const isUrgent = notification.category === 'URGENT_CLIENTS'
                const isOpportunity = notification.category === 'NEW_OPPORTUNITIES'

                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      isUrgent
                        ? 'bg-red-50 dark:bg-red-950/30 border-red-500'
                        : isOpportunity
                        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-500'
                        : 'bg-blue-50 dark:bg-blue-950/30 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {isUrgent && <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                        {isOpportunity && <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                        {!isUrgent && !isOpportunity && <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm mb-1 ${
                          isUrgent
                            ? 'text-red-900 dark:text-red-100'
                            : isOpportunity
                            ? 'text-orange-900 dark:text-orange-100'
                            : 'text-blue-900 dark:text-blue-100'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mb-3 ${
                          isUrgent
                            ? 'text-red-800 dark:text-red-200'
                            : isOpportunity
                            ? 'text-orange-800 dark:text-orange-200'
                            : 'text-blue-800 dark:text-blue-200'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleContactClient}
                            className="h-8 text-xs"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Contact Client
                          </Button>
                          {notification.actions
                            ?.filter(action => action.type !== 'VIEW_CLIENT') // Hide "View Client" since we're already viewing
                            ?.map((action, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Handle action based on type
                                  if (action.type === 'TEXT_CLIENT' || action.type === 'CALL') {
                                    handleContactClient()
                                  } else if (action.type === 'MARK_CONTACTED') {
                                    markAsRead(notification.id)
                                  }
                                }}
                                className="h-8 text-xs"
                              >
                                {action.label}
                              </Button>
                            ))}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeNotification(notification.id)}
                            className="h-8 text-xs"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

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

          {/* Buying Temperature */}
          {purchasePattern && purchasePattern.buyingTemperature !== 'UNKNOWN' && (
            <div className={cn(
              "space-y-4 p-5 rounded-lg border",
              purchasePattern.buyingTemperature === 'HOT' && "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
              purchasePattern.buyingTemperature === 'WARM' && "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
              purchasePattern.buyingTemperature === 'COOLING' && "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
              purchasePattern.buyingTemperature === 'COLD' && "bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800",
              purchasePattern.buyingTemperature === 'NEW' && "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
            )}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Buying Temperature</h3>
                {(() => {
                  const TemperatureIcon = getTemperatureIcon(purchasePattern.buyingTemperature)
                  return (
                    <TemperatureIcon className={cn(
                      "h-6 w-6",
                      purchasePattern.buyingTemperature === 'HOT' && "text-red-600 dark:text-red-400",
                      purchasePattern.buyingTemperature === 'WARM' && "text-orange-600 dark:text-orange-400",
                      purchasePattern.buyingTemperature === 'COOLING' && "text-blue-600 dark:text-blue-400",
                      purchasePattern.buyingTemperature === 'COLD' && "text-gray-600 dark:text-gray-400",
                      purchasePattern.buyingTemperature === 'NEW' && "text-purple-600 dark:text-purple-400"
                    )} />
                  )
                })()}
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-3 w-3 rounded-full",
                  purchasePattern.buyingTemperature === 'HOT' && "bg-red-500",
                  purchasePattern.buyingTemperature === 'WARM' && "bg-orange-500",
                  purchasePattern.buyingTemperature === 'COOLING' && "bg-blue-500",
                  purchasePattern.buyingTemperature === 'COLD' && "bg-gray-500",
                  purchasePattern.buyingTemperature === 'NEW' && "bg-purple-500"
                )} />
                <span className={cn(
                  "text-xl font-bold",
                  purchasePattern.buyingTemperature === 'HOT' && "text-red-700 dark:text-red-300",
                  purchasePattern.buyingTemperature === 'WARM' && "text-orange-700 dark:text-orange-300",
                  purchasePattern.buyingTemperature === 'COOLING' && "text-blue-700 dark:text-blue-300",
                  purchasePattern.buyingTemperature === 'COLD' && "text-gray-700 dark:text-gray-300",
                  purchasePattern.buyingTemperature === 'NEW' && "text-purple-700 dark:text-purple-300"
                )}>
                  {purchasePattern.buyingTemperature === 'NEW' ? 'NEW PROSPECT' : purchasePattern.buyingTemperature}
                </span>
              </div>
              {purchasePattern.lastPurchaseDaysAgo !== null && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Last purchase: {purchasePattern.lastPurchaseDaysAgo} days ago
                </div>
              )}
              {purchasePattern.averageDaysBetweenPurchases !== null && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Average purchase cycle: {purchasePattern.averageDaysBetweenPurchases} days
                </div>
              )}
            </div>
          )}

          {/* Last Contact Date & Time */}
          <div className="space-y-4 bg-amber-50 dark:bg-amber-950/30 p-5 rounded-lg border border-amber-200 dark:border-amber-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Last Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastContactDate" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last Contact Date
                </Label>
                <Input
                  id="lastContactDate"
                  type="date"
                  value={formData.lastContactDate}
                  onChange={(e) => setFormData({ ...formData, lastContactDate: e.target.value })}
                  readOnly={!isEditing}
                  max={new Date().toISOString().split('T')[0]}
                  className={!isEditing ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" : "cursor-pointer bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"}
                  style={isEditing ? { textAlign: 'center', paddingLeft: '0', paddingRight: '0' } : {}}
                  onClick={(e) => {
                    if (isEditing) {
                      e.stopPropagation()
                      e.currentTarget.showPicker?.()
                    }
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.stopPropagation()
                      e.currentTarget.showPicker?.()
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastContactTime" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last Contact Time
                </Label>
                <Input
                  id="lastContactTime"
                  type="time"
                  value={formData.lastContactTime}
                  onChange={(e) => setFormData({ ...formData, lastContactTime: e.target.value })}
                  readOnly={!isEditing}
                  className={!isEditing ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600" : "cursor-pointer bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"}
                  style={isEditing ? { textAlign: 'center', paddingLeft: '0', paddingRight: '0' } : {}}
                  onClick={(e) => {
                    if (isEditing) {
                      e.stopPropagation()
                      e.currentTarget.showPicker?.()
                    }
                  }}
                  onFocus={(e) => {
                    if (isEditing) {
                      e.stopPropagation()
                      e.currentTarget.showPicker?.()
                    }
                  }}
                />
              </div>
            </div>
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
          <div className="space-y-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 rounded-lg border border-emerald-300 dark:border-emerald-800 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-emerald-500 rounded-full"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Purchase History</h3>
              {selectedClient.purchases && selectedClient.purchases.length > 0 && (
                <Badge className="ml-auto bg-emerald-600 text-white">{selectedClient.purchases.length}</Badge>
              )}
            </div>

            {/* Add Purchase - Only show in edit mode */}
            {isEditing && (
              <div className="bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Add New Purchase</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={purchaseData.brand} onValueChange={(value) => setPurchaseData({...purchaseData, brand: value})}>
                    <SelectTrigger className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600">
                      <SelectValue placeholder="Select brand *" />
                    </SelectTrigger>
                    <SelectContent>
                      {LUXURY_WATCH_BRANDS.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Model *"
                    value={purchaseData.model}
                    onChange={(e) => setPurchaseData({...purchaseData, model: e.target.value})}
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                  />
                  <Input
                    type="number"
                    placeholder="Price *"
                    value={purchaseData.price}
                    onChange={(e) => setPurchaseData({...purchaseData, price: e.target.value})}
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                  />
                  <Input
                    placeholder="Serial Number (optional)"
                    value={purchaseData.serialNumber}
                    onChange={(e) => setPurchaseData({...purchaseData, serialNumber: e.target.value})}
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                  />
                  <div className="col-span-2">
                    <Input
                      type="date"
                      value={purchaseData.date}
                      onChange={(e) => setPurchaseData({...purchaseData, date: e.target.value})}
                      className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      onClick={handleAddPurchase}
                      disabled={!purchaseData.brand || !purchaseData.model || !purchaseData.price}
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Purchase
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Purchases */}
            {selectedClient.purchases && selectedClient.purchases.length > 0 && (
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
            )}
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
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value) {
                      handleAddBrand(value)
                    }
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder="Select a brand to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LUXURY_WATCH_BRANDS
                      .filter(brand => !formData.preferredBrands.includes(brand))
                      .map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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