// Purchase database operations
import { supabase } from '@/lib/supabase/client'
import { Purchase } from '@/types'
import { mapDbPurchaseToPurchase, mapPurchaseToDbInsert } from '@/lib/supabase/mappers'

// Fetch all purchases for a specific client
export const getAllPurchasesForClient = async (clientId: string): Promise<Purchase[]> => {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('client_id', clientId)
      .order('purchase_date', { ascending: false })

    if (error) {
      console.error('Error fetching purchases:', error)
      return []
    }

    if (!data) return []

    return data.map(mapDbPurchaseToPurchase)
  } catch (error) {
    console.error('Error in getAllPurchasesForClient:', error)
    return []
  }
}

// Fetch all purchases
export const getAllPurchases = async (): Promise<Purchase[]> => {
  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('purchase_date', { ascending: false })

    if (error) {
      console.error('Error fetching all purchases:', error)
      return []
    }

    if (!data) return []

    return data.map(mapDbPurchaseToPurchase)
  } catch (error) {
    console.error('Error in getAllPurchases:', error)
    return []
  }
}

// Create new purchase
export const createPurchase = async (
  purchase: Partial<Purchase>,
  clientId: string,
  watchId?: string
): Promise<Purchase> => {
  try {
    const dbInsert = mapPurchaseToDbInsert(purchase, clientId, watchId)

    const { data, error } = await supabase
      .from('purchases')
      .insert(dbInsert)
      .select()
      .single()

    if (error) {
      console.error('Error creating purchase:', error)
      throw new Error(`Failed to create purchase: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from purchase creation')
    }

    // Update client's lifetime spend
    const { error: updateError } = await supabase.rpc('update_client_lifetime_spend', {
      p_client_id: clientId
    })

    if (updateError) {
      console.warn('Warning: Failed to update client lifetime spend:', updateError)
    }

    return mapDbPurchaseToPurchase(data)
  } catch (error) {
    console.error('Error in createPurchase:', error)
    throw error
  }
}
