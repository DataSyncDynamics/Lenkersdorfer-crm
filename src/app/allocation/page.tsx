'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAppStore, formatCurrency, getVipTierColor } from '@/lib/store'

function AllocationContent() {
  const searchParams = useSearchParams()
  const [selectedWatchId, setSelectedWatchId] = useState<string>('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')

  const {
    watchModels,
    getWatchModelById,
    getClientById,
    generateAllocationSuggestions,
    removeFromWaitlist,
    waitlist
  } = useAppStore()

  // Check if watch ID is provided in URL
  useEffect(() => {
    const watchId = searchParams.get('watch')
    if (watchId) {
      setSelectedWatchId(watchId)
    }
  }, [searchParams])

  const selectedWatch = selectedWatchId ? getWatchModelById(selectedWatchId) : null
  const suggestions = selectedWatch ? generateAllocationSuggestions(selectedWatchId) : []

  const handleAllocate = (clientId: string) => {
    setSelectedClientId(clientId)
    setShowConfirmation(true)
  }

  const confirmAllocation = () => {
    if (selectedWatchId && selectedClientId) {
      // Remove from waitlist
      const waitlistEntry = waitlist.find(
        entry => entry.clientId === selectedClientId && entry.watchModelId === selectedWatchId
      )
      if (waitlistEntry) {
        removeFromWaitlist(waitlistEntry.id)
      }
    }
    setShowConfirmation(false)
    setSelectedClientId('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Lenkersdorfer
            </Link>
            <nav className="hidden sm:flex space-x-8">
              <Link href="/clients" className="text-gray-500 hover:text-gray-700">
                Clients
              </Link>
              <Link href="/waitlist" className="text-gray-500 hover:text-gray-700">
                Waitlist
              </Link>
              <Link href="/allocation" className="text-primary-600 font-medium">
                Allocation
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Allocation</h1>
          <p className="text-gray-600">AI-powered client recommendations for optimal sales</p>
        </div>

        {/* Watch Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Watch to Allocate
          </label>
          <select
            value={selectedWatchId}
            onChange={(e) => setSelectedWatchId(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Choose a watch model...</option>
            {watchModels.map(watch => (
              <option key={watch.id} value={watch.id}>
                {watch.brand} {watch.model} {watch.collection} - {formatCurrency(watch.price)}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Watch Info */}
        {selectedWatch && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedWatch.brand} {selectedWatch.model}
                </h3>
                <p className="text-gray-600">{selectedWatch.collection}</p>
                <p className="text-sm text-gray-500 mt-2">{selectedWatch.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {formatCurrency(selectedWatch.price)}
                </div>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedWatch.availability === 'Available'
                    ? 'text-green-700 bg-green-100'
                    : 'text-yellow-700 bg-yellow-100'
                }`}>
                  {selectedWatch.availability}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Allocation Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Recommended Allocations
              </h3>
              <p className="text-sm text-gray-600">
                Ranked by VIP tier, lifetime spend, wait time, and brand preference
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {suggestions.map((suggestion, index) => {
                const client = getClientById(suggestion.clientId)
                if (!client) return null

                return (
                  <div key={suggestion.clientId} className="px-6 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? 'bg-gold-500 text-white'
                              : index === 1
                              ? 'bg-gray-400 text-white'
                              : index === 2
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                        </div>

                        {/* Client Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {client.name}
                            </h4>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getVipTierColor(client.vipTier)}`}>
                              {client.vipTier} VIP
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Lifetime Spend:</span> {formatCurrency(client.lifetimeSpend)}
                            </div>
                            <div>
                              <span className="font-medium">Last Purchase:</span> {new Date(client.lastPurchase).toLocaleDateString('de-DE')}
                            </div>
                          </div>

                          {/* Reasons */}
                          <div className="mt-3">
                            <div className="text-sm font-medium text-gray-700 mb-1">Why this client:</div>
                            <div className="flex flex-wrap gap-2">
                              {suggestion.reasons.map((reason, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary-600">
                            {suggestion.score}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>

                        {/* Action */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => handleAllocate(client.id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              index === 0
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {index === 0 ? 'Recommend' : 'Allocate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedWatchId && suggestions.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No waitlist entries</h3>
            <p className="mt-1 text-sm text-gray-500">
              No clients are waiting for this watch model.
            </p>
          </div>
        )}

        {!selectedWatchId && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Select a watch model</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose a watch to see smart allocation recommendations.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Confirm Allocation
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to allocate this watch to {getClientById(selectedClientId)?.name}?
                  This will remove them from the waitlist.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={confirmAllocation}
                  className="px-4 py-2 bg-primary-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-primary-700"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-24"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-3">
          <Link
            href="/clients"
            className="flex flex-col items-center justify-center py-2 text-gray-400"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs mt-1">Clients</span>
          </Link>
          <Link
            href="/waitlist"
            className="flex flex-col items-center justify-center py-2 text-gray-400"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs mt-1">Waitlist</span>
          </Link>
          <Link
            href="/allocation"
            className="flex flex-col items-center justify-center py-2 text-primary-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">Allocation</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AllocationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AllocationContent />
    </Suspense>
  )
}