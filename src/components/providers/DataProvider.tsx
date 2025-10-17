'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    // Set up real-time subscriptions
    const clientsSubscription = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          console.log('Client change:', payload)
          // Trigger a re-fetch in the store
          // This would be handled by the component using the data
        }
      )
      .subscribe()

    const inventorySubscription = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          console.log('Inventory change:', payload)
        }
      )
      .subscribe()

    const waitlistSubscription = supabase
      .channel('waitlist-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waitlist' },
        (payload) => {
          console.log('Waitlist change:', payload)
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      clientsSubscription.unsubscribe()
      inventorySubscription.unsubscribe()
      waitlistSubscription.unsubscribe()
    }
  }, [user, supabase])

  return <>{children}</>
}
