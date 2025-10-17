'use client'

import { StateCreator } from 'zustand'
import { Client, ClientTier } from '@/types'
import { calculateClientTier } from '@/data/mockData'
import * as clientDb from '@/lib/db/clients'

export interface ClientState {
  clients: Client[]
  selectedClient: Client | null
  searchQuery: string
  isLoading: boolean
  error: string | null
}

export interface ClientActions {
  initializeClients: () => Promise<void>
  setSelectedClient: (client: Client | null) => void
  setSearchQuery: (query: string) => void
  getFilteredClients: () => Client[]
  getClientById: (id: string) => Client | undefined
  getClientsByTier: (tier: ClientTier) => Client[]
  recalculateClientTiers: () => void
  importClients: (importedClients: Client[]) => void
  replaceAllClients: (newClients: Client[]) => void
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<void>
  addClient: (newClient: Omit<Client, 'id'>) => Promise<string>
}

export type ClientSlice = ClientState & ClientActions

export const createClientSlice: StateCreator<
  ClientSlice,
  [],
  [],
  ClientSlice
> = (set, get) => ({
  // Initial state
  clients: [],
  selectedClient: null,
  searchQuery: '',
  isLoading: true,
  error: null,

  // Initialize - fetch from Supabase
  initializeClients: async () => {
    try {
      set({ isLoading: true, error: null })
      const clients = await clientDb.getAllClients()
      set({ clients, isLoading: false })
      get().recalculateClientTiers()
    } catch (error) {
      console.error('Error initializing clients:', error)
      set({ error: 'Failed to load clients', isLoading: false })
    }
  },

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

  updateClient: async (clientId: string, updates: Partial<Client>) => {
    // Optimistic update
    set(state => ({
      clients: state.clients.map(client =>
        client.id === clientId ? { ...client, ...updates } : client
      )
    }))

    try {
      const updatedClient = await clientDb.updateClient(clientId, updates)

      set(state => ({
        clients: state.clients.map(client =>
          client.id === clientId ? updatedClient : client
        )
      }))

      if (updates.lifetimeSpend !== undefined) {
        get().recalculateClientTiers()
      }

      const state = get()
      if (state.selectedClient?.id === clientId) {
        set({ selectedClient: updatedClient })
      }
    } catch (error) {
      console.error('Error updating client:', error)
      await get().initializeClients()
      throw error
    }
  },

  addClient: async (newClient: Omit<Client, 'id'>): Promise<string> => {
    const tempId = `temp_${Date.now()}`
    const tempClient: Client = {
      ...newClient,
      id: tempId,
      lifetimeSpend: 0,
      spendPercentile: 0,
      clientTier: 5,
      vipTier: 'Bronze',
      lastPurchase: '',
      purchases: []
    }

    set(state => ({
      clients: [...state.clients, tempClient]
    }))

    try {
      const createdClient = await clientDb.createClient(newClient)

      set(state => ({
        clients: state.clients.map(c => c.id === tempId ? createdClient : c)
      }))

      get().recalculateClientTiers()
      return createdClient.id
    } catch (error) {
      console.error('Error adding client:', error)
      set(state => ({
        clients: state.clients.filter(c => c.id !== tempId)
      }))
      throw error
    }
  }
})