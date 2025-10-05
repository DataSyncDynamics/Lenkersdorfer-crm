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
  AlertTriangle,
  Info,
  XCircle,
  DollarSign
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
import { triggerHapticFeedback } from '@/lib/haptic-utils'
import { getTierColorClasses } from '@/lib/ui-utils'

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
  // Business category styling
  const getBusinessStyling = (category: string) => {
    switch (category) {
      case 'PERFECT_MATCH':
        return {
          cardClass: 'border-green-200 bg-green-50/30',
          badgeClass: 'bg-green-100 text-green-800 border-green-300',
          iconClass: 'text-green-600',
          buttonClass: 'bg-green-600 hover:bg-green-700 text-white'
        }
      case 'STRETCH_PURCHASE':
        return {
          cardClass: 'border-amber-200 bg-amber-50/30',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          iconClass: 'text-amber-600',
          buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white'
        }
      case 'UPGRADE_OPPORTUNITY':
        return {
          cardClass: 'border-blue-200 bg-blue-50/30',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
          iconClass: 'text-blue-600',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
      case 'NOT_SUITABLE':
        return {
          cardClass: 'border-red-200 bg-red-50/30',
          badgeClass: 'bg-red-100 text-red-800 border-red-300',
          iconClass: 'text-red-600',
          buttonClass: 'bg-gray-400 hover:bg-gray-500 text-white'
        }
      default:
        return {
          cardClass: 'border-gray-200',
          badgeClass: 'bg-gray-100 text-gray-800 border-gray-300',
          iconClass: 'text-gray-600',
          buttonClass: 'bg-gray-600 hover:bg-gray-700 text-white'
        }
    }
  }

  const styling = getBusinessStyling(suggestion.businessCategory || 'NOT_SUITABLE')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card className={cn("hover:shadow-lg transition-all duration-200 w-full", styling.cardClass)}>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-3 md:space-y-4">
            {/* Business Recommendation Header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                <Badge className={cn("px-2 py-0.5 md:px-3 md:py-1 font-semibold text-xs md:text-sm", styling.badgeClass)}>
                  {suggestion.businessLabel || 'EVALUATING'}
                </Badge>
                {suggestion.isOnWaitlist && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    On Waitlist
                  </Badge>
                )}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground">
                #{rank} priority
              </div>
            </div>

            {/* Client Info */}
            <div className="flex items-center gap-2 md:gap-3">
              <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs md:text-sm">
                  {client.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base md:text-lg break-words">{client.name}</h3>
                <div className="text-xs md:text-sm text-muted-foreground break-words">
                  {formatCurrency(client.lifetimeSpend)} lifetime spend
                  {suggestion.isOnWaitlist && ` • ${suggestion.daysWaiting || 0} days waiting`}
                  {!suggestion.isOnWaitlist && ' • Not on waitlist'}
                </div>
              </div>
            </div>

            {/* Business Reasoning */}
            <div className="bg-muted/50 rounded-lg p-2 md:p-3">
              <div className="text-xs md:text-sm font-medium text-foreground mb-1">Business Analysis:</div>
              <div className="text-xs md:text-sm text-muted-foreground break-words">
                {suggestion.businessReasoning || 'No analysis available'}
              </div>
            </div>

            {/* Action Recommendation */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0">
              <div className="flex-1">
                <div className="text-xs md:text-sm font-medium text-foreground mb-1">Recommended Action:</div>
                <div className="text-xs md:text-sm text-muted-foreground break-words">
                  {suggestion.businessAction || 'Evaluate case-by-case'}
                </div>
              </div>
              <Button
                onClick={() => onAllocate(client.id)}
                className={cn(styling.buttonClass, "w-full md:w-auto flex-shrink-0")}
                disabled={suggestion.businessCategory === 'NOT_SUITABLE'}
              >
                {suggestion.businessCategory === 'PERFECT_MATCH' && <CheckCircle2 className="h-4 w-4 mr-2" />}
                {suggestion.businessCategory === 'STRETCH_PURCHASE' && <DollarSign className="h-4 w-4 mr-2" />}
                {suggestion.businessCategory === 'UPGRADE_OPPORTUNITY' && <TrendingUp className="h-4 w-4 mr-2" />}
                {suggestion.businessCategory === 'NOT_SUITABLE' && <X className="h-4 w-4 mr-2" />}
                {suggestion.businessCategory === 'PERFECT_MATCH' ? 'Call Now' :
                 suggestion.businessCategory === 'STRETCH_PURCHASE' ? 'Discuss' :
                 suggestion.businessCategory === 'UPGRADE_OPPORTUNITY' ? 'Suggest Alt' : 'Skip'}
              </Button>
            </div>
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
  const [showAllClients, setShowAllClients] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [expandedWatchId, setExpandedWatchId] = useState<string | null>(null)

  const {
    watchModels,
    getWatchModelById,
    getClientById,
    generateAllocationContacts,
    removeFromWaitlist,
    waitlist,
    getPerfectMatches,
    getCriticalAlerts,
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
  const suggestions = selectedWatch ? generateAllocationContacts(selectedWatchId, showAllClients) : []

  // Count waitlist entries for this watch
  const waitlistCount = selectedWatchId ? waitlist.filter(e => e.watchModelId === selectedWatchId).length : 0

  // Calculate analytics
  const analytics = useMemo(() => {
    const perfectMatches = getPerfectMatches()
    const criticalAlerts = getCriticalAlerts()
    const totalWaitlistEntries = waitlist.length
    const availableWatches = watchModels.filter(w => w.availability === 'Available').length

    return {
      totalWaitlistEntries,
      availableWatches,
      perfectMatches: perfectMatches.length,
      criticalAlerts: criticalAlerts.length
    }
  }, [waitlist, watchModels, getPerfectMatches, getCriticalAlerts])

  // Filter and sort watches - Only show watches with actionable clients
  const filteredWatches = useMemo(() => {
    let watches = watchModels

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      watches = watches.filter(watch =>
        watch.brand.toLowerCase().includes(query) ||
        watch.model.toLowerCase().includes(query) ||
        watch.collection.toLowerCase().includes(query) ||
        watch.description.toLowerCase().includes(query)
      )
    } else {
      // ONLY when NOT searching: Filter to watches with actionable clients
      watches = watches.filter(watch => {
        const suggestions = generateAllocationContacts(watch.id, showAllClients)
        // Only show watches that have at least one GREEN, YELLOW, or waitlist client
        return suggestions.length > 0
      })
    }

    // Sort: Available watches first, then by number of matches (descending), then by price (high to low)
    return watches.sort((a, b) => {
      // Available watches come first
      if (a.availability === 'Available' && b.availability !== 'Available') return -1
      if (a.availability !== 'Available' && b.availability === 'Available') return 1

      // Count actionable matches for each watch
      const aMatches = generateAllocationContacts(a.id, showAllClients).length
      const bMatches = generateAllocationContacts(b.id, showAllClients).length

      // More matches = higher priority
      if (aMatches !== bMatches) return bMatches - aMatches

      // Within same match count, sort by price (high to low)
      return b.price - a.price
    })
  }, [watchModels, searchQuery, showAllClients, generateAllocationContacts])

  const handleAllocate = (clientId: string) => {
    triggerHapticFeedback()
    setSelectedClientId(clientId)
    setShowConfirmation(true)
  }

  const handleWatchCardClick = (watchId: string) => {
    if (expandedWatchId === watchId) {
      setExpandedWatchId(null)
      setSelectedWatchId('')
    } else {
      setExpandedWatchId(watchId)
      setSelectedWatchId(watchId)
    }
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
        <div className="sticky top-0 z-20 bg-background md:static flex flex-col gap-4 p-4 md:p-6 lg:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Smart Allocation</h1>
            <p className="text-muted-foreground">AI-powered client recommendations for optimal sales</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowModal('greenbox')}
              className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700"
            >
              <Target className="h-4 w-4 mr-2" />
              Perfect Matches ({analytics.perfectMatches})
            </Button>
            <Button
              size="sm"
              onClick={() => setShowModal('alerts')}
              variant={analytics.criticalAlerts > 0 ? "destructive" : "default"}
            >
              <Star className="h-4 w-4 mr-2" />
              Critical Alerts ({analytics.criticalAlerts})
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-full mx-auto px-4 lg:px-8 pb-8 overflow-hidden">
          {/* Perfect Match Allocation Status Guide */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg text-blue-900 dark:text-blue-100">Allocation Status Guide</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* GREEN Status Guide */}
                <div className="relative flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <div className="absolute top-2 right-2 h-3 w-3 bg-green-500/60 dark:bg-green-500/40 rounded-full animate-pulse"></div>
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-1">
                      <span>PERFECT MATCH</span>
                      <Target className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">Client tier + price = immediate allocation</p>
                  </div>
                </div>

                {/* YELLOW Status Guide */}
                <div className="relative flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                  <div className="absolute top-2 right-2 h-3 w-3 bg-yellow-500/60 dark:bg-yellow-500/40 rounded-full animate-pulse"></div>
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-1">
                      <span>POSSIBLE MATCH</span>
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Stretch purchase or upgrade opportunity</p>
                  </div>
                </div>

                {/* RED Status Guide */}
                <div className="relative flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <div className="absolute top-2 right-2 h-3 w-3 bg-red-500/60 dark:bg-red-500/40 rounded-full animate-pulse"></div>
                  <div className="flex-shrink-0">
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-1">
                      <span>NO MATCH</span>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300">Price or tier mismatch - focus elsewhere</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    Perfect Matches
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.perfectMatches}</div>
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

          {/* Modern Search Interface */}
          <div className="mb-8">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search watches by brand, model, or collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border bg-card/50 backdrop-blur-sm focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Watch Cards Grid */}
            <div className="space-y-3">
              {filteredWatches.length === 0 ? (
                <Card className="p-12 text-center">
                  <Watch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No watches found</h3>
                  <p className="text-muted-foreground">Try adjusting your search query</p>
                </Card>
              ) : (
                filteredWatches.map((watch, index) => {
                  const isExpanded = expandedWatchId === watch.id
                  const watchSuggestions = isExpanded ? generateAllocationContacts(watch.id, showAllClients) : []
                  const watchWaitlistCount = waitlist.filter(e => e.watchModelId === watch.id).length
                  const perfectMatches = getPerfectMatches().filter(m => m.watchModelId === watch.id)

                  return (
                    <motion.div
                      key={watch.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={cn(
                          "group relative overflow-hidden cursor-pointer transition-all duration-200",
                          isExpanded
                            ? "ring-2 ring-primary shadow-lg"
                            : "hover:shadow-md"
                        )}
                        onClick={() => handleWatchCardClick(watch.id)}
                      >
                        {/* Subtle Background Effect */}
                        <div className={cn(
                          "absolute inset-0 transition-opacity duration-300 opacity-0",
                          watch.availability === 'Available' ? "bg-green-500/5" : "bg-orange-500/5",
                          isExpanded && "opacity-100"
                        )} />

                        <CardContent className="relative p-6">
                          {/* Main Watch Info */}
                          <div className="flex items-start gap-4">
                            {/* Watch Icon/Avatar */}
                            <div className={cn(
                              "flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 border-2",
                              watch.availability === 'Available'
                                ? "bg-green-500/10 border-green-500/30 text-green-600"
                                : "bg-orange-500/10 border-orange-500/30 text-orange-600"
                            )}>
                              {watch.availability === 'Available'
                                ? <CheckCircle2 className="h-8 w-8" />
                                : <Clock className="h-8 w-8" />
                              }
                            </div>

                            {/* Watch Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-semibold text-foreground truncate">
                                    {watch.brand} {watch.model}
                                  </h3>
                                  <p className="text-xs text-muted-foreground truncate">{watch.collection}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-lg font-semibold text-foreground">
                                    {formatCurrency(watch.price)}
                                  </div>
                                  <div className={cn(
                                    "text-xs font-medium mt-0.5",
                                    watch.availability === 'Available' ? 'text-green-600' : 'text-orange-600'
                                  )}>
                                    {watch.availability}
                                  </div>
                                </div>
                              </div>

                              {/* Compact Stats Row */}
                              <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                                {perfectMatches.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    <span>{perfectMatches.length} match{perfectMatches.length !== 1 ? 'es' : ''}</span>
                                  </div>
                                )}
                                {watchWaitlistCount > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{watchWaitlistCount}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">T{watch.watchTier}</span>
                                </div>
                              </div>

                              {/* Expand Indicator */}
                              {!isExpanded && (
                                <div className="mt-3 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                  <ArrowRight className="h-3.5 w-3.5 inline group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expanded Content - Client Recommendations */}
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="mt-6 pt-6 border-t"
                            >
                              {/* Header */}
                              <div className="mb-4">
                                <h4 className="text-lg font-semibold">Recommended Clients</h4>
                                <p className="text-xs text-muted-foreground mt-1">Tap anywhere to close</p>
                              </div>

                              {/* Toggle for Available Watches */}
                              {watch.availability === 'Available' && (
                                <div className="flex items-center gap-2 mb-4">
                                  <Button
                                    variant={showAllClients ? "default" : "outline"}
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setShowAllClients(!showAllClients)
                                    }}
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    {showAllClients ? `All Clients (${watchSuggestions.length})` : `Waitlist Only (${watchWaitlistCount})`}
                                  </Button>
                                </div>
                              )}

                              {/* Client Recommendations */}
                              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                                {watchSuggestions.length === 0 ? (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No client recommendations available</p>
                                  </div>
                                ) : (
                                  watchSuggestions.map((suggestion, suggestionIndex) => {
                                    const client = getClientById(suggestion.clientId)
                                    if (!client) return null

                                    return (
                                      <AllocationSuggestionCard
                                        key={suggestion.clientId}
                                        suggestion={suggestion}
                                        client={client}
                                        rank={suggestionIndex + 1}
                                        onAllocate={(clientId) => {
                                          setSelectedClientId(clientId)
                                          setShowConfirmation(true)
                                        }}
                                      />
                                    )
                                  })
                                )}
                              </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>

        </main>

        {/* Detail Modals */}
        {showModal && (
          <Dialog open={!!showModal} onOpenChange={() => setShowModal(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[calc(100vw-2rem)] md:w-full">
              <DialogHeader>
                <DialogTitle>
                  {showModal === 'waitlist' && 'Waitlist Entries'}
                  {showModal === 'watches' && 'Available Watches'}
                  {showModal === 'greenbox' && 'Perfect Matches'}
                  {showModal === 'alerts' && 'Critical Alerts'}
                </DialogTitle>
                {showModal === 'waitlist' && (
                  <div className="mt-2 md:mt-3 p-3 md:p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2 md:gap-3">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm md:text-base text-blue-900 dark:text-blue-100 mb-1">What are Waitlist Entries?</h4>
                        <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                          All clients who have expressed interest in specific watch models that are currently unavailable or reserved. Each entry tracks when the client was added, their tier status, lifetime spend, and any special notes. Use this to prioritize allocations when inventory becomes available.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {showModal === 'watches' && (
                  <div className="mt-2 md:mt-3 p-3 md:p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2 md:gap-3">
                      <Trophy className="h-4 w-4 md:h-5 md:w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm md:text-base text-amber-900 dark:text-amber-100 mb-1">What are Available Watches?</h4>
                        <p className="text-xs md:text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                          Your current inventory of luxury watches ready for immediate allocation. Each watch shows its tier level, number of clients waiting, and full specifications. Select any watch to see smart allocation recommendations based on client tier matching and wait times.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {showModal === 'greenbox' && (
                  <div className="mt-2 md:mt-3 p-3 md:p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-2 md:gap-3">
                      <Target className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm md:text-base text-green-900 dark:text-green-100 mb-1">What is a Perfect Match?</h4>
                        <p className="text-xs md:text-sm text-green-800 dark:text-green-200 leading-relaxed">
                          Perfect tier-to-watch matches where the client's VIP tier aligns perfectly with the watch tier. These are your highest-probability sales with minimal negotiation needed. The client's spending history and tier status make them ideal candidates for immediate allocation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {showModal === 'alerts' && (
                  <div className="mt-2 md:mt-3 p-3 md:p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-2 md:gap-3">
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-sm md:text-base text-red-900 dark:text-red-100 mb-1">What are Critical Alerts?</h4>
                        <p className="text-xs md:text-sm text-red-800 dark:text-red-200 leading-relaxed">
                          High-priority situations requiring immediate attention. This includes VIP clients (Tier 1-2) waiting 30+ days, clients who've spent $50K+ waiting 45+ days, or any Tier 1 client waiting 14+ days. These alerts prevent customer dissatisfaction and lost revenue opportunities.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </DialogHeader>

              {/* Waitlist Entries */}
              {showModal === 'waitlist' && (
                <div className="space-y-2 md:space-y-4">
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
                          <CardContent className="p-3 md:p-4">
                            <div className="flex items-center gap-2 md:gap-4">
                              <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs md:text-sm">
                                  {client.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                                  <h4 className="font-semibold text-sm md:text-base break-words">{client.name}</h4>
                                  <Badge className="text-xs flex-shrink-0">Tier {client.clientTier}</Badge>
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5 md:gap-2">
                                    <Watch className="h-3 w-3 flex-shrink-0" />
                                    <span className="break-words">{watch.brand} {watch.model} - {watch.collection}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 md:gap-2 mt-1">
                                    <Calendar className="h-3 w-3 flex-shrink-0" />
                                    <span>Added {new Date(entry.dateAdded).toLocaleDateString()}</span>
                                  </div>
                                  {entry.notes && (
                                    <div className="italic mt-1 break-words">"{entry.notes}"</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-semibold text-xs md:text-base">{formatCurrency(watch.price)}</div>
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

              {/* Perfect Matches */}
              {showModal === 'greenbox' && (
                <div className="space-y-4">
                  {getPerfectMatches().length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No Perfect Matches available</p>
                    </div>
                  ) : (
                    getPerfectMatches().map((match) => {
                      const client = getClientById(match.clientId)
                      const watch = getWatchModelById(match.watchModelId)
                      if (!client || !watch) return null

                      return (
                        <Card key={`${match.clientId}-${match.watchModelId}`} className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                          <CardContent className="p-3 md:p-4">
                            <div className="flex items-center gap-3 md:gap-4">
                              <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs md:text-sm">
                                  {client.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                                  <h4 className="font-semibold text-sm md:text-base break-words">{client.name}</h4>
                                  <Badge className={cn("text-xs border flex-shrink-0", getTierColorClasses(client.clientTier))}>
                                    Tier {client.clientTier}
                                  </Badge>
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1.5 md:gap-2">
                                    <Watch className="h-3 w-3 flex-shrink-0" />
                                    <span className="break-words">{watch.brand} {watch.model} - {watch.collection}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-semibold text-sm md:text-base">{formatCurrency(watch.price)}</div>
                                <div className="text-xs text-muted-foreground hidden md:block">{formatCurrency(client.lifetimeSpend)} lifetime</div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedWatchId(watch.id)
                                    setShowModal(null)
                                  }}
                                  className="mt-1 md:mt-2"
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
                  {getCriticalAlerts().length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">No critical alerts - everything looks good!</p>
                    </div>
                  ) : (
                    getCriticalAlerts().map((alert) => {
                      const client = getClientById(alert.clientId)
                      const watch = getWatchModelById(alert.watchModelId)
                      if (!client || !watch) return null

                      return (
                        <Card key={`${alert.clientId}-${alert.watchModelId}`}>
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
                                  <Badge variant="destructive">Critical</Badge>
                                  <Badge variant="outline">Tier {client.clientTier}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Watch className="h-3 w-3" />
                                    {watch.brand} {watch.model} - {watch.collection}
                                  </div>
                                  {alert.reason && (
                                    <div className="italic mt-1">"{alert.reason}"</div>
                                  )}
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
                                  className="mt-1"
                                  variant="destructive"
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