'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/stores'

/**
 * Hook to initialize the app by fetching all data from Supabase
 * Should be called once at the app root level
 */
export function useInitializeApp() {
  const { initializeApp, isInitialized, isLoading } = useAppStore()

  useEffect(() => {
    if (!isInitialized) {
      initializeApp().catch(error => {
        console.error('Failed to initialize app:', error)
      })
    }
  }, [initializeApp, isInitialized])

  return { isInitialized, isLoading }
}
