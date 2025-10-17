'use client'

import { StateCreator } from 'zustand'
import { Client, ClientTier } from '@/types'
import { calculateClientTier } from '@/data/mockData'
import * as clientApi from '@/lib/api/clients'

export interface ClientState {
  clients: Client[]
  selectedClient: Client | null
  searchQuery: string
  loading: boolean
  error: string | null
}

export interface ClientActions {
  // Data fetching
  fetchClients: () => Promise<void>
  fetchClientById: (id: string) => Promise<void>

  // State setters
  setClients: (clients: Client[]) => void
  setSelectedClient: (client: Client | null) => void
  setSearchQuery: (query: string) => void

  // Computed getters
  getFilteredClients: () => Client[]
  getClientById: (id: string) => Client | undefined
  getClientsByTier: (tier: ClientTier) => Client[]

  // Data mutations
  updateClient: (clientId: string, updates: Partial<Client>) => Promise<void>
  addClient: (newClient: Omit<Client, 'id'>) => Promise<string>
  deleteClient: (clientId: string) => Promise<void>

  // Utilities
  recalculateClientTiers: () => void
  importClients: (importedClients: Client[]) => void
  replaceAllClients: (newClients: Client[]) => void
}

export type ClientSlice = ClientState & ClientActions

export const createClientSliceSupabase: StateCreator<
  ClientSlice,
  [],
  [],
  ClientSlice
> = (set, get) => ({
  // Initial state
  clients: [],
  selectedClient: null,
  searchQuery: '',
  loading: false,
  error: null,

  // Data fetching
  fetchClients: async () => {
    set({ loading: true, error: null })
    try {
      const clients = await clientApi.fetchClients()
      set({ clients, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  fetchClientById: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const client = await clientApi.fetchClientById(id)
      set({ selectedClient: client, loading: false })
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
    }
  },

  // State setters
  setClients: (clients: Client[]) => set({ clients }),

  setSelectedClient: (client: Client | null) => set({ selectedClient: client }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  // Computed getters
  getFilteredClients: () => {
    const { clients, searchQuery } = get()
    if (!searchQuery.trim()) return clients

    const query = searchQuery.toLowerCase()
    return clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      (client.phone && client.phone.includes(query)) ||
      (client.preferredBrands && client.preferredBrands.some(brand => brand.toLowerCase().includes(query)))
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

  // Data mutations
  updateClient: async (clientId: string, updates: Partial<Client>) => {
    set({ loading: true, error: null })
    try {
      const updatedClient = await clientApi.updateClient(clientId, updates)

      // Optimistic update
      set(state => ({
        clients: state.clients.map(client =>
          client.id === clientId ? updatedClient : client
        ),
        selectedClient: state.selectedClient?.id === clientId ? updatedClient : state.selectedClient,
        loading: false,
      }))

      // Recalculate tiers if lifetime spend changed
      if (updates.lifetimeSpend !== undefined) {
        get().recalculateClientTiers()
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  addClient: async (newClient: Omit<Client, 'id'>) => {
    set({ loading: true, error: null })
    try {
      const client = await clientApi.createClient(newClient)

      set(state => ({
        clients: [...state.clients, client],
        loading: false,
      }))

      get().recalculateClientTiers()

      return client.id
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  deleteClient: async (clientId: string) => {
    set({ loading: true, error: null })
    try {
      await clientApi.deleteClient(clientId)

      set(state => ({
        clients: state.clients.filter(c => c.id !== clientId),
        selectedClient: state.selectedClient?.id === clientId ? null : state.selectedClient,
        loading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, loading: false })
      throw error
    }
  },

  // Utilities
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
    get().recalculateClientTiers()
  },

  replaceAllClients: (newClients: Client[]) => {
    set({ clients: newClients })
    get().recalculateClientTiers()
  },
})
