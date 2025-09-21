'use client'

import { create } from 'zustand'
import { Client, WatchModel, WaitlistEntry, AllocationSuggestion } from '@/types'
import { mockClients, mockWatchModels, mockWaitlist } from '@/data/mockData'

interface AppState {
  // Data
  clients: Client[]
  watchModels: WatchModel[]
  waitlist: WaitlistEntry[]

  // UI State
  searchQuery: string
  selectedClient: Client | null

  // Actions
  setSearchQuery: (query: string) => void
  setSelectedClient: (client: Client | null) => void
  getFilteredClients: () => Client[]
  getClientById: (id: string) => Client | undefined
  getWatchModelById: (id: string) => WatchModel | undefined
  getWaitlistForClient: (clientId: string) => WaitlistEntry[]
  getWaitlistForWatch: (watchId: string) => WaitlistEntry[]
  generateAllocationSuggestions: (watchId: string) => AllocationSuggestion[]
  addToWaitlist: (clientId: string, watchId: string, notes?: string) => void
  removeFromWaitlist: (entryId: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial data
  clients: mockClients,
  watchModels: mockWatchModels,
  waitlist: mockWaitlist,

  // UI state
  searchQuery: '',
  selectedClient: null,

  // Actions
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setSelectedClient: (client: Client | null) => set({ selectedClient: client }),

  getFilteredClients: () => {
    const { clients, searchQuery } = get()
    if (!searchQuery.trim()) return clients

    const query = searchQuery.toLowerCase()
    return clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.includes(query) ||
      client.preferredBrands.some(brand => brand.toLowerCase().includes(query))
    )
  },

  getClientById: (id: string) => {
    const { clients } = get()
    return clients.find(client => client.id === id)
  },

  getWatchModelById: (id: string) => {
    const { watchModels } = get()
    return watchModels.find(watch => watch.id === id)
  },

  getWaitlistForClient: (clientId: string) => {
    const { waitlist } = get()
    return waitlist.filter(entry => entry.clientId === clientId)
  },

  getWaitlistForWatch: (watchId: string) => {
    const { waitlist } = get()
    return waitlist.filter(entry => entry.watchModelId === watchId)
      .sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime())
  },

  generateAllocationSuggestions: (watchId: string) => {
    const { clients, waitlist, getWatchModelById } = get()
    const watch = getWatchModelById(watchId)
    if (!watch) return []

    const waitlistEntries = waitlist.filter(entry => entry.watchModelId === watchId)

    const suggestions: AllocationSuggestion[] = waitlistEntries.map(entry => {
      const client = clients.find(c => c.id === entry.clientId)
      if (!client) return { clientId: entry.clientId, score: 0, reasons: [] }

      let score = 0
      const reasons: string[] = []

      // VIP tier scoring
      switch (client.vipTier) {
        case 'Platinum':
          score += 40
          reasons.push('Platinum VIP status')
          break
        case 'Gold':
          score += 30
          reasons.push('Gold VIP status')
          break
        case 'Silver':
          score += 20
          reasons.push('Silver VIP status')
          break
        case 'Bronze':
          score += 10
          reasons.push('Bronze VIP status')
          break
      }

      // Lifetime spend scoring
      if (client.lifetimeSpend > 550000) {
        score += 30
        reasons.push('High lifetime value ($550K+)')
      } else if (client.lifetimeSpend > 220000) {
        score += 20
        reasons.push('Significant lifetime value ($220K+)')
      } else if (client.lifetimeSpend > 110000) {
        score += 10
        reasons.push('Good lifetime value ($110K+)')
      }

      // Wait time scoring
      const daysWaiting = Math.floor(
        (new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysWaiting > 90) {
        score += 15
        reasons.push(`Waiting ${daysWaiting} days`)
      } else if (daysWaiting > 60) {
        score += 10
        reasons.push(`Waiting ${daysWaiting} days`)
      } else if (daysWaiting > 30) {
        score += 5
        reasons.push(`Waiting ${daysWaiting} days`)
      }

      // Brand preference scoring
      if (client.preferredBrands.includes(watch.brand)) {
        score += 15
        reasons.push(`Prefers ${watch.brand}`)
      }

      return { clientId: client.id, score, reasons }
    })

    return suggestions.sort((a, b) => b.score - a.score)
  },

  addToWaitlist: (clientId: string, watchId: string, notes = '') => {
    set(state => ({
      waitlist: [...state.waitlist, {
        id: `wl_${Date.now()}`,
        clientId,
        watchModelId: watchId,
        dateAdded: new Date().toISOString().split('T')[0],
        priority: 1,
        notes
      }]
    }))
  },

  removeFromWaitlist: (entryId: string) => {
    set(state => ({
      waitlist: state.waitlist.filter(entry => entry.id !== entryId)
    }))
  }
}))

// Utility function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Utility function to format VIP tier colors
export const getVipTierColor = (tier: string): string => {
  switch (tier) {
    case 'Platinum': return 'text-purple-600 bg-purple-100'
    case 'Gold': return 'text-yellow-600 bg-yellow-100'
    case 'Silver': return 'text-gray-600 bg-gray-100'
    case 'Bronze': return 'text-orange-600 bg-orange-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}