'use client'

import { StateCreator } from 'zustand'
import { WatchModel, WatchTier } from '@/types'
import { mockWatchModels, watchRarityDefinitions } from '@/data/mockData'

export interface WatchState {
  watchModels: WatchModel[]
}

export interface WatchActions {
  getWatchModelById: (id: string) => WatchModel | undefined
  getWatchesByTier: (tier: WatchTier) => WatchModel[]
  getWatchTierInfo: (tier: WatchTier) => { name: string; description: string; color: string }
}

export type WatchSlice = WatchState & WatchActions

export const createWatchSlice: StateCreator<
  WatchSlice,
  [],
  [],
  WatchSlice
> = (set, get) => ({
  // Initial state
  watchModels: mockWatchModels,

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
  }
})