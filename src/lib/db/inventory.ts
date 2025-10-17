// Inventory database operations
import { supabase } from '@/lib/supabase/client'
import { WatchModel } from '@/types'
import { mapDbInventoryToWatch, mapWatchToDbInsert } from '@/lib/supabase/mappers'

// Fetch all watches from inventory
export const getAllWatches = async (): Promise<WatchModel[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('brand', { ascending: true })

    if (error) {
      console.error('Error fetching watches:', error)
      throw new Error(`Failed to fetch watches: ${error.message}`)
    }

    if (!data) return []

    return data.map(mapDbInventoryToWatch)
  } catch (error) {
    console.error('Error in getAllWatches:', error)
    return []
  }
}

// Fetch only available watches
export const getAvailableWatches = async (): Promise<WatchModel[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('is_available', true)
      .order('brand', { ascending: true })

    if (error) {
      console.error('Error fetching available watches:', error)
      throw new Error(`Failed to fetch available watches: ${error.message}`)
    }

    if (!data) return []

    return data.map(mapDbInventoryToWatch)
  } catch (error) {
    console.error('Error in getAvailableWatches:', error)
    return []
  }
}

// Fetch single watch by ID
export const getWatchById = async (id: string): Promise<WatchModel | null> => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching watch:', error)
      throw new Error(`Failed to fetch watch: ${error.message}`)
    }

    if (!data) return null

    return mapDbInventoryToWatch(data)
  } catch (error) {
    console.error('Error in getWatchById:', error)
    return null
  }
}

// Create new watch
export const createWatch = async (watchData: Partial<WatchModel>): Promise<WatchModel> => {
  try {
    const dbInsert = mapWatchToDbInsert(watchData)

    const { data, error } = await supabase
      .from('inventory')
      .insert(dbInsert)
      .select()
      .single()

    if (error) {
      console.error('Error creating watch:', error)
      throw new Error(`Failed to create watch: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from watch creation')
    }

    return mapDbInventoryToWatch(data)
  } catch (error) {
    console.error('Error in createWatch:', error)
    throw error
  }
}

// Update existing watch
export const updateWatch = async (id: string, updates: Partial<WatchModel>): Promise<WatchModel> => {
  try {
    const dbUpdate = mapWatchToDbInsert(updates)

    const { data, error } = await supabase
      .from('inventory')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating watch:', error)
      throw new Error(`Failed to update watch: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from watch update')
    }

    return mapDbInventoryToWatch(data)
  } catch (error) {
    console.error('Error in updateWatch:', error)
    throw error
  }
}

// Delete watch
export const deleteWatch = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting watch:', error)
      throw new Error(`Failed to delete watch: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in deleteWatch:', error)
    throw error
  }
}
