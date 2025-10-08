'use client'

import React, { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import {
  Search,
  Users,
  Crown,
  Star,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore, formatCurrency } from '@/lib/store'
import { NewClientData } from '@/types'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import { ClientCard } from '@/components/clients/ClientCard'
import { useNotifications } from '@/contexts/NotificationContext'
import { cn } from '@/lib/utils'
import { getTierColorClasses, getAvatarInitials } from '@/lib/ui-utils'
import { triggerHapticFeedback } from '@/lib/haptic-utils'

// Lazy load modals
const ClientModal = dynamic(() => import('@/components/clients/ClientModal').then(mod => ({ default: mod.ClientModal })), { ssr: false })
const AddClientModal = dynamic(() => import('@/components/clients/AddClientModal').then(mod => ({ default: mod.AddClientModal })), { ssr: false })

export default function ClientsPage() {
  const {
    searchQuery,
    setSearchQuery,
    getFilteredClients,
    setSelectedClient,
    selectedClient,
    updateClient,
    addClient,
    clients,
    addToWaitlist
  } = useAppStore()

  const { notifications, markAsRead } = useNotifications()

  // Mark relevant notifications as read when visiting clients page
  useEffect(() => {
    const clientPageNotifications = notifications.filter(n =>
      (n.category === 'URGENT_CLIENTS' || n.category === 'NEW_OPPORTUNITIES') && !n.isRead
    )

    // Auto-mark as read after 3 seconds to give user time to see them
    const timer = setTimeout(() => {
      clientPageNotifications.forEach(notification => {
        markAsRead(notification.id)
      })
    }, 3000)

    return () => clearTimeout(timer)
  }, [notifications, markAsRead])

  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [showVipModal, setShowVipModal] = useState(false)
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [tierFilter, setTierFilter] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  // Sync local search with global when changed externally
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  // Debounce search input (150ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery)
    }, 150)

    return () => clearTimeout(timer)
  }, [localSearchQuery, setSearchQuery])

  // Apply additional sorting and filtering
  const filteredAndSortedClients = useMemo(() => {
    let results = getFilteredClients()

    // Apply tier filter
    if (tierFilter !== null) {
      results = results.filter(client => client.clientTier === tierFilter)
    }

    // Apply sorting
    results = results.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'tier':
          aValue = a.clientTier
          bValue = b.clientTier
          break
        case 'spend':
          aValue = a.lifetimeSpend
          bValue = b.lifetimeSpend
          break
        case 'joinDate':
          aValue = new Date(a.joinDate).getTime()
          bValue = new Date(b.joinDate).getTime()
          break
        case 'lastPurchase':
          aValue = a.lastPurchase ? new Date(a.lastPurchase).getTime() : 0
          bValue = b.lastPurchase ? new Date(b.lastPurchase).getTime() : 0
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return results
  }, [searchQuery, sortBy, sortOrder, tierFilter, clients])

  const handleSaveClient = (clientData: any) => {
    if (!selectedClient) return

    updateClient(selectedClient.id, clientData)
    setSelectedClient(null)
  }

  const handleAddNewClient = (newClientData: NewClientData) => {
    const fullName = `${newClientData.firstName} ${newClientData.lastName}`
    const newClientId = addClient({
      name: fullName,
      email: newClientData.email,
      phone: newClientData.phone,
      notes: newClientData.notes,
      preferredBrands: [],
      joinDate: new Date().toISOString(),
      lifetimeSpend: 0,
      vipTier: 'Bronze',
      clientTier: 5,
      spendPercentile: 0,
      lastPurchase: '',
      purchases: [],
      avatar: undefined
    })

    // Add wishlist items for the new client
    newClientData.wishlistWatches.forEach((watch: any) => {
      addToWaitlist(newClientId, watch.watchId, watch.notes)
    })

    setShowAddClientModal(false)
  }

  // Calculate client analytics
  const analytics = useMemo(() => {
    const totalRevenue = clients.reduce((sum, client) => sum + client.lifetimeSpend, 0)
    const avgSpend = totalRevenue / clients.length || 0
    // VIP clients = top 3 highest spenders (matches dashboard)
    const vipClients = Math.min(3, clients.length)
    const activeClients = clients.filter(c => {
      const lastPurchase = new Date(c.lastPurchase)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return lastPurchase >= sixMonthsAgo
    }).length

    return {
      totalClients: clients.length,
      totalRevenue,
      avgSpend,
      vipClients,
      activeClients
    }
  }, [clients])

  // Get VIP clients for modal - top 3 highest spenders (matches dashboard)
  const vipClientsList = useMemo(() => {
    return clients
      .sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
      .slice(0, 3)
  }, [clients])

  return (
    <LenkersdorferSidebar>
      <div className="flex flex-1 flex-col bg-background">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background md:static flex flex-col gap-4 p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Clients</h1>
            <Button size="default" onClick={() => {
              triggerHapticFeedback()
              setShowAddClientModal(true)
            }} className="h-10">
              <Users className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Manage your luxury watch clientele</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-28 h-10">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="tier">Tier</SelectItem>
                  <SelectItem value="spend">Spend</SelectItem>
                  <SelectItem value="joinDate">Join Date</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="default"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-10 w-10 p-0 flex-shrink-0"
              >
                {sortOrder === 'asc' ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
              </Button>

              <Select value={tierFilter?.toString() || 'all'} onValueChange={(value) => setTierFilter(value === 'all' ? null : parseInt(value))}>
                <SelectTrigger className="w-20 h-10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">T1</SelectItem>
                  <SelectItem value="2">T2</SelectItem>
                  <SelectItem value="3">T3</SelectItem>
                  <SelectItem value="4">T4</SelectItem>
                  <SelectItem value="5">T5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-full mx-auto px-4 lg:px-8 pb-8 overflow-hidden">
          {/* Analytics Cards */}
          <div className="grid grid-cols-5 md:grid-cols-2 lg:grid-cols-5 gap-1.5 md:gap-4 mb-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 h-full">
                <CardHeader className="p-2 pb-1">
                  <Users className="h-3 w-3 text-muted-foreground mx-auto mb-1" />
                  <CardTitle className="text-[10px] text-center text-muted-foreground font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 text-center">
                  <div className="text-sm font-bold">{analytics.totalClients}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 h-full">
                <CardHeader className="p-2 pb-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground mx-auto mb-1" />
                  <CardTitle className="text-[10px] text-center text-muted-foreground font-medium">Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 text-center">
                  <div className="text-[11px] font-bold leading-tight">{formatCurrency(analytics.totalRevenue)}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 h-full">
                <CardHeader className="p-2 pb-1">
                  <Star className="h-3 w-3 text-muted-foreground mx-auto mb-1" />
                  <CardTitle className="text-[10px] text-center text-muted-foreground font-medium">Avg</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 text-center">
                  <div className="text-[11px] font-bold leading-tight">{formatCurrency(analytics.avgSpend)}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer"
              onClick={() => setShowVipModal(true)}
            >
              <Card className="hover:shadow-lg transition-all duration-200 h-full">
                <CardHeader className="p-2 pb-1">
                  <Crown className="h-3 w-3 text-yellow-600 dark:text-yellow-500 mx-auto mb-1" />
                  <CardTitle className="text-[10px] text-center text-foreground/70 font-medium">VIP</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 text-center">
                  <div className="text-sm font-bold text-foreground">{analytics.vipClients}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 h-full">
                <CardHeader className="p-2 pb-1">
                  <Users className="h-3 w-3 text-muted-foreground mx-auto mb-1" />
                  <CardTitle className="text-[10px] text-center text-muted-foreground font-medium">Active</CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 text-center">
                  <div className="text-sm font-bold">{analytics.activeClients}</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search Bar */}
          <Card className="mb-6 mx-0">
            <CardContent className="p-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    className="pl-10 pr-12 w-full"
                    style={{ fontSize: '16px' }}
                    placeholder="Search clients..."
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                  />
                  {localSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 z-10"
                      onClick={() => {
                        setLocalSearchQuery('')
                        setSearchQuery('')
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Active Filters Display */}
                <div className="flex items-center gap-2 flex-wrap">
                  {tierFilter !== null && (
                    <Badge variant="secondary" className="gap-1 whitespace-nowrap">
                      Tier {tierFilter}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => setTierFilter(null)}
                      />
                    </Badge>
                  )}
                  {sortBy !== 'name' && (
                    <Badge variant="outline" className="gap-1 whitespace-nowrap">
                      Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => setSortBy('name')}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count & Status */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedClients.length} of {clients.length} clients
              {searchQuery && (
                <span className="ml-2 text-xs">
                  • Searching for "{searchQuery}"
                </span>
              )}
              {tierFilter !== null && (
                <span className="ml-2 text-xs">
                  • Tier {tierFilter} only
                </span>
              )}
            </p>

            {sortBy !== 'name' && (
              <p className="text-xs text-muted-foreground">
                Sorted by {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                ({sortOrder === 'asc' ? 'ascending' : 'descending'})
              </p>
            )}
          </div>

          {/* Client Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {filteredAndSortedClients.map((client) => (
              <div key={client.id} className="w-full min-w-0">
                <ClientCard
                  client={client}
                  onClick={() => setSelectedClient(client)}
                />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredAndSortedClients.length === 0 && (
            <Card className="mt-8">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No clients found' : 'No clients yet'}
                </h3>
                <p className="text-muted-foreground text-center max-w-sm mb-4">
                  {searchQuery
                    ? 'Try adjusting your search terms to find the clients you\'re looking for.'
                    : 'Get started by adding your first client to build your luxury watch portfolio.'
                  }
                </p>
                {searchQuery ? (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                ) : (
                  <Button onClick={() => setShowAddClientModal(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Add First Client
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </main>

        {/* Client Edit Modal */}
        <ClientModal
          selectedClient={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSave={handleSaveClient}
        />

        {/* Add Client Modal */}
        <AddClientModal
          open={showAddClientModal}
          onClose={() => setShowAddClientModal(false)}
          onAdd={handleAddNewClient}
        />

        {/* VIP Clients Modal */}
        <Dialog open={showVipModal} onOpenChange={setShowVipModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[calc(100vw-2rem)] md:w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                VIP Clients ({analytics.vipClients})
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 md:space-y-3">
              {vipClientsList.length === 0 ? (
                <div className="text-center py-8 text-foreground/60">
                  <Crown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No VIP clients yet</p>
                </div>
              ) : (
                vipClientsList.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedClient(client)
                      setShowVipModal(false)
                    }}
                  >
                    <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs md:text-sm">
                        {getAvatarInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1 flex-wrap">
                        <span className="font-semibold text-sm md:text-base text-foreground break-words">{client.name}</span>
                        <Badge className={cn("text-xs border flex-shrink-0", getTierColorClasses(client.clientTier))}>
                          Tier {client.clientTier}
                        </Badge>
                      </div>
                      <div className="text-xs md:text-sm text-foreground/70 break-all">
                        {client.email}
                      </div>
                      <div className="text-xs text-foreground/60 mt-1">
                        {formatCurrency(client.lifetimeSpend)} lifetime spend
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-foreground">{client.purchases.length}</div>
                      <div className="text-xs text-foreground/60">purchases</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </LenkersdorferSidebar>
  )
}