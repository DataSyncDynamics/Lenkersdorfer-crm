'use client'

import { StateCreator } from 'zustand'
import { Client, ClientTier } from '@/types'
import { mockClients, calculateClientTier } from '@/data/mockData'

export interface ClientState {
  clients: Client[]
  selectedClient: Client | null
  searchQuery: string
}

export interface ClientActions {
  setSelectedClient: (client: Client | null) => void
  setSearchQuery: (query: string) => void
  getFilteredClients: () => Client[]
  getClientById: (id: string) => Client | undefined
  getClientsByTier: (tier: ClientTier) => Client[]
  recalculateClientTiers: () => void
  importClients: (importedClients: Client[]) => void
  replaceAllClients: (newClients: Client[]) => void
  updateClient: (clientId: string, updates: Partial<Client>) => void
  addClient: (newClient: Omit<Client, 'id'>) => string
}

export type ClientSlice = ClientState & ClientActions

export const createClientSlice: StateCreator<
  ClientSlice,
  [],
  [],
  ClientSlice
> = (set, get) => ({
  // Initial state
  clients: mockClients,
  selectedClient: null,
  searchQuery: '',

  // Actions
  setSelectedClient: (client: Client | null) => set({ selectedClient: client }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),

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

  getClientsByTier: (tier: ClientTier): Client[] => {
    const { clients } = get()
    return clients.filter(client => client.clientTier === tier)
  },

  recalculateClientTiers: () => {
    set(state => {
      const spends = state.clients.map(c => c.lifetimeSpend).sort((a, b) => b - a)

      const updatedClients = state.clients.map(client => {
        const rank = spends.findIndex(spend => spend === client.lifetimeSpend) + 1
        const percentile = Math.round(((spends.length - rank + 1) / spends.length) * 100)
        const clientTier = calculateClientTier(client.lifetimeSpend, client.purchases)

        return {
          ...client,
          spendPercentile: percentile,
          clientTier
        }
      })

      return { clients: updatedClients }
    })
  },

  importClients: (importedClients: Client[]) => {
    set(state => ({
      clients: [...state.clients, ...importedClients]
    }))
    // Recalculate tiers after import
    get().recalculateClientTiers()
  },

  replaceAllClients: (newClients: Client[]) => {
    set({ clients: newClients })
    // Recalculate tiers after replacement
    get().recalculateClientTiers()
  },

  updateClient: (clientId: string, updates: Partial<Client>) => {
    set(state => ({
      clients: state.clients.map(client =>
        client.id === clientId ? { ...client, ...updates } : client
      )
    }))
    // Recalculate tiers after update if lifetime spend changed
    if (updates.lifetimeSpend !== undefined) {
      get().recalculateClientTiers()
    }
    // Update selected client if it's the one being updated
    const state = get()
    if (state.selectedClient?.id === clientId) {
      set({ selectedClient: { ...state.selectedClient, ...updates } })
    }
  },

  addClient: (newClient: Omit<Client, 'id'>) => {
    const client: Client = {
      ...newClient,
      id: `client_${Date.now()}`,
      lifetimeSpend: 0,
      spendPercentile: 0,
      clientTier: 5,
      vipTier: 'Bronze',
      lastPurchase: '', // No purchase history for new clients
      purchases: []
    }

    set(state => ({
      clients: [...state.clients, client]
    }))

    // Recalculate tiers after adding new client
    get().recalculateClientTiers()

    return client.id
  }
})