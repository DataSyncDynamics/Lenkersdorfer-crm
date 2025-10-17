'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/stores'
import { createClient } from '@/lib/supabase/client'

export function useSupabaseData() {
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        // Fetch clients
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false })

        if (!clientsError && clients) {
          useAppStore.getState().setClients(clients)
        }

        // Fetch inventory
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .order('created_at', { ascending: false })

        if (!inventoryError && inventory) {
          useAppStore.getState().setWatches(inventory)
        }

        // Fetch waitlist
        const { data: waitlist, error: waitlistError } = await supabase
          .from('waitlist')
          .select(`
            *,
            client:clients(*)
          `)
          .eq('is_active', true)
          .order('priority_score', { ascending: false })

        if (!waitlistError && waitlist) {
          useAppStore.getState().setWaitlist(waitlist)
        }
      } catch (error) {
        console.error('Error fetching initial data:', error)
      }
    }

    fetchInitialData()
  }, [supabase])

  return null
}
