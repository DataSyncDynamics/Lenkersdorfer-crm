'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Users, Gem, BarChart3, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { formatCurrency } from '@/lib/store'
import { getTierColorClasses } from '@/lib/ui-utils'

export const TierManagement: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const [expanded, setExpanded] = useState(false)
  const { clients, watchModels, recalculateClientTiers } = useAppStore()

  if (collapsed) {
    return null
  }

  const tierStats = clients.reduce((acc, client) => {
    const tier = client.clientTier
    if (!acc[tier]) {
      acc[tier] = { count: 0, totalSpend: 0 }
    }
    acc[tier].count++
    acc[tier].totalSpend += client.lifetimeSpend
    return acc
  }, {} as Record<number, { count: number; totalSpend: number }>)

  const totalClients = clients.length
  const totalSpend = clients.reduce((sum, c) => sum + c.lifetimeSpend, 0)
  const avgSpend = totalSpend / totalClients || 0
  const medianSpend = (() => {
    const sorted = [...clients].sort((a, b) => a.lifetimeSpend - b.lifetimeSpend)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 === 0
      ? (sorted[mid - 1].lifetimeSpend + sorted[mid].lifetimeSpend) / 2
      : sorted[mid].lifetimeSpend
  })()
  const highestSpend = Math.max(...clients.map(c => c.lifetimeSpend))

  const watchRarityStats = watchModels.reduce((acc, watch) => {
    const tier = watch.watchTier
    if (!acc[tier]) {
      acc[tier] = { count: 0, examples: [] }
    }
    acc[tier].count++
    if (acc[tier].examples.length < 2) {
      acc[tier].examples.push(`${watch.brand} ${watch.model}`)
    }
    return acc
  }, {} as Record<number, { count: number; examples: string[] }>)

  const tierNames = {
    1: 'Ultra-High Net Worth',
    2: 'High Net Worth',
    3: 'Established Collectors',
    4: 'Growing Enthusiasts',
    5: 'Entry Level'
  }

  const watchTierNames = {
    1: 'Nearly Impossible',
    2: 'Extremely Hard',
    3: 'Very Difficult',
    4: 'Moderate',
    5: 'Available'
  }

  const handleRecalculateTiers = () => {
    recalculateClientTiers()
  }

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="font-medium">Tier Management</span>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-2 pb-2 space-y-4 text-xs">
          {/* Client Tier Distribution */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Client Tier Distribution
            </h4>
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map(tier => {
                const stats = tierStats[tier] || { count: 0, totalSpend: 0 }
                const percentage = totalClients > 0 ? (stats.count / totalClients * 100) : 0
                return (
                  <div key={tier} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${getTierColorClasses(tier).includes('purple') ? 'bg-purple-500' :
                        getTierColorClasses(tier).includes('yellow') ? 'bg-yellow-500' :
                        getTierColorClasses(tier).includes('blue') ? 'bg-blue-500' :
                        getTierColorClasses(tier).includes('green') ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span>Tier {tier}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{stats.count}</div>
                      <div className="text-muted-foreground">{percentage.toFixed(0)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Spend</span>
                <span className="font-medium">{formatCurrency(avgSpend)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Median Spend</span>
                <span className="font-medium">{formatCurrency(medianSpend)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Highest Spend</span>
                <span className="font-medium">{formatCurrency(highestSpend)}</span>
              </div>
            </div>
          </div>

          {/* Watch Rarity Distribution */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-1">
              <Gem className="h-3 w-3" />
              Watch Rarity Distribution
            </h4>
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map(tier => {
                const stats = watchRarityStats[tier] || { count: 0, examples: [] }
                return (
                  <div key={tier} className="text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${tier === 1 ? 'bg-red-500' :
                          tier === 2 ? 'bg-orange-500' :
                          tier === 3 ? 'bg-yellow-500' :
                          tier === 4 ? 'bg-blue-500' : 'bg-green-500'}`} />
                        <span>Tier {tier}</span>
                      </div>
                      <span className="font-medium">{stats.count}</span>
                    </div>
                    <div className="text-muted-foreground text-xs ml-3">
                      {watchTierNames[tier as keyof typeof watchTierNames]}
                    </div>
                    {stats.examples.length > 0 && (
                      <div className="text-muted-foreground text-xs ml-3 truncate">
                        {stats.examples.join(', ')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h4 className="font-semibold mb-2">Actions</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRecalculateTiers}
              className="w-full text-xs h-7 gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Recalculate Tiers
            </Button>
            <p className="text-muted-foreground text-xs mt-1 leading-tight">
              Updates tier assignments based on current spend percentiles for accurate allocation matching.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}