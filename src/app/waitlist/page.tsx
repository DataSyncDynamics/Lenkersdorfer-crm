'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAppStore, formatCurrency, getVipTierColor } from '@/lib/store'

export default function WaitlistPage() {
  const {
    clients,
    watchModels,
    waitlist,
    getClientById,
    getWatchModelById,
    getWaitlistForWatch,
    removeFromWaitlist
  } = useAppStore()

  const [selectedWatch, setSelectedWatch] = useState<string>('')

  // Group waitlist by watch model
  const waitlistByWatch = watchModels.map(watch => {
    const entries = getWaitlistForWatch(watch.id)
    return {
      watch,
      entries: entries.map(entry => ({
        ...entry,
        client: getClientById(entry.clientId)!
      }))
    }
  }).filter(group => group.entries.length > 0)

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
              <Link href="/waitlist" className="text-primary-600 font-medium">
                Waitlist
              </Link>
              <Link href="/allocation" className="text-gray-500 hover:text-gray-700">
                Allocation
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Waitlist Management</h1>
          <p className="text-gray-600">Track client interest in luxury timepieces</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gray-900">
              {waitlist.length}
            </div>
            <div className="text-sm text-gray-500">Total Waitlist Entries</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-primary-600">
              {waitlistByWatch.length}
            </div>
            <div className="text-sm text-gray-500">Watches with Interest</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-2xl font-bold text-gold-500">
              {waitlist.filter(entry => {
                const client = getClientById(entry.clientId)
                return client?.vipTier === 'Platinum' || client?.vipTier === 'Gold'
              }).length}
            </div>
            <div className="text-sm text-gray-500">VIP Entries</div>
          </div>
        </div>

        {/* Waitlist by Watch Model */}
        <div className="space-y-6">
          {waitlistByWatch.map(({ watch, entries }) => (
            <div key={watch.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Watch Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {watch.brand} {watch.model}
                    </h3>
                    <p className="text-sm text-gray-600">{watch.collection}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary-600">
                      {formatCurrency(watch.price)}
                    </div>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      watch.availability === 'Available'
                        ? 'text-green-700 bg-green-100'
                        : 'text-yellow-700 bg-yellow-100'
                    }`}>
                      {watch.availability}
                    </div>
                  </div>
                </div>
              </div>

              {/* Waitlist Entries */}
              <div className="divide-y divide-gray-200">
                {entries.map((entry, index) => (
                  <div key={entry.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Position */}
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? 'bg-gold-500 text-white'
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                        </div>

                        {/* Client Info */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              {entry.client.name}
                            </h4>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getVipTierColor(entry.client.vipTier)}`}>
                              {entry.client.vipTier}
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            Lifetime spend: {formatCurrency(entry.client.lifetimeSpend)}
                          </div>
                          {entry.notes && (
                            <div className="mt-1 text-sm text-gray-600">
                              Note: {entry.notes}
                            </div>
                          )}
                        </div>

                        {/* Wait Time */}
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {Math.floor(
                              (new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
                            )} days
                          </div>
                          <div className="text-xs text-gray-500">waiting</div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => removeFromWaitlist(entry.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {entries.length} {entries.length === 1 ? 'client' : 'clients'} waiting
                  </div>
                  <div className="flex space-x-3">
                    <Link
                      href={`/allocation?watch=${watch.id}`}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Smart Allocation →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {waitlistByWatch.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No waitlist entries</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start adding clients to watch waitlists.
            </p>
          </div>
        )}
      </div>

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
            className="flex flex-col items-center justify-center py-2 text-primary-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs mt-1">Waitlist</span>
          </Link>
          <Link
            href="/allocation"
            className="flex flex-col items-center justify-center py-2 text-gray-400"
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