'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Clock,
  Users,
  Trophy,
  ArrowRight,
  X,
  Crown,
  AlertTriangle,
  CheckCircle2,
  Watch,
  TrendingUp,
  MessageSquare,
  Phone,
  User,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAppStore, formatCurrency } from '@/lib/store'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import { cn } from '@/lib/utils'
import { getTierColorClasses, calculateDaysBetween, getAvatarInitials } from '@/lib/ui-utils'

export default function WaitlistPage() {
  const {
    clients,
    watchModels,
    waitlist,
    getClientById,
    getWatchModelById,
    getWaitlistForWatch,
    calculateMatchStatus,
    removeFromWaitlist,
    calculateEntryMatchScore
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedWatchId, setExpandedWatchId] = useState<string | null>(null)
  const [expandedModalWatchId, setExpandedModalWatchId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<'total' | 'watches' | 'vip' | 'urgent' | null>(null)

  // Calculate analytics with Urgent Follow-ups logic
  const analytics = useMemo(() => {
    // Only count entries that have valid client AND watch data
    const validEntries = waitlist.filter(entry => {
      const client = getClientById(entry.clientId)
      const watch = getWatchModelById(entry.watchModelId)
      return client && watch
    })

    const totalEntries = validEntries.length

    // Only count watches that have at least one valid entry
    const watchesWithInterest = watchModels.filter(watch =>
      validEntries.some(entry => entry.watchModelId === watch.id)
    ).length

    const vipEntries = validEntries.filter(entry => {
      const client = getClientById(entry.clientId)
      return client?.clientTier <= 2
    }).length

    // Urgent Follow-ups: High-value clients (Tier 1-2 OR $50K+ lifetime) waiting 90+ days
    const urgentFollowups = validEntries.filter(entry => {
      const client = getClientById(entry.clientId)
      if (!client) return false

      const daysWaiting = calculateDaysBetween(entry.dateAdded)
      const isHighValue = client.clientTier <= 2 || client.lifetimeSpend >= 50000

      return daysWaiting >= 90 && isHighValue
    }).length

    return {
      totalEntries,
      watchesWithInterest,
      vipEntries,
      urgentFollowups
    }
  }, [waitlist, watchModels, getClientById, getWatchModelById])

  // Group waitlist by watch model and sort by match quality
  const waitlistByWatch = useMemo(() => {
    return watchModels.map(watch => {
      const entries = getWaitlistForWatch(watch.id)
      return {
        watch,
        entries: entries
          .map(entry => {
            const client = getClientById(entry.clientId)
            if (!client) return null
            return {
              ...entry,
              client,
              daysWaiting: calculateDaysBetween(entry.dateAdded),
              matchScore: calculateEntryMatchScore(entry.clientId, watch.id, entry.dateAdded)
            }
          })
          .filter(entry => entry !== null) // Remove null entries
          .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score descending (best matches first)
      }
    }).filter(group => group.entries.length > 0)
  }, [watchModels, getWaitlistForWatch, getClientById, calculateEntryMatchScore])

  // Filter based on search
  const filteredWaitlistByWatch = useMemo(() => {
    if (!searchQuery) return waitlistByWatch

    const searchLower = searchQuery.toLowerCase()
    return waitlistByWatch.filter(({ watch, entries }) => {
      const watchMatch = `${watch.brand} ${watch.model} ${watch.collection}`.toLowerCase().includes(searchLower)
      const clientMatch = entries.some(entry =>
        entry.client.name.toLowerCase().includes(searchLower)
      )
      return watchMatch || clientMatch
    })
  }, [waitlistByWatch, searchQuery])

  // Get data for modals
  const getModalData = () => {
    switch (showModal) {
      case 'total':
        return waitlist.map(entry => ({
          ...entry,
          client: getClientById(entry.clientId)!,
          watch: getWatchModelById(entry.watchModelId)!,
          daysWaiting: calculateDaysBetween(entry.dateAdded)
        })).filter(e => e.client && e.watch)

      case 'watches':
        return waitlistByWatch.map(({ watch, entries }) => ({
          watch,
          clientCount: entries.length,
          entries: entries // Include the entries array for expansion
        }))

      case 'vip':
        return waitlist
          .filter(entry => {
            const client = getClientById(entry.clientId)
            return client?.clientTier <= 2
          })
          .map(entry => ({
            ...entry,
            client: getClientById(entry.clientId)!,
            watch: getWatchModelById(entry.watchModelId)!,
            daysWaiting: calculateDaysBetween(entry.dateAdded)
          }))
          .filter(e => e.client && e.watch)

      case 'urgent':
        return waitlist
          .filter(entry => {
            const client = getClientById(entry.clientId)
            if (!client) return false

            const daysWaiting = calculateDaysBetween(entry.dateAdded)
            const isHighValue = client.clientTier <= 2 || client.lifetimeSpend >= 50000

            return daysWaiting >= 90 && isHighValue
          })
          .map(entry => ({
            ...entry,
            client: getClientById(entry.clientId)!,
            watch: getWatchModelById(entry.watchModelId)!,
            daysWaiting: calculateDaysBetween(entry.dateAdded)
          }))
          .filter(e => e.client && e.watch)
          .sort((a, b) => {
            // Sort by tier first, then days waiting
            if (a.client.clientTier !== b.client.clientTier) {
              return a.client.clientTier - b.client.clientTier
            }
            return b.daysWaiting - a.daysWaiting
          })

      default:
        return []
    }
  }

  const handleWatchCardClick = (watchId: string) => {
    if (expandedWatchId === watchId) {
      setExpandedWatchId(null)
    } else {
      setExpandedWatchId(watchId)
    }
  }

  return (
    <LenkersdorferSidebar>
      <div className="flex flex-1 flex-col bg-background">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background md:static flex flex-col gap-4 p-4 md:p-6 lg:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Waitlist Management</h1>
            <p className="text-muted-foreground">Track client interest in luxury timepieces</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className={cn(
                analytics.urgentFollowups > 0
                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                  : "bg-gray-600 hover:bg-gray-700 text-white"
              )}
              onClick={() => setShowModal('urgent')}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Urgent Follow-ups ({analytics.urgentFollowups})
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-full mx-auto px-4 lg:px-8 pb-8 overflow-y-auto">
          {/* Analytics Cards - Matching Allocation Page */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Total Entries */}
            <div
              className="cursor-pointer"
              onClick={() => setShowModal('total')}
            >
              <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground/70">
                    Total Entries
                  </CardTitle>
                  <Clock className="h-4 w-4 text-foreground/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{analytics.totalEntries}</div>
                  <p className="text-xs text-foreground/60">Active waitlist positions</p>
                </CardContent>
              </Card>
            </div>

            {/* Watches with Interest */}
            <div
              className="cursor-pointer"
              onClick={() => setShowModal('watches')}
            >
              <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground/70">
                    Watches with Interest
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-foreground/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{analytics.watchesWithInterest}</div>
                  <p className="text-xs text-foreground/60">Models in demand</p>
                </CardContent>
              </Card>
            </div>

            {/* VIP Entries */}
            <div
              className="cursor-pointer"
              onClick={() => setShowModal('vip')}
            >
              <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground/70">
                    VIP Entries
                  </CardTitle>
                  <Crown className="h-4 w-4 text-foreground/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{analytics.vipEntries}</div>
                  <p className="text-xs text-foreground/60">Tier 1-2 clients</p>
                </CardContent>
              </Card>
            </div>

            {/* Urgent Follow-ups */}
            <div
              className="cursor-pointer"
              onClick={() => setShowModal('urgent')}
            >
              <Card className={cn(
                "hover:shadow-lg hover:border-primary/20 transition-all duration-200",
                analytics.urgentFollowups > 0 && "border-orange-500/50"
              )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground/70">
                    Urgent Follow-ups
                  </CardTitle>
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    analytics.urgentFollowups > 0 ? "text-orange-500" : "text-foreground/70"
                  )} />
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    analytics.urgentFollowups > 0 ? "text-orange-600 dark:text-orange-500" : "text-foreground"
                  )}>
                    {analytics.urgentFollowups}
                  </div>
                  <p className="text-xs text-foreground/60">High-value clients waiting 90+ days</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Modern Search Interface - Matching Allocation Page */}
          <div className="mb-8">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/50" />
              <input
                type="text"
                placeholder="Search watches, clients, or collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 text-lg rounded-2xl border-2 border-border bg-card/50 backdrop-blur-sm focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 placeholder:text-foreground/40 text-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Watch Cards Grid - Matching Allocation Page */}
            <div className="space-y-3">
              {filteredWaitlistByWatch.length === 0 ? (
                <Card className="p-12 text-center border-2 border-dashed border-foreground/20">
                  <div className="max-w-md mx-auto">
                    <div className="relative mb-6">
                      <Watch className="h-16 w-16 mx-auto text-foreground/30" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">0</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">
                      {searchQuery ? 'No matches found' : 'No waitlist entries yet'}
                    </h3>
                    <p className="text-foreground/60 mb-4">
                      {searchQuery
                        ? 'Try adjusting your search query or filters'
                        : 'Waitlist entries will appear here when clients request watches that are not currently available'}
                    </p>
                    {!searchQuery && (
                      <p className="text-sm text-foreground/50 mt-4">
                        💡 Tip: Add clients to the waitlist from the Allocation page when watches are reserved or unavailable
                      </p>
                    )}
                  </div>
                </Card>
              ) : (
                filteredWaitlistByWatch.map(({ watch, entries }, index) => {
                  const isExpanded = expandedWatchId === watch.id
                  const watchWaitlistCount = entries.length
                  const vipCount = entries.filter(e => e.client && e.client.clientTier <= 2).length

                  return (
                    <div
                      key={watch.id}
                    >
                      <Card
                        className={cn(
                          "group relative overflow-hidden cursor-pointer transition-all duration-200 w-full",
                          isExpanded
                            ? "ring-2 ring-primary shadow-lg"
                            : "hover:shadow-md"
                        )}
                        onClick={() => handleWatchCardClick(watch.id)}
                      >
                        <CardContent className="p-4 md:p-6">
                          <div className="flex items-center gap-3 md:gap-4">
                            {/* Watch Icon/Avatar */}
                            <div className={cn(
                              "flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-all duration-300 border-2",
                              watch.availability === 'Available'
                                ? "bg-green-500/10 border-green-500/30 text-green-600"
                                : "bg-orange-500/10 border-orange-500/30 text-orange-600"
                            )}>
                              {watch.availability === 'Available'
                                ? <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8" />
                                : <Clock className="h-6 w-6 md:h-8 md:w-8" />
                              }
                            </div>

                            {/* Watch Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base md:text-lg mb-1 break-words text-foreground">
                                {watch.brand} {watch.model}
                              </h3>
                              <p className="text-xs md:text-sm text-foreground/60 break-words mb-2">
                                {watch.collection}
                              </p>

                              {/* Compact Stats Row */}
                              <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-foreground/70">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>{watchWaitlistCount}</span>
                                </div>
                                {vipCount > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Crown className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
                                    <span>{vipCount} VIP</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">T{watch.watchTier}</span>
                                </div>
                              </div>
                            </div>

                            {/* Price & Status */}
                            <div className="text-right">
                              <div className="text-xl font-bold text-foreground mb-2">
                                {formatCurrency(watch.price)}
                              </div>
                              <Badge variant={watch.availability === 'Available' ? 'default' : 'secondary'}>
                                {watch.availability}
                              </Badge>
                            </div>

                            {/* Expand Indicator */}
                            <div className={cn(
                              "flex-shrink-0 transition-transform duration-200",
                              isExpanded && "rotate-90"
                            )}>
                              <ArrowRight className="h-5 w-5 text-foreground/70" />
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div
                              className="mt-4 md:mt-6 pt-4 md:pt-6 border-t w-full"
                            >
                              <div className="mb-3 md:mb-4">
                                <h4 className="text-base md:text-lg font-semibold text-foreground">Waitlist ({entries.length})</h4>
                                <p className="text-xs text-foreground/60 mt-1">Tap anywhere to close</p>
                              </div>

                              {/* Client List */}
                              <div className="space-y-2 md:space-y-3 w-full" onClick={(e) => e.stopPropagation()}>
                                {entries.map((entry, idx) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors w-full"
                                  >
                                    {/* Position */}
                                    <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs md:text-sm">
                                      {idx + 1}
                                    </div>

                                    {/* Client Avatar */}
                                    <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs md:text-sm">
                                        {getAvatarInitials(entry.client.name)}
                                      </AvatarFallback>
                                    </Avatar>

                                    {/* Client Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                                        <span className="font-semibold text-sm md:text-base break-words text-foreground">{entry.client.name}</span>
                                        <Badge className={cn("text-xs border flex-shrink-0", getTierColorClasses(entry.client.clientTier))}>
                                          Tier {entry.client.clientTier}
                                        </Badge>
                                      </div>
                                      <div className="text-xs md:text-sm text-foreground/70">
                                        {formatCurrency(entry.client.lifetimeSpend)} lifetime
                                      </div>
                                      {entry.notes && (
                                        <div className="text-xs text-foreground/60 mt-1 italic break-words">
                                          "{entry.notes.split(/(PERFECT MATCH|STRETCH PURCHASE)/g).map((part, i) => {
                                            if (part === 'PERFECT MATCH') {
                                              return <span key={i} className="text-green-600 dark:text-green-500 font-semibold not-italic">{part}</span>
                                            }
                                            if (part === 'STRETCH PURCHASE') {
                                              return <span key={i} className="text-orange-600 dark:text-orange-500 font-semibold not-italic">{part}</span>
                                            }
                                            return part
                                          })}"
                                        </div>
                                      )}
                                    </div>

                                    {/* Days Waiting */}
                                    <div className="text-right flex-shrink-0">
                                      <div className="text-xs md:text-sm font-medium text-foreground">{entry.daysWaiting} days</div>
                                      <div className="text-xs text-foreground/60">waiting</div>
                                    </div>

                                    {/* Remove Button */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFromWaitlist(entry.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 flex-shrink-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>

                              {/* Action Button */}
                              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t w-full">
                                <Link href={`/allocation?watch=${watch.id}`} onClick={(e) => e.stopPropagation()}>
                                  <Button className="w-full">
                                    <Trophy className="h-4 w-4 mr-2" />
                                    Smart Allocation
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <Dialog open={!!showModal} onOpenChange={() => setShowModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[calc(100vw-2rem)] md:w-full">
          <DialogHeader>
            <DialogTitle>
              {showModal === 'total' && 'All Waitlist Entries'}
              {showModal === 'watches' && 'Watches with Interest'}
              {showModal === 'vip' && 'VIP Waitlist Entries'}
              {showModal === 'urgent' && 'Urgent Follow-ups'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 md:space-y-3">
            {showModal === 'watches' ? (
              // Watches list - Expandable
              (getModalData() as any[]).map((item: any) => {
                const isExpanded = expandedModalWatchId === item.watch.id
                const entries = item.entries || []

                return (
                  <div key={item.watch.id} className="rounded-lg bg-muted/50 overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => setExpandedModalWatchId(isExpanded ? null : item.watch.id)}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <h4 className="font-semibold text-sm md:text-base text-foreground break-words">{item.watch.brand} {item.watch.model}</h4>
                        <p className="text-xs md:text-sm text-foreground/70 break-words">{item.watch.collection}</p>
                      </div>
                      <div className="text-right flex-shrink-0 mr-3">
                        <div className="font-bold text-base md:text-lg text-foreground">{formatCurrency(item.watch.price)}</div>
                        <div className="text-xs md:text-sm text-foreground/70">{item.clientCount} waiting</div>
                      </div>
                      <ArrowRight className={cn(
                        "h-5 w-5 text-foreground/70 transition-transform duration-200 flex-shrink-0",
                        isExpanded && "rotate-90"
                      )} />
                    </div>

                    {/* Expanded Client List */}
                    {isExpanded && entries.length > 0 && (
                      <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-3 border-t border-border/50">
                        <p className="text-xs text-foreground/60 pt-3">Clients waiting for this watch:</p>
                        {entries
                          .filter((entry: any) => entry.client) // Filter out entries without client data
                          .map((entry: any, idx: number) => {
                            // Calculate match status
                            const matchStatus = calculateMatchStatus(
                              entry.client.clientTier,
                              item.watch.watchTier,
                              entry.client.lifetimeSpend,
                              item.watch.price
                            )
                            const matchColor = matchStatus === 'GREEN' ? 'text-green-500' : matchStatus === 'YELLOW' ? 'text-yellow-500' : 'text-red-500'
                            const matchLabel = matchStatus === 'GREEN' ? 'Perfect Match' : matchStatus === 'YELLOW' ? 'Upgrade Opp.' : 'Not Suitable'

                            return (
                              <div key={entry.id} className="p-3 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-all">
                                {/* Client Header Row */}
                                <div className="flex items-start gap-2 mb-2">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                    {idx + 1}
                                  </div>
                                  <Avatar className="h-9 w-9 flex-shrink-0">
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs">
                                      {getAvatarInitials(entry.client.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                      <span className="font-semibold text-sm text-foreground">{entry.client.name}</span>
                                      <Badge className={cn("text-xs", getTierColorClasses(entry.client.clientTier))}>
                                        Tier {entry.client.clientTier}
                                      </Badge>
                                    </div>
                                    {/* Sales Intelligence */}
                                    <div className="flex items-center gap-2 text-xs text-foreground/70 flex-wrap">
                                      <span className="font-medium text-green-600 dark:text-green-400">
                                        {formatCurrency(entry.client.lifetimeSpend)} lifetime
                                      </span>
                                      <span>•</span>
                                      <span>{entry.daysWaiting} days waiting</span>
                                      {entry.daysWaiting >= 90 && (
                                        <>
                                          <span>•</span>
                                          <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700 text-xs">
                                            URGENT
                                          </Badge>
                                        </>
                                      )}
                                    </div>
                                    {/* Match Score */}
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <div className={cn("w-2 h-2 rounded-full", matchColor.replace('text-', 'bg-'))} />
                                      <span className={cn("text-xs font-medium", matchColor)}>{matchLabel}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs flex-1 min-w-[80px]"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.location.href = `sms:${entry.client.phone}`
                                    }}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Text
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs flex-1 min-w-[80px]"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.location.href = `tel:${entry.client.phone}`
                                    }}
                                  >
                                    <Phone className="h-3 w-3 mr-1" />
                                    Call
                                  </Button>
                                  <Link
                                    href={`/clients`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 min-w-[80px]"
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs w-full"
                                    >
                                      <User className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                  </Link>
                                  <Link
                                    href={`/allocation?watch=${item.watch.id}&client=${entry.client.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 min-w-[80px]"
                                  >
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs w-full bg-primary hover:bg-primary/90"
                                    >
                                      <Target className="h-3 w-3 mr-1" />
                                      Allocate
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              // Client entries
              (getModalData() as any[]).map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs md:text-sm">
                      {getAvatarInitials(entry.client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                      <span className="font-semibold text-sm md:text-base text-foreground break-words">{entry.client.name}</span>
                      <Badge className={cn("text-xs border flex-shrink-0", getTierColorClasses(entry.client.clientTier))}>
                        Tier {entry.client.clientTier}
                      </Badge>
                      {showModal === 'urgent' && entry.daysWaiting >= 120 && (
                        <Badge className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 text-xs flex-shrink-0" variant="outline">
                          CRITICAL
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs md:text-sm text-foreground/70 break-words">
                      {entry.watch.brand} {entry.watch.model}
                    </div>
                    <div className="text-xs text-foreground/60 mt-1">
                      {formatCurrency(entry.client.lifetimeSpend)} lifetime • {entry.daysWaiting} days waiting
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-xs md:text-base text-foreground">{formatCurrency(entry.watch.price)}</div>
                    <Link href={`/allocation?watch=${entry.watch.id}`}>
                      <Button size="sm" className="mt-1 text-xs md:text-sm">Allocate</Button>
                    </Link>
                  </div>
                </div>
              ))
            )}

            {getModalData().length === 0 && (
              <div className="text-center py-8 text-foreground/60">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No entries found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </LenkersdorferSidebar>
  )
}
