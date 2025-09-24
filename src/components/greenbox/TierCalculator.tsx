'use client'

import React, { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { clientTierDefinitions, watchRarityDefinitions } from '@/data/mockData'

const TierCalculator: React.FC = () => {
  const {
    clients,
    recalculateClientTiers,
    getClientsByTier,
    getWatchesByTier,
    getClientTierInfo,
    getWatchTierInfo
  } = useAppStore()

  // Auto-recalculate tiers when component mounts or clients change
  useEffect(() => {
    recalculateClientTiers()
  }, [recalculateClientTiers])

  const clientStats = clientTierDefinitions.map(tierDef => ({
    ...tierDef,
    count: getClientsByTier(tierDef.tier).length,
    clients: getClientsByTier(tierDef.tier)
  }))

  const watchStats = watchRarityDefinitions.map(tierDef => ({
    ...tierDef,
    count: getWatchesByTier(tierDef.tier).length,
    watches: getWatchesByTier(tierDef.tier)
  }))

  const totalClients = clients.length
  const spendRanges = clients.map(c => c.lifetimeSpend).sort((a, b) => b - a)
  const medianSpend = spendRanges[Math.floor(spendRanges.length / 2)]
  const averageSpend = spendRanges.reduce((sum, spend) => sum + spend, 0) / spendRanges.length

  return (
    <div className="space-y-6">
      {/* Tier Distribution Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Client Tier Distribution</h3>
        <div className="grid grid-cols-5 gap-4 mb-6">
          {clientStats.map(tier => (
            <div key={tier.tier} className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold ${tier.color} mb-2`}>
                {tier.count}
              </div>
              <div className="text-sm font-medium text-gray-900">Tier {tier.tier}</div>
              <div className="text-xs text-gray-600">{tier.name}</div>
              <div className="text-xs text-gray-500">{Math.round((tier.count / totalClients) * 100)}%</div>
            </div>
          ))}
        </div>

        {/* Spend Statistics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">${averageSpend.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Average Spend</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">${medianSpend.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Median Spend</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">${spendRanges[0].toLocaleString()}</div>
            <div className="text-sm text-gray-600">Highest Spend</div>
          </div>
        </div>
      </div>

      {/* Watch Rarity Distribution */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Watch Rarity Distribution</h3>
        <div className="grid grid-cols-5 gap-4">
          {watchStats.map(tier => (
            <div key={tier.tier} className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold ${tier.color} mb-2`}>
                {tier.count}
              </div>
              <div className="text-sm font-medium text-gray-900">Tier {tier.tier}</div>
              <div className="text-xs text-gray-600">{tier.name}</div>
              <div className="text-xs text-gray-500 mt-1 h-8 overflow-hidden">
                {tier.examples.slice(0, 2).join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Client Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Client Tier Breakdown</h3>
        <div className="space-y-4">
          {clientStats.map(tier => (
            <div key={tier.tier} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${tier.color}`}>
                    Tier {tier.tier}: {tier.name}
                  </span>
                  <span className="text-sm text-gray-600">
                    {tier.minPercentile}th - {tier.maxPercentile}th percentile
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {tier.count} clients ({Math.round((tier.count / totalClients) * 100)}%)
                </span>
              </div>

              {tier.clients.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tier.clients.map(client => (
                    <div key={client.id} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-600">
                        ${client.lifetimeSpend.toLocaleString()} ({client.spendPercentile}th percentile)
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {client.preferredBrands.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tier.clients.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No clients in this tier
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">Tier Management Actions</h3>
        <div className="space-y-2">
          <button
            onClick={recalculateClientTiers}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Recalculate All Client Tiers
          </button>
          <p className="text-sm text-blue-800">
            Automatically recalculates client tiers based on current lifetime spend percentiles.
            This ensures accurate GREEN BOX matching as client spending patterns evolve.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TierCalculator