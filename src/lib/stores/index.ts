'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ClientSlice, createClientSlice } from './clientStore'
import { WatchSlice, createWatchSlice } from './watchStore'
import { WaitlistSlice, createWaitlistSlice } from './waitlistStore'
import { PerfectMatchSlice, createPerfectMatchSlice } from './perfectMatchStore'
import { AllocationSlice, createAllocationSlice } from './allocationStore'

// Combined app state type
export type AppState = ClientSlice & WatchSlice & WaitlistSlice & PerfectMatchSlice & AllocationSlice

// Create the combined store with persistence
export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createClientSlice(...a),
      ...createWatchSlice(...a),
      ...createWaitlistSlice(...a),
      ...createPerfectMatchSlice(...a),
      ...createAllocationSlice(...a),
    }),
    {
      name: 'lenkersdorfer-crm-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)

// Re-export utility functions
export { formatCurrency, getVipTierColor } from './utils'