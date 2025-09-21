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
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getClientById, getWaitlistForClient, getWatchModelById } = useAppStore()

  const clientId = params.id as string
  const client = getClientById(clientId)
  const waitlistEntries = getWaitlistForClient(clientId)

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

  const stars = getVipStars(client.vipTier)

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
          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => window.location.href = `tel:${client.phone}`}
              className="luxury-button-primary flex-1 flex items-center justify-center"
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call
            </button>
            <button
              onClick={() => window.location.href = `mailto:${client.email}`}
              className="luxury-button-secondary flex-1 flex items-center justify-center"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Email
            </button>
          </div>
        </div>

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
            <h3 className="text-lg font-semibold text-white mb-4">Current Waitlist</h3>

            <div className="space-y-3">
              {waitlistEntries.map((entry) => {
                const watch = getWatchModelById(entry.watchModelId)
                if (!watch) return null

                const daysWaiting = Math.floor(
                  (new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
                )

                return (
                  <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1">
                        {watch.brand} {watch.model}
                      </h4>
                      <div className="text-sm text-gray-400">
                        {watch.collection}
                      </div>
                      {entry.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          Note: {entry.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-orange-400">
                        {daysWaiting} days
                      </div>
                      <div className="text-xs text-gray-500">
                        waiting
                      </div>
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