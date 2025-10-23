'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAppStore, formatCurrency } from '@/lib/store'
import { analyzePurchasePattern } from '@/lib/purchase-patterns'
import MobileNavigation from '@/components/layout/MobileNavigation'
import { AddToWaitlistModal } from '@/components/clients/AddToWaitlistModal'
import { SetReminderModal } from '@/components/reminders/SetReminderModal'
import { LogContactModal } from '@/components/clients/LogContactModal'
import { EditClientModal } from '@/components/clients/EditClientModal'
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  CalendarIcon,
  TagIcon,
  CurrencyEuroIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  BellIcon,
  UserGroupIcon,
  FireIcon as Flame
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

const WATCH_BRANDS = [
  'ROLEX', 'PATEK PHILIPPE', 'AUDEMARS PIGUET', 'CARTIER',
  'OMEGA', 'VACHERON CONSTANTIN', 'JAEGER-LECOULTRE', 'IWC',
  'BREITLING', 'TAG HEUER', 'PANERAI', 'HUBLOT', 'Other'
]

export default function ClientDetailPage() {
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [showLogContactModal, setShowLogContactModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [lastContactDate, setLastContactDate] = useState<string | null>(null)
  const [isMarkingContacted, setIsMarkingContacted] = useState(false)
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false)
  const [activeReminders, setActiveReminders] = useState<any[]>([])
  const [purchaseFormData, setPurchaseFormData] = useState({
    brand: '',
    model: '',
    price: '',
    commissionRate: '15',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  })
  const params = useParams()
  const router = useRouter()
  const {
    getClientById,
    getWaitlistForClient,
    getWatchModelById,
    calculateMatchStatus,
    getClientTierInfo,
    getWatchTierInfo,
    getPerfectMatches
  } = useAppStore()

  const clientId = params.id as string
  const client = getClientById(clientId)
  const waitlistEntries = getWaitlistForClient(clientId)

  // Get GREEN BOX matches for this specific client
  const allPerfectMatches = getPerfectMatches()
  const clientPerfectMatches = allPerfectMatches.filter(match => match.clientId === clientId)

  // Load last contact date - MUST be before early return to follow Rules of Hooks
  useEffect(() => {
    if (!client) return
    const loadLastContact = async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}`)
        const data = await response.json()
        if (data.last_contact_date) {
          setLastContactDate(data.last_contact_date)
        }
      } catch (error) {
        console.error('Error loading last contact date:', error)
      }
    }
    loadLastContact()
  }, [clientId, client])

  // Load active reminders for this client
  useEffect(() => {
    if (!client) return
    const loadReminders = async () => {
      try {
        const response = await fetch('/api/reminders?filter=active')
        const data = await response.json()
        // Filter reminders for this specific client
        const clientReminders = data.filter((r: any) => r.client_id === clientId)
        setActiveReminders(clientReminders)
      } catch (error) {
        console.error('Error loading reminders:', error)
      }
    }
    loadReminders()
  }, [clientId, client])

  if (!client) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Client not found</h2>
          <button
            onClick={() => router.back()}
            className="luxury-button-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const getVipStars = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 5
      case 'Gold': return 4
      case 'Silver': return 3
      case 'Bronze': return 2
      default: return 1
    }
  }

  const getGreenBoxStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN': return 'text-green-400 bg-green-900/20 border-green-500/30'
      case 'YELLOW': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
      case 'RED': return 'text-red-400 bg-red-900/20 border-red-500/30'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'text-red-400 bg-red-900/20'
      case 'HIGH': return 'text-orange-400 bg-orange-900/20'
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-900/20'
      case 'LOW': return 'text-blue-400 bg-blue-900/20'
      default: return 'text-gray-400 bg-gray-900/20'
    }
  }

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'follow-up': return UserGroupIcon
      case 'call-back': return PhoneIcon
      case 'meeting': return CalendarIcon
      default: return BellIcon
    }
  }

  const getReminderLabel = (type: string) => {
    switch (type) {
      case 'follow-up': return 'Follow-Up'
      case 'call-back': return 'Call Back'
      case 'meeting': return 'Meeting'
      default: return 'Reminder'
    }
  }

  const formatReminderDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) {
      if (diffHours === 0) return 'Now'
      return `In ${diffHours}h`
    }
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays < 7) return `In ${diffDays}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const stars = getVipStars(client.vipTier)
  const clientTierInfo = getClientTierInfo(client.clientTier)
  const purchasePattern = analyzePurchasePattern(client)

  // Extract watch preferences from purchase history
  const purchasedBrands = [...new Set(client.purchases.map(p => p.brand))]

  // Mark as contacted
  const handleMarkAsContacted = async () => {
    setIsMarkingContacted(true)
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_contact_date: new Date().toISOString() })
      })

      if (response.ok) {
        setLastContactDate(new Date().toISOString())
      }
    } catch (error) {
      console.error('Error marking as contacted:', error)
    } finally {
      setIsMarkingContacted(false)
    }
  }

  // Format time ago
  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never contacted'

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now'
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    }
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`
  }

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingPurchase(true)

    try {
      const price = parseFloat(purchaseFormData.price)
      const commissionRate = parseFloat(purchaseFormData.commissionRate)

      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          brand: purchaseFormData.brand,
          model: purchaseFormData.model,
          price,
          commission_rate: commissionRate,
          commission_amount: (price * commissionRate) / 100,
          purchase_date: purchaseFormData.purchaseDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create purchase')
      }

      // Also update last contact date to purchase date (purchase = contact)
      await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          last_contact_date: `${purchaseFormData.purchaseDate}T${new Date().toTimeString().split(' ')[0]}`
        })
      })

      // Success! Refresh to show new purchase
      window.location.reload()
    } catch (error) {
      console.error('Error creating purchase:', error)
      // TODO: Add toast notification
      setIsSubmittingPurchase(false)
    }
  }

  const handleCancelPurchaseForm = () => {
    setShowPurchaseForm(false)
    setPurchaseFormData({
      brand: '',
      model: '',
      price: '',
      commissionRate: '15',
      serialNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0]
    })
  }

  const handleWaitlistSuccess = () => {
    // Refresh page to show new waitlist entry
    window.location.reload()
  }

  const handleReminderSuccess = async () => {
    // Reload reminders without full page refresh
    try {
      const response = await fetch('/api/reminders?filter=active')
      const data = await response.json()
      const clientReminders = data.filter((r: any) => r.client_id === clientId)
      setActiveReminders(clientReminders)
    } catch (error) {
      console.error('Error reloading reminders:', error)
    }
  }

  const handleLogContactSuccess = async () => {
    // Reload last contact date without full page refresh
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      const data = await response.json()
      if (data.last_contact_date) {
        setLastContactDate(data.last_contact_date)
      }
    } catch (error) {
      console.error('Error reloading last contact date:', error)
    }
  }

  const handleEditSuccess = () => {
    // Refresh page to show updated client info
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-black safe-area-pt">
      {/* Header */}
      <div className="bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-mobile mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <button
                onClick={() => router.back()}
                className="touch-target text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-bold text-white truncate">
                {client.name}
              </h1>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-sm"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Client Profile */}
      <div className="max-w-mobile mx-auto px-4 pb-20">
        {/* Client Header */}
        <div className="luxury-card p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-black font-bold text-xl">
              {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-white mb-2">
                {client.name}
              </h2>

              <div className="flex items-center space-x-3 mb-3">
                <span className={`vip-badge ${
                  client.vipTier === 'Platinum' ? 'vip-platinum' :
                  client.vipTier === 'Gold' ? 'vip-gold' :
                  client.vipTier === 'Silver' ? 'vip-silver' : 'vip-bronze'
                }`}>
                  {client.vipTier}
                </span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < stars ? 'text-gold-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="text-3xl font-bold text-gold-400 mb-1">
                {formatCurrency(client.lifetimeSpend)}
              </div>
              <div className="text-sm text-gray-400">
                Lifetime Value
              </div>

              {/* Last Contacted */}
              <div className="mt-3 flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-400">
                  Last contacted: <span className="text-gray-300">{getTimeAgo(lastContactDate)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => {
                window.location.href = `tel:${client.phone}`
                handleMarkAsContacted()
              }}
              className="luxury-button-primary flex items-center justify-center"
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call
            </button>
            <button
              onClick={() => window.location.href = `mailto:${client.email}`}
              className="luxury-button-secondary flex items-center justify-center"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Email
            </button>
            <button
              onClick={() => window.location.href = `sms:${client.phone}`}
              className="luxury-button-secondary flex items-center justify-center"
            >
              <ChatBubbleLeftIcon className="h-4 w-4 mr-2" />
              Text
            </button>
            <button
              onClick={() => setShowWaitlistModal(true)}
              className="luxury-button-secondary flex items-center justify-center"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Waitlist
            </button>
          </div>

          {/* Additional Actions */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              onClick={handleMarkAsContacted}
              disabled={isMarkingContacted}
              className="luxury-button-secondary flex items-center justify-center text-xs bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/30"
            >
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              {isMarkingContacted ? 'Updating...' : 'Now'}
            </button>
            <button
              onClick={() => setShowLogContactModal(true)}
              className="luxury-button-secondary flex items-center justify-center text-xs"
            >
              <ClockIcon className="h-3 w-3 mr-1" />
              Log
            </button>
            <button
              onClick={() => setShowReminderModal(true)}
              className="luxury-button-secondary flex items-center justify-center text-xs bg-blue-900/20 border-blue-500/30 text-blue-400 hover:bg-blue-900/30"
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              Remind
            </button>
          </div>
        </div>

        {/* Client Tier Information */}
        <div className="luxury-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <StarIcon className="h-5 w-5 mr-2 text-gold-400" />
            Client Tier Information
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <div className="text-white font-medium">Tier {client.clientTier}</div>
                <div className="text-sm text-gray-400">{clientTierInfo.name}</div>
                <div className="text-xs text-gray-500">{clientTierInfo.description}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gold-400">{client.spendPercentile}th</div>
                <div className="text-xs text-gray-500">percentile</div>
              </div>
            </div>
          </div>
        </div>

        {/* Buying Intelligence */}
        {purchasePattern.buyingTemperature !== 'UNKNOWN' && (
          <div className="luxury-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Flame className="h-5 w-5 mr-2 text-orange-400" />
              Buying Intelligence
            </h3>

            <div className="space-y-4">
              {/* Temperature Gauge */}
              <div className={`p-4 rounded-lg border-2 ${
                purchasePattern.buyingTemperature === 'HOT'
                  ? 'bg-red-900/20 border-red-500/30'
                  : purchasePattern.buyingTemperature === 'WARM'
                  ? 'bg-orange-900/20 border-orange-500/30'
                  : purchasePattern.buyingTemperature === 'COOLING'
                  ? 'bg-blue-900/20 border-blue-500/30'
                  : 'bg-gray-900/20 border-gray-500/30'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{purchasePattern.temperatureEmoji}</span>
                    <div>
                      <div className={`text-lg font-bold ${
                        purchasePattern.buyingTemperature === 'HOT'
                          ? 'text-red-400'
                          : purchasePattern.buyingTemperature === 'WARM'
                          ? 'text-orange-400'
                          : purchasePattern.buyingTemperature === 'COOLING'
                          ? 'text-blue-400'
                          : 'text-gray-400'
                      }`}>
                        {purchasePattern.buyingTemperature}
                      </div>
                      <div className="text-xs text-gray-500">Buying Temperature</div>
                    </div>
                  </div>
                  {purchasePattern.lastPurchaseDaysAgo !== null && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {purchasePattern.lastPurchaseDaysAgo}
                      </div>
                      <div className="text-xs text-gray-500">days ago</div>
                    </div>
                  )}
                </div>

                {purchasePattern.averageDaysBetweenPurchases && (
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span className="text-sm text-gray-300">Purchase Frequency</span>
                    <span className="text-sm font-medium text-white">
                      Every ~{purchasePattern.averageDaysBetweenPurchases} days
                    </span>
                  </div>
                )}

                {purchasePattern.nextExpectedPurchase && (
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg mt-2">
                    <span className="text-sm text-gray-300">Next Expected</span>
                    <span className={`text-sm font-medium ${
                      purchasePattern.isOverdue ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {purchasePattern.nextExpectedPurchase.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                      {purchasePattern.isOverdue && ' (Overdue)'}
                    </span>
                  </div>
                )}
              </div>

              {/* Watch Preferences from Purchase History */}
              {purchasedBrands.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Purchased Brands</h4>
                  <div className="flex flex-wrap gap-2">
                    {purchasedBrands.map((brand) => (
                      <span
                        key={brand}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gold-900/20 text-gold-300 border border-gold-700"
                      >
                        ✓ {brand}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Reminders */}
        {activeReminders.length > 0 && (
          <div className="luxury-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-blue-400" />
              Active Reminders ({activeReminders.length})
            </h3>

            <div className="space-y-3">
              {activeReminders.map((reminder) => {
                const ReminderIcon = getReminderIcon(reminder.reminder_type)
                const isOverdue = new Date(reminder.reminder_date) < new Date()

                return (
                  <div key={reminder.id} className={`p-4 rounded-lg border ${
                    isOverdue
                      ? 'bg-red-900/20 border-red-500/30'
                      : 'bg-blue-900/20 border-blue-500/30'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ReminderIcon className={`h-5 w-5 ${isOverdue ? 'text-red-400' : 'text-blue-400'}`} />
                        <span className={`font-medium ${isOverdue ? 'text-red-400' : 'text-blue-400'}`}>
                          {getReminderLabel(reminder.reminder_type)}
                        </span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        isOverdue
                          ? 'bg-red-900/40 text-red-300'
                          : 'bg-blue-900/40 text-blue-300'
                      }`}>
                        {formatReminderDate(reminder.reminder_date)}
                      </span>
                    </div>

                    {reminder.notes && (
                      <div className="text-sm text-gray-300 mt-2 pl-7">
                        {reminder.notes}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2 pl-7">
                      {new Date(reminder.reminder_date).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* GREEN BOX Status */}
        {clientPerfectMatches.length > 0 && (
          <div className="luxury-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
              GREEN BOX Opportunities
            </h3>

            <div className="space-y-3">
              {clientPerfectMatches.map((match) => {
                const watch = getWatchModelById(match.watchModelId)
                if (!watch) return null

                return (
                  <div key={match.id} className={`p-4 rounded-lg border ${getGreenBoxStatusColor(match.status)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">
                          {watch.brand} {watch.model}
                        </h4>
                        <div className="text-sm text-gray-400 mb-2">
                          {watch.collection}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGreenBoxStatusColor(match.status)}`}>
                          {match.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(match.urgencyLevel)}`}>
                          {match.urgencyLevel}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-300 mb-2">
                      {match.callToAction}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Client Tier {match.clientTier} • Watch Tier {match.watchTier}</span>
                      <span>{match.daysWaiting} days waiting</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="luxury-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-300">{client.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-300">{client.phone}</span>
            </div>
            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-300">
                Client since {new Date(client.joinDate).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div className="luxury-card p-6 mb-6 overflow-visible">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <CurrencyEuroIcon className="h-5 w-5 mr-2 text-gold-400" />
              Purchase History
            </h3>
            {!showPurchaseForm && (
              <button
                onClick={() => setShowPurchaseForm(true)}
                className="luxury-button-secondary flex items-center bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/30 px-4 py-2"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Purchase
              </button>
            )}
          </div>

          {/* Inline Purchase Form */}
          {showPurchaseForm && (
            <form onSubmit={handleSubmitPurchase} className="mb-4 p-4 bg-gray-800 rounded-lg border border-green-500/30 relative overflow-visible">
              <div className="space-y-3">
                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Watch Brand *
                  </label>
                  <select
                    value={purchaseFormData.brand}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select brand...</option>
                    {WATCH_BRANDS.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    value={purchaseFormData.model}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., Submariner 126610LN"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Sale Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={purchaseFormData.price}
                        onChange={(e) => setPurchaseFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Commission Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Commission %
                    </label>
                    <select
                      value={purchaseFormData.commissionRate}
                      onChange={(e) => setPurchaseFormData(prev => ({ ...prev, commissionRate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                      <option value="15">15%</option>
                      <option value="20">20%</option>
                      <option value="25">25%</option>
                    </select>
                  </div>
                </div>

                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={purchaseFormData.serialNumber || ''}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseFormData.purchaseDate}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelPurchaseForm}
                    className="flex-1 luxury-button-secondary"
                    disabled={isSubmittingPurchase}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 luxury-button-primary bg-green-600 hover:bg-green-700 border-green-500"
                    disabled={isSubmittingPurchase}
                  >
                    {isSubmittingPurchase ? 'Saving...' : 'Save Purchase'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {client.purchases.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                <CurrencyEuroIcon className="h-8 w-8 text-gray-600" />
              </div>
              <h4 className="text-white font-medium mb-2">No purchases yet</h4>
              <p className="text-sm text-gray-400 mb-4">
                Record this client's first purchase to start tracking their history
              </p>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="luxury-button-primary inline-flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Purchase
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {client.purchases.map((purchase) => (
              <div key={purchase.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">
                    {purchase.brand} {purchase.watchModel}
                  </h4>
                  <div className="text-sm text-gray-400">
                    {new Date(purchase.date).toLocaleDateString('de-DE')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Serial: {purchase.serialNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gold-400">
                    {formatCurrency(purchase.price)}
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Preferred Brands */}
        <div className="luxury-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Preferred Brands</h3>

          <div className="flex flex-wrap gap-2">
            {client.preferredBrands.map((brand) => (
              <span
                key={brand}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-800 text-gray-300 border border-gray-700"
              >
                <TagIcon className="h-3 w-3 mr-1.5" />
                {brand}
              </span>
            ))}
          </div>
        </div>

        {/* Current Waitlist */}
        {waitlistEntries.length > 0 && (
          <div className="luxury-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-orange-400" />
              Current Waitlist ({waitlistEntries.length})
            </h3>

            <div className="space-y-3">
              {waitlistEntries.map((entry) => {
                const watch = getWatchModelById(entry.watchModelId)
                if (!watch) return null

                const daysWaiting = Math.floor(
                  (new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
                )

                const greenBoxStatus = calculateMatchStatus(client.clientTier, watch.watchTier, client.lifetimeSpend, watch.price)
                const watchTierInfo = getWatchTierInfo(watch.watchTier)

                return (
                  <div key={entry.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">
                          {watch.brand} {watch.model}
                        </h4>
                        <div className="text-sm text-gray-400 mb-2">
                          {watch.collection}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {watch.rarityDescription}
                        </div>
                        {entry.notes && (
                          <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-900 rounded">
                            Note: {entry.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-1 ml-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getGreenBoxStatusColor(greenBoxStatus)}`}>
                          {greenBoxStatus}
                        </span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-orange-400">
                            {daysWaiting} days
                          </div>
                          <div className="text-xs text-gray-500">
                            waiting
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
                      <span>Client Tier {client.clientTier} • Watch Tier {watch.watchTier}</span>
                      <span className="text-gold-400 font-medium">{formatCurrency(watch.price)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {client.notes && (
          <div className="luxury-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
            <p className="text-gray-300 leading-relaxed">
              {client.notes}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddToWaitlistModal
        isOpen={showWaitlistModal}
        onClose={() => setShowWaitlistModal(false)}
        clientId={clientId}
        clientName={client.name}
        onSuccess={handleWaitlistSuccess}
      />

      <SetReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        clientId={clientId}
        clientName={client.name}
        onSuccess={handleReminderSuccess}
      />

      <LogContactModal
        isOpen={showLogContactModal}
        onClose={() => setShowLogContactModal(false)}
        clientId={clientId}
        clientName={client.name}
        onSuccess={handleLogContactSuccess}
      />

      <EditClientModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        client={client}
        onSuccess={handleEditSuccess}
      />

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  )
}