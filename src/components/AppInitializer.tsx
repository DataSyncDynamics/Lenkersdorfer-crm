'use client'

import { useInitializeApp } from '@/hooks/useInitializeApp'

/**
 * Component that initializes the app by loading data from Supabase
 * This should be included at the root level of the app
 */
export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isInitialized } = useInitializeApp()

  // Don't block rendering - data will load in background
  // Components using the data will show loading states
  return <>{children}</>
}
