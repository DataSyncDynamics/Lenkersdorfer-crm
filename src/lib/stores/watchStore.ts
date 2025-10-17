'use client'

import { StateCreator } from 'zustand'
import { WatchModel, WatchTier } from '@/types'
import { watchRarityDefinitions } from '@/data/mockData'
import * as inventoryDb from '@/lib/db/inventory'

export interface WatchState {
  watchModels: WatchModel[]
  isLoading: boolean
  error: string | null
}

export interface WatchActions {
  initializeWatches: () => Promise<void>
  getWatchModelById: (id: string) => WatchModel | undefined
  getWatchesByTier: (tier: WatchTier) => WatchModel[]
  getWatchTierInfo: (tier: WatchTier) => { name: string; description: string; color: string }
  addWatch: (watch: Partial<WatchModel>) => Promise<WatchModel>
  updateWatch: (id: string, updates: Partial<WatchModel>) => Promise<WatchModel>
}

export type WatchSlice = WatchState & WatchActions

export const createWatchSlice: StateCreator<
  WatchSlice,
  [],
  [],
  WatchSlice
> = (set, get) => ({
  // Initial state
  watchModels: [],
  isLoading: true,
  error: null,

  // Initialize - fetch from Supabase
  initializeWatches: async () => {
    try {
      set({ isLoading: true, error: null })
      const watches = await inventoryDb.getAllWatches()
      set({ watchModels: watches, isLoading: false })
    } catch (error) {
      console.error('Error initializing watches:', error)
      set({ error: 'Failed to load watches', isLoading: false })
    }
  },

  // Actions
  getWatchModelById: (id: string) => {
    const { watchModels } = get()
    return watchModels.find(watch => watch.id === id)
  },

  getWatchesByTier: (tier: WatchTier): WatchModel[] => {
    const { watchModels } = get()
    return watchModels.filter(watch => watch.watchTier === tier)
  },

  getWatchTierInfo: (tier: WatchTier) => {
    const tierInfo = watchRarityDefinitions.find(t => t.tier === tier)
    return {
      name: tierInfo?.name || 'Unknown',
      description: tierInfo?.description || 'Unknown tier',
      color: tierInfo?.color || 'bg-gray-100 text-gray-800'
    }
  },

  addWatch: async (watch: Partial<WatchModel>): Promise<WatchModel> => {
    try {
      const newWatch = await inventoryDb.createWatch(watch)
      set(state => ({
        watchModels: [...state.watchModels, newWatch]
      }))
      return newWatch
    } catch (error) {
      console.error('Error adding watch:', error)
      throw error
    }
  },

  updateWatch: async (id: string, updates: Partial<WatchModel>): Promise<WatchModel> => {
    try {
      const updatedWatch = await inventoryDb.updateWatch(id, updates)
      set(state => ({
        watchModels: state.watchModels.map(w => w.id === id ? updatedWatch : w)
      }))
      return updatedWatch
    } catch (error) {
      console.error('Error updating watch:', error)
      throw error
    }
  }
})