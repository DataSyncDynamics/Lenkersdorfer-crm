// Client database operations
import { supabase } from '@/lib/supabase/client'
import { Client } from '@/types'
import { mapDbClientToClient, mapClientToDbInsert } from '@/lib/supabase/mappers'
import { getAllPurchasesForClient } from './purchases'

// Fetch all clients from Supabase
export const getAllClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('lifetime_spend', { ascending: false })

    if (error) {
      console.error('Error fetching clients:', error)
      throw new Error(`Failed to fetch clients: ${error.message}`)
    }

    if (!data) return []

    // Fetch purchases for all clients
    const clientsWithPurchases = await Promise.all(
      data.map(async (dbClient) => {
        const purchases = await getAllPurchasesForClient(dbClient.id)
        return mapDbClientToClient(dbClient, purchases)
      })
    )

    return clientsWithPurchases
  } catch (error) {
    console.error('Error in getAllClients:', error)
    return []
  }
}

// Fetch single client by ID
export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching client:', error)
      throw new Error(`Failed to fetch client: ${error.message}`)
    }

    if (!data) return null

    const purchases = await getAllPurchasesForClient(id)
    return mapDbClientToClient(data, purchases)
  } catch (error) {
    console.error('Error in getClientById:', error)
    return null
  }
}

// Create new client
export const createClient = async (clientData: Partial<Client>): Promise<Client> => {
  try {
    const dbInsert = mapClientToDbInsert(clientData)

    const { data, error } = await supabase
      .from('clients')
      .insert(dbInsert)
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      throw new Error(`Failed to create client: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from client creation')
    }

    return mapDbClientToClient(data, [])
  } catch (error) {
    console.error('Error in createClient:', error)
    throw error
  }
}

// Update existing client
export const updateClient = async (id: string, updates: Partial<Client>): Promise<Client> => {
  try {
    const dbUpdate = mapClientToDbInsert(updates)

    const { data, error } = await supabase
      .from('clients')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating client:', error)
      throw new Error(`Failed to update client: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from client update')
    }

    const purchases = await getAllPurchasesForClient(id)
    return mapDbClientToClient(data, purchases)
  } catch (error) {
    console.error('Error in updateClient:', error)
    throw error
  }
}

// Delete client
export const deleteClient = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting client:', error)
      throw new Error(`Failed to delete client: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in deleteClient:', error)
    throw error
  }
}
