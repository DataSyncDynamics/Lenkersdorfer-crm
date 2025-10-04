'use client'

import { create } from 'zustand'
import { ClientSlice, createClientSlice } from './clientStore'
import { WatchSlice, createWatchSlice } from './watchStore'
import { WaitlistSlice, createWaitlistSlice } from './waitlistStore'
import { PerfectMatchSlice, createPerfectMatchSlice } from './perfectMatchStore'
import { AllocationSlice, createAllocationSlice } from './allocationStore'

// Combined app state type
export type AppState = ClientSlice & WatchSlice & WaitlistSlice & PerfectMatchSlice & AllocationSlice

// Create the combined store
export const useAppStore = create<AppState>()((...a) => ({
  ...createClientSlice(...a),
  ...createWatchSlice(...a),
  ...createWaitlistSlice(...a),
  ...createPerfectMatchSlice(...a),
  ...createAllocationSlice(...a),
}))

// Re-export utility functions
export { formatCurrency, getVipTierColor } from './utils'