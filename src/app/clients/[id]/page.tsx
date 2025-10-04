'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAppStore, formatCurrency } from '@/lib/store'
import MobileNavigation from '@/components/layout/MobileNavigation'
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
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

export default function ClientDetailPage() {
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

  const stars = getVipStars(client.vipTier)
  const clientTierInfo = getClientTierInfo(client.clientTier)

  return (
    <div className="min-h-screen bg-black safe-area-pt">
      {/* Header */}
      <div className="bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-mobile mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
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
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => window.location.href = `tel:${client.phone}`}
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
              onClick={() => {
                // Add functionality to navigate to add to waitlist
                console.log('Add to waitlist functionality')
              }}
              className="luxury-button-secondary flex items-center justify-center"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Waitlist
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

        {/* Purchase History */}
        <div className="luxury-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Purchase History</h3>

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

      {/* Mobile Navigation */}
      <MobileNavigation />
    </div>
  )
}