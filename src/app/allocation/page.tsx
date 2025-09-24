'use client'

import React, { useState, useEffect, Suspense, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search,
  Users,
  Trophy,
  Target,
  Clock,
  Crown,
  Star,
  TrendingUp,
  Filter,
  ArrowRight,
  CheckCircle2,
  Medal,
  X,
  Calendar,
  Watch,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAppStore, formatCurrency, getVipTierColor } from '@/lib/store'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import { cn } from '@/lib/utils'

interface AllocationSuggestionCardProps {
  suggestion: any
  client: any
  rank: number
  onAllocate: (clientId: string) => void
}

const AllocationSuggestionCard: React.FC<AllocationSuggestionCardProps> = ({
  suggestion,
  client,
  rank,
  onAllocate
}) => {
  const getRankColor = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-black'
    if (position === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-black'
    return 'bg-muted text-muted-foreground border'
  }

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-purple-100 text-purple-800 border-purple-200'
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 3: return 'bg-gray-100 text-gray-800 border-gray-200'
      case 4: return 'bg-orange-100 text-orange-800 border-orange-200'
      case 5: return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="hover:shadow-lg transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Rank Badge */}
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold flex-shrink-0",
              getRankColor(rank)
            )}>
              {rank}
            </div>

            {/* Client Info */}
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                  {client.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <Badge className={cn("text-xs border", getTierColor(client.clientTier))}>
                    <Crown className="h-3 w-3 mr-1" />
                    Tier {client.clientTier}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {formatCurrency(client.lifetimeSpend)} lifetime • {client.spendPercentile}th percentile
                </div>
                <div className="flex flex-wrap gap-1">
                  {suggestion.reasons.slice(0, 3).map((reason: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                  {suggestion.reasons.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{suggestion.reasons.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{suggestion.score}</div>
              <div className="text-xs text-muted-foreground">Match Score</div>
            </div>

            {/* Action Button */}
            <Button
              onClick={() => onAllocate(client.id)}
              size={rank === 1 ? "default" : "sm"}
              className={cn(
                rank === 1 ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800" : ""
              )}
            >
              {rank === 1 && <Trophy className="h-4 w-4 mr-2" />}
              {rank === 1 ? 'Recommend' : 'Allocate'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function AllocationContent() {
  const searchParams = useSearchParams()
  const [selectedWatchId, setSelectedWatchId] = useState<string>('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [showModal, setShowModal] = useState<'waitlist' | 'watches' | 'greenbox' | 'alerts' | null>(null)

  const {
    watchModels,
    getWatchModelById,
    getClientById,
    generateAllocationSuggestions,
    removeFromWaitlist,
    waitlist,
    getGreenBoxMatches,
    getCriticalGreenBoxAlerts,
    clients
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

  // Calculate analytics
  const analytics = useMemo(() => {
    const greenBoxMatches = getGreenBoxMatches()
    const criticalAlerts = getCriticalGreenBoxAlerts()
    const totalWaitlistEntries = waitlist.length
    const availableWatches = watchModels.filter(w => w.availability === 'Available').length

    return {
      totalWaitlistEntries,
      availableWatches,
      greenBoxMatches: greenBoxMatches.length,
      criticalAlerts: criticalAlerts.length
    }
  }, [waitlist, watchModels, getGreenBoxMatches, getCriticalGreenBoxAlerts])

  const handleAllocate = (clientId: string) => {
    setSelectedClientId(clientId)
    setShowConfirmation(true)
  }

  const confirmAllocation = () => {
    if (selectedWatchId && selectedClientId) {
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
    <LenkersdorferSidebar>
      <div className="flex flex-1 flex-col bg-background">
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Smart Allocation</h1>
            <p className="text-muted-foreground">AI-powered client recommendations for optimal sales</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Target className="h-4 w-4 mr-2" />
              GREEN BOX Alerts
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-full mx-auto px-4 lg:px-8 pb-8">
          {/* Analytics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer"
              onClick={() => setShowModal('waitlist')}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Waitlist Entries
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalWaitlistEntries}</div>
                  <p className="text-xs text-muted-foreground">Clients waiting</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer"
              onClick={() => setShowModal('watches')}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available Watches
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.availableWatches}</div>
                  <p className="text-xs text-muted-foreground">Ready to allocate</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer"
              onClick={() => setShowModal('greenbox')}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    GREEN BOX Matches
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.greenBoxMatches}</div>
                  <p className="text-xs text-muted-foreground">Perfect tier matches</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer"
              onClick={() => setShowModal('alerts')}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Critical Alerts
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{analytics.criticalAlerts}</div>
                  <p className="text-xs text-muted-foreground">Urgent allocations</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Watch Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Watch to Allocate</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedWatchId} onValueChange={setSelectedWatchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a watch model..." />
                </SelectTrigger>
                <SelectContent>
                  {watchModels.map(watch => (
                    <SelectItem key={watch.id} value={watch.id}>
                      {watch.brand} {watch.model} {watch.collection} - {formatCurrency(watch.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Selected Watch Info */}
          {selectedWatch && (
            <Card className="mb-6">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {selectedWatch.brand} {selectedWatch.model}
                    </CardTitle>
                    <p className="text-muted-foreground">{selectedWatch.collection}</p>
                    <p className="text-sm text-muted-foreground mt-2">{selectedWatch.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {formatCurrency(selectedWatch.price)}
                    </div>
                    <Badge variant={selectedWatch.availability === 'Available' ? 'default' : 'secondary'}>
                      {selectedWatch.availability}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Allocation Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recommended Allocations</h2>
                <p className="text-sm text-muted-foreground">
                  Ranked by VIP tier, lifetime spend, wait time, and brand preference
                </p>
              </div>

              <div className="space-y-4">
                {suggestions.map((suggestion, index) => {
                  const client = getClientById(suggestion.clientId)
                  if (!client) return null

                  return (
                    <AllocationSuggestionCard
                      key={suggestion.clientId}
                      suggestion={suggestion}
                      client={client}
                      rank={index + 1}
                      onAllocate={handleAllocate}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty States */}
          {selectedWatchId && suggestions.length === 0 && (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No waitlist entries</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  No clients are currently waiting for this watch model.
                </p>
              </CardContent>
            </Card>
          )}

          {!selectedWatchId && (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a watch model</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Choose a watch to see smart allocation recommendations and GREEN BOX matches.
                </p>
              </CardContent>
            </Card>
          )}
        </main>

        {/* Detail Modals */}
        {showModal && (
          <Dialog open={!!showModal} onOpenChange={() => setShowModal(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {showModal === 'waitlist' && 'Waitlist Entries'}
                  {showModal === 'watches' && 'Available Watches'}
                  {showModal === 'greenbox' && 'GREEN BOX Matches'}
                  {showModal === 'alerts' && 'Critical Alerts'}
                </DialogTitle>
              </DialogHeader>

              {/* Waitlist Entries */}
              {showModal === 'waitlist' && (
                <div className="space-y-4">
                  {waitlist.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No clients currently on waitlist</p>
                    </div>
                  ) : (
                    waitlist.map((entry) => {
                      const client = getClientById(entry.clientId)
                      const watch = getWatchModelById(entry.watchModelId)
                      if (!client || !watch) return null

                      return (
                        <Card key={entry.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                  {client.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{client.name}</h4>
                                  <Badge className="text-xs">Tier {client.clientTier}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Watch className="h-3 w-3" />
                                    {watch.brand} {watch.model} - {watch.collection}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    Added {new Date(entry.dateAdded).toLocaleDateString()}
                                  </div>
                                  {entry.notes && (
                                    <div className="italic mt-1">"{entry.notes}"</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{formatCurrency(watch.price)}</div>
                                <div className="text-xs text-muted-foreground">{formatCurrency(client.lifetimeSpend)} lifetime</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              )}

              {/* Available Watches */}
              {showModal === 'watches' && (
                <div className="space-y-4">
                  {watchModels.filter(w => w.availability === 'Available').length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No watches currently available</p>
                    </div>
                  ) : (
                    watchModels.filter(w => w.availability === 'Available').map((watch) => (
                      <Card key={watch.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{watch.brand} {watch.model}</h4>
                                <Badge variant="default">Available</Badge>
                              </div>
                              <p className="text-muted-foreground mb-2">{watch.collection}</p>
                              <p className="text-sm text-muted-foreground">{watch.description}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">Tier {watch.watchTier}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {waitlist.filter(w => w.watchModelId === watch.id).length} waiting
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">{formatCurrency(watch.price)}</div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedWatchId(watch.id)
                                  setShowModal(null)
                                }}
                                className="mt-2"
                              >
                                Allocate
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* GREEN BOX Matches */}
              {showModal === 'greenbox' && (
                <div className="space-y-4">
                  {getGreenBoxMatches().length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No GREEN BOX matches available</p>
                    </div>
                  ) : (
                    getGreenBoxMatches().map((match) => {
                      const client = getClientById(match.clientId)
                      const watch = getWatchModelById(match.watchModelId)
                      if (!client || !watch) return null

                      return (
                        <Card key={`${match.clientId}-${match.watchModelId}`} className="border-green-200 bg-green-50/50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                                <Target className="h-4 w-4 text-green-600" />
                              </div>
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                  {client.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{client.name}</h4>
                                  <Badge className="bg-green-100 text-green-800">Perfect Match</Badge>
                                  <Badge variant="outline">Tier {client.clientTier}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Watch className="h-3 w-3" />
                                    {watch.brand} {watch.model} - {watch.collection}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{formatCurrency(watch.price)}</div>
                                <div className="text-xs text-muted-foreground">{formatCurrency(client.lifetimeSpend)} lifetime</div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWatchId(watch.id)
                                    setShowModal(null)
                                  }}
                                  className="mt-1 bg-green-600 hover:bg-green-700"
                                >
                                  Allocate
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              )}

              {/* Critical Alerts */}
              {showModal === 'alerts' && (
                <div className="space-y-4">
                  {getCriticalGreenBoxAlerts().length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">No critical alerts - everything looks good!</p>
                    </div>
                  ) : (
                    getCriticalGreenBoxAlerts().map((alert) => {
                      const client = getClientById(alert.clientId)
                      const watch = getWatchModelById(alert.watchModelId)
                      if (!client || !watch) return null

                      return (
                        <Card key={`${alert.clientId}-${alert.watchModelId}`} className="border-red-200 bg-red-50/50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              </div>
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                  {client.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{client.name}</h4>
                                  <Badge className="bg-red-100 text-red-800">Critical</Badge>
                                  <Badge variant="outline">Tier {client.clientTier}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Watch className="h-3 w-3" />
                                    {watch.brand} {watch.model} - {watch.collection}
                                  </div>
                                  <p className="text-red-600 mt-1">{alert.reason}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{formatCurrency(watch.price)}</div>
                                <div className="text-xs text-muted-foreground">{formatCurrency(client.lifetimeSpend)} lifetime</div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWatchId(watch.id)
                                    setShowModal(null)
                                  }}
                                  className="mt-1 bg-red-600 hover:bg-red-700"
                                >
                                  Urgent
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background rounded-lg shadow-lg max-w-md w-full p-6"
            >
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Confirm Allocation</h3>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to allocate this watch to {getClientById(selectedClientId)?.name}?
                  This will remove them from the waitlist.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={confirmAllocation} className="px-6">
                    Confirm
                  </Button>
                  <Button variant="outline" onClick={() => setShowConfirmation(false)} className="px-6">
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </LenkersdorferSidebar>
  )
}

export default function AllocationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading allocation engine...</p>
        </div>
      </div>
    }>
      <AllocationContent />
    </Suspense>
  )
}