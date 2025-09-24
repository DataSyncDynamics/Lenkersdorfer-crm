'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Search,
  Clock,
  Star,
  Users,
  Trophy,
  ArrowRight,
  X,
  Filter,
  Crown,
  Calendar,
  Tag
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore, formatCurrency, getVipTierColor } from '@/lib/store'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import { cn } from '@/lib/utils'
import { getTierColorClasses, calculateDaysBetween, getAvatarInitials, getPositionStyling } from '@/lib/ui-utils'

interface WaitlistEntryProps {
  entry: any
  position: number
  onRemove: (id: string) => void
}

const WaitlistEntry: React.FC<WaitlistEntryProps> = ({ entry, position, onRemove }) => {
  const { getClientById } = useAppStore()
  const client = getClientById(entry.clientId)

  const daysWaiting = calculateDaysBetween(entry.dateAdded)

  // Early return if client is not found
  if (!client) {
    return (
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-sm text-muted-foreground">Client not found</div>
      </div>
    )
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors"
    >
      {/* Position */}
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
        getPositionStyling(position)
      )}>
        {position}
      </div>

      {/* Client Info */}
      <div className="flex items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
            {getAvatarInitials(client.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">{client.name}</h4>
            <Badge className={cn("text-xs border", getTierColorClasses(client.clientTier))}>
              Tier {client.clientTier}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatCurrency(client.lifetimeSpend)} lifetime • {client.spendPercentile}th percentile
          </div>
          {entry.notes && (
            <div className="text-sm text-muted-foreground mt-1 italic">
              "{entry.notes}"
            </div>
          )}
        </div>
      </div>

      {/* Wait Time */}
      <div className="text-right">
        <div className="text-sm font-medium">{daysWaiting} days</div>
        <div className="text-xs text-muted-foreground">waiting</div>
      </div>

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(entry.id)}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <X className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}

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

  const [searchQuery, setSearchQuery] = useState('')

  // Group waitlist by watch model
  const waitlistByWatch = useMemo(() => {
    return watchModels.map(watch => {
      const entries = getWaitlistForWatch(watch.id)
      return {
        watch,
        entries: entries.map(entry => ({
          ...entry,
          client: getClientById(entry.clientId)!
        }))
      }
    }).filter(group => group.entries.length > 0)
  }, [watchModels, getWaitlistForWatch, getClientById])

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

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalEntries = waitlist.length
    const watchesWithInterest = waitlistByWatch.length
    const vipEntries = waitlist.filter(entry => {
      const client = getClientById(entry.clientId)
      return client?.clientTier <= 2
    }).length
    const avgWaitTime = waitlist.length > 0
      ? waitlist.reduce((sum, entry) => {
          const days = Math.floor((new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24))
          return sum + days
        }, 0) / waitlist.length
      : 0

    return {
      totalEntries,
      watchesWithInterest,
      vipEntries,
      avgWaitTime: Math.round(avgWaitTime)
    }
  }, [waitlist, waitlistByWatch, getClientById])

  return (
    <LenkersdorferSidebar>
      <div className="flex flex-1 flex-col bg-background">
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Waitlist Management</h1>
            <p className="text-muted-foreground">Track client interest in luxury timepieces</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Users className="h-4 w-4 mr-2" />
              Add to Waitlist
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
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Entries
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalEntries}</div>
                  <p className="text-xs text-muted-foreground">Active waitlist positions</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Watches with Interest
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.watchesWithInterest}</div>
                  <p className="text-xs text-muted-foreground">Models in demand</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    VIP Entries
                  </CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.vipEntries}</div>
                  <p className="text-xs text-muted-foreground">Tier 1-2 clients</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Wait Time
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgWaitTime}</div>
                  <p className="text-xs text-muted-foreground">Days waiting</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-2 bg-transparent border-0 focus:outline-none focus:ring-0 text-base placeholder:text-muted-foreground"
                  placeholder="Search watches, clients, or collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredWaitlistByWatch.length} watches with waitlist entries
            </p>
          </div>

          {/* Waitlist by Watch Model */}
          <div className="space-y-6">
            {filteredWaitlistByWatch.map(({ watch, entries }) => (
              <Card key={watch.id} className="overflow-hidden">
                {/* Watch Header */}
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {watch.brand} {watch.model}
                      </CardTitle>
                      <p className="text-muted-foreground">{watch.collection}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600 mb-2">
                        {formatCurrency(watch.price)}
                      </div>
                      <Badge variant={watch.availability === 'Available' ? 'default' : 'secondary'}>
                        {watch.availability}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {/* Waitlist Entries */}
                <CardContent className="p-0">
                  <div className="divide-y">
                    {entries.map((entry, index) => (
                      <WaitlistEntry
                        key={entry.id}
                        entry={entry}
                        position={index + 1}
                        onRemove={removeFromWaitlist}
                      />
                    ))}
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <div className="p-4 bg-muted/30 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {entries.length} {entries.length === 1 ? 'client' : 'clients'} waiting
                    </div>
                    <Link href={`/allocation?watch=${watch.id}`}>
                      <Button size="sm">
                        <Trophy className="h-4 w-4 mr-2" />
                        Smart Allocation
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredWaitlistByWatch.length === 0 && (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No matches found' : 'No waitlist entries'}
                </h3>
                <p className="text-muted-foreground text-center max-w-sm mb-4">
                  {searchQuery
                    ? 'Try adjusting your search terms to find what you\'re looking for.'
                    : 'Start adding clients to watch waitlists to track interest in luxury timepieces.'
                  }
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                ) : (
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    Add to Waitlist
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </LenkersdorferSidebar>
  )
}