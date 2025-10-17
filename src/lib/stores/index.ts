'use client'

import { create } from 'zustand'
import { ClientSlice, createClientSlice } from './clientStore'
import { WatchSlice, createWatchSlice } from './watchStore'
import { WaitlistSlice, createWaitlistSlice } from './waitlistStore'
import { PerfectMatchSlice, createPerfectMatchSlice } from './perfectMatchStore'
import { AllocationSlice, createAllocationSlice } from './allocationStore'

// Combined app state type
export type AppState = ClientSlice & WatchSlice & WaitlistSlice & PerfectMatchSlice & AllocationSlice & {
  isInitialized: boolean
  initializeApp: () => Promise<void>
}

// Create the combined store without persistence (using Supabase instead)
export const useAppStore = create<AppState>()((...a) => ({
  ...createClientSlice(...a),
  ...createWatchSlice(...a),
  ...createWaitlistSlice(...a),
  ...createPerfectMatchSlice(...a),
  ...createAllocationSlice(...a),

  // App-level initialization
  isInitialized: false,
  initializeApp: async () => {
    const [set, get] = a
    if (get().isInitialized) return

    try {
      // Initialize all slices in parallel
      await Promise.all([
        get().initializeClients(),
        get().initializeWatches(),
        get().initializeWaitlist(),
      ])

      set({ isInitialized: true })
    } catch (error) {
      console.error('Error initializing app:', error)
      throw error
    }
  },
}))

// Re-export utility functions
export { formatCurrency, getVipTierColor } from './utils'