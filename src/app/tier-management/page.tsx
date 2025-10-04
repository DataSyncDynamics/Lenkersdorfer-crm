'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, Gem, BarChart3, RefreshCw, Crown, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore, formatCurrency } from '@/lib/store'
import { Client } from '@/types'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import { ClientModal } from '@/components/clients/ClientModal'
import { getTierColorClasses } from '@/lib/ui-utils'

export default function TierManagementPage() {
  const { clients, watchModels, recalculateClientTiers, setSelectedClient, selectedClient, updateClient } = useAppStore()

  // State to track which tiers are expanded to show all clients
  const [expandedTiers, setExpandedTiers] = React.useState<Set<number>>(new Set())

  // Calculate client tier statistics
  const tierStats = clients.reduce((acc, client) => {
    const tier = client.clientTier
    if (!acc[tier]) {
      acc[tier] = { count: 0, totalSpend: 0, clients: [] }
    }
    acc[tier].count++
    acc[tier].totalSpend += client.lifetimeSpend
    acc[tier].clients.push(client)
    return acc
  }, {} as Record<number, { count: number; totalSpend: number; clients: any[] }>)

  // Sort clients by spend within each tier
  Object.values(tierStats).forEach(tierData => {
    tierData.clients.sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
  })

  const totalClients = clients.length
  const totalSpend = clients.reduce((sum, c) => sum + c.lifetimeSpend, 0)
  const avgSpend = totalSpend / totalClients || 0

  const sortedClients = [...clients].sort((a, b) => a.lifetimeSpend - b.lifetimeSpend)
  const medianSpend = (() => {
    const mid = Math.floor(sortedClients.length / 2)
    return sortedClients.length % 2 === 0
      ? (sortedClients[mid - 1].lifetimeSpend + sortedClients[mid].lifetimeSpend) / 2
      : sortedClients[mid].lifetimeSpend
  })()
  const highestSpend = Math.max(...clients.map(c => c.lifetimeSpend))

  // Watch rarity statistics
  const watchRarityStats = watchModels.reduce((acc, watch) => {
    const tier = watch.watchTier
    if (!acc[tier]) {
      acc[tier] = { count: 0, examples: [] }
    }
    acc[tier].count++
    if (acc[tier].examples.length < 3) {
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

  // Function to toggle expanded state for a tier
  const toggleTierExpansion = (tier: number) => {
    setExpandedTiers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tier)) {
        newSet.delete(tier)
      } else {
        newSet.add(tier)
      }
      return newSet
    })
  }

  // Handle closing the client modal
  const handleCloseClientModal = () => {
    setSelectedClient(null)
  }

  // Handle saving client data from the modal
  const handleSaveClient = (clientData: Partial<Client>) => {
    if (selectedClient) {
      updateClient(selectedClient.id, clientData)
      setSelectedClient(null)
    }
  }

  return (
    <LenkersdorferSidebar>
      <div className="flex-1 p-6 bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Tier Management</h1>
            </div>
            <p className="text-muted-foreground">
              Comprehensive client tier analysis and watch allocation insights
            </p>
          </div>

          {/* Client Tier Distribution Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Tier Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  {[1, 2, 3, 4, 5].map(tier => {
                    const stats = tierStats[tier] || { count: 0, totalSpend: 0 }
                    const percentage = totalClients > 0 ? (stats.count / totalClients * 100) : 0

                    const tierColors = {
                      1: { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', border: 'border-purple-200', text: 'text-purple-700', accent: 'text-purple-600' },
                      2: { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', border: 'border-yellow-200', text: 'text-yellow-700', accent: 'text-yellow-600' },
                      3: { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', border: 'border-blue-200', text: 'text-blue-700', accent: 'text-blue-600' },
                      4: { bg: 'bg-gradient-to-br from-green-500 to-green-600', border: 'border-green-200', text: 'text-green-700', accent: 'text-green-600' },
                      5: { bg: 'bg-gradient-to-br from-gray-500 to-gray-600', border: 'border-gray-200', text: 'text-gray-700', accent: 'text-gray-600' }
                    }

                    const colors = tierColors[tier as keyof typeof tierColors]

                    return (
                      <motion.div
                        key={tier}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: tier * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden">
                          <CardContent className="p-6">
                            {/* Gradient background accent */}
                            <div className={`absolute top-0 left-0 w-full h-1 ${colors.bg}`} />

                            {/* Tier badge */}
                            <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full ${colors.bg} text-white text-xs font-bold mb-3`}>
                              Tier {tier}
                            </div>

                            {/* Client count - large prominent number */}
                            <div className="text-center mb-4">
                              <div className={`text-4xl font-bold ${colors.text} mb-1`}>
                                {stats.count}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                                Clients
                              </div>
                            </div>

                            {/* Tier name */}
                            <div className="text-center mb-4">
                              <div className="text-sm font-semibold text-foreground leading-tight">
                                {tierNames[tier as keyof typeof tierNames]}
                              </div>
                            </div>

                            {/* Percentage with visual bar */}
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${colors.accent} mb-2`}>
                                {percentage.toFixed(0)}%
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${colors.bg} transition-all duration-500`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Average Spend
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(avgSpend)}</div>
                        <p className="text-xs text-muted-foreground">Per client lifetime value</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Median Spend
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(medianSpend)}</div>
                        <p className="text-xs text-muted-foreground">Middle value of all clients</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Highest Spend
                        </CardTitle>
                        <Crown className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(highestSpend)}</div>
                        <p className="text-xs text-muted-foreground">Top performing client</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Watch Rarity Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gem className="h-5 w-5" />
                  Watch Rarity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map(tier => {
                    const stats = watchRarityStats[tier] || { count: 0, examples: [] }

                    return (
                      <motion.div
                        key={tier}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: tier * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Tier {tier}
                            </CardTitle>
                            <Gem className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold mb-1">{stats.count}</div>
                            <p className="text-sm font-medium mb-2">
                              {watchTierNames[tier as keyof typeof watchTierNames]}
                            </p>
                            {stats.examples.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {stats.examples.join(', ')}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Client Tier Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Client Tier Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map(tier => {
                    const stats = tierStats[tier] || { count: 0, clients: [] }
                    const percentage = totalClients > 0 ? (stats.count / totalClients * 100) : 0

                    return (
                      <div key={tier} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-full ${
                                tier === 1 ? 'bg-purple-500' :
                                tier === 2 ? 'bg-yellow-500' :
                                tier === 3 ? 'bg-blue-500' :
                                tier === 4 ? 'bg-green-500' : 'bg-gray-500'
                              }`} />
                              Tier {tier}: {tierNames[tier as keyof typeof tierNames]}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {stats.count} clients ({percentage.toFixed(0)}%)
                            </p>
                          </div>
                        </div>

                        {stats.clients.length === 0 ? (
                          <p className="text-muted-foreground text-sm">No clients in this tier</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {(expandedTiers.has(tier) ? stats.clients : stats.clients.slice(0, 12)).map((client, index) => (
                              <motion.div
                                key={client.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-muted/50 rounded-lg p-3 hover:bg-muted/70 hover:shadow-md transition-all duration-200 cursor-pointer border border-transparent hover:border-muted-foreground/20"
                              >
                                <button
                                  onClick={() => {
                                    setSelectedClient(client)
                                  }}
                                  className="w-full text-left"
                                >
                                  <div className="font-medium text-sm truncate hover:text-blue-600 transition-colors">
                                    {client.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatCurrency(client.lifetimeSpend)} ({client.spendPercentile}th percentile)
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {client.preferredBrands.slice(0, 2).join(', ') || 'No preferred brands'}
                                  </div>
                                </button>
                              </motion.div>
                            ))}
                            {stats.clients.length > 12 && !expandedTiers.has(tier) && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-muted/30 rounded-lg p-3 flex items-center justify-center hover:bg-muted/50 transition-all duration-200 cursor-pointer"
                                onClick={() => toggleTierExpansion(tier)}
                              >
                                <span className="text-sm text-muted-foreground">
                                  +{stats.clients.length - 12} more
                                </span>
                              </motion.div>
                            )}
                            {expandedTiers.has(tier) && stats.clients.length > 12 && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-muted/30 rounded-lg p-3 flex items-center justify-center hover:bg-muted/50 transition-all duration-200 cursor-pointer"
                                onClick={() => toggleTierExpansion(tier)}
                              >
                                <span className="text-sm text-muted-foreground">
                                  Show less
                                </span>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tier Management Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tier Management Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Button onClick={handleRecalculateTiers} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Recalculate All Client Tiers
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Automatically recalculates client tiers based on current lifetime spend percentiles.
                      This ensures accurate allocation matching as client spending patterns evolve.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Client Profile Modal */}
      <ClientModal
        selectedClient={selectedClient}
        onClose={handleCloseClientModal}
        onSave={handleSaveClient}
      />
    </LenkersdorferSidebar>
  )
}