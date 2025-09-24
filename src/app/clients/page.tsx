'use client'

import React, { useState, useMemo } from 'react'
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
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAppStore, formatCurrency } from '@/lib/store'
import { NewClientData } from '@/types'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import { ClientCard } from '@/components/clients/ClientCard'
import { ClientModal } from '@/components/clients/ClientModal'
import { AddClientModal } from '@/components/clients/AddClientModal'

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

  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [tierFilter, setTierFilter] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)

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
  }, [getFilteredClients, sortBy, sortOrder, tierFilter])

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
    const vipClients = clients.filter(c => c.clientTier <= 2).length
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

  return (
    <LenkersdorferSidebar>
      <div className="flex flex-1 flex-col bg-background">
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">Manage your luxury watch clientele</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
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
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>

              <Select value={tierFilter?.toString() || 'all'} onValueChange={(value) => setTierFilter(value === 'all' ? null : parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Tier" />
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

              {(tierFilter !== null || sortBy !== 'name' || sortOrder !== 'asc') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSortBy('name')
                    setSortOrder('asc')
                    setTierFilter(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button size="sm" onClick={() => setShowAddClientModal(true)}>
              <Users className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-full mx-auto px-4 lg:px-8 pb-8">
          {/* Analytics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Clients
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalClients}</div>
                  <p className="text-xs text-muted-foreground">Active portfolio</p>
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
                    Total Revenue
                  </CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">Lifetime value</p>
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
                    Avg. Spend
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.avgSpend)}</div>
                  <p className="text-xs text-muted-foreground">Per client</p>
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
                    VIP Clients
                  </CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.vipClients}</div>
                  <p className="text-xs text-muted-foreground">Tier 1-2</p>
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
                    Active
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.activeClients}</div>
                  <p className="text-xs text-muted-foreground">Last 6 months</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                  <Input
                    className="pl-10 pr-12 w-full"
                    placeholder="Search clients by name, email, phone, or preferred brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 z-10"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Active Filters Display */}
                <div className="flex items-center gap-2 flex-shrink-0">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => setSelectedClient(client)}
              />
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
      </div>
    </LenkersdorferSidebar>
  )
}