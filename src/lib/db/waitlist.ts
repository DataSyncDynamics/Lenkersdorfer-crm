// Waitlist database operations
import { supabase } from '@/lib/supabase/client'
import { WaitlistEntry, WatchModel } from '@/types'
import { mapDbWaitlistToEntry, mapWaitlistToDbInsert } from '@/lib/supabase/mappers'

// Fetch all waitlist entries with client and watch info
export const getAllWaitlistEntries = async (): Promise<WaitlistEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('is_active', true)
      .order('priority_score', { ascending: false })

    if (error) {
      console.error('Error fetching waitlist:', error)
      throw new Error(`Failed to fetch waitlist: ${error.message}`)
    }

    if (!data) return []

    return data.map(entry => mapDbWaitlistToEntry(entry))
  } catch (error) {
    console.error('Error in getAllWaitlistEntries:', error)
    return []
  }
}

// Fetch waitlist entries for a specific client
export const getWaitlistForClient = async (clientId: string): Promise<WaitlistEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('priority_score', { ascending: false })

    if (error) {
      console.error('Error fetching client waitlist:', error)
      return []
    }

    if (!data) return []

    return data.map(entry => mapDbWaitlistToEntry(entry))
  } catch (error) {
    console.error('Error in getWaitlistForClient:', error)
    return []
  }
}

// Fetch waitlist entries for a specific watch
export const getWaitlistForWatch = async (brand: string, model: string): Promise<WaitlistEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .eq('brand', brand)
      .eq('model', model)
      .eq('is_active', true)
      .order('priority_score', { ascending: false })

    if (error) {
      console.error('Error fetching watch waitlist:', error)
      return []
    }

    if (!data) return []

    return data.map(entry => mapDbWaitlistToEntry(entry))
  } catch (error) {
    console.error('Error in getWaitlistForWatch:', error)
    return []
  }
}

// Create new waitlist entry
export const createWaitlistEntry = async (
  entry: Partial<WaitlistEntry>,
  watch: WatchModel
): Promise<WaitlistEntry> => {
  try {
    const dbInsert = mapWaitlistToDbInsert(entry, watch)

    const { data, error } = await supabase
      .from('waitlist')
      .insert(dbInsert)
      .select()
      .single()

    if (error) {
      console.error('Error creating waitlist entry:', error)
      throw new Error(`Failed to create waitlist entry: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from waitlist entry creation')
    }

    // Calculate priority score using stored procedure
    const { error: updateError } = await supabase.rpc('calculate_priority_score', {
      p_waitlist_id: data.id
    })

    if (updateError) {
      console.warn('Warning: Failed to calculate priority score:', updateError)
    }

    return mapDbWaitlistToEntry(data, watch.id)
  } catch (error) {
    console.error('Error in createWaitlistEntry:', error)
    throw error
  }
}

// Update waitlist entry
export const updateWaitlistEntry = async (
  id: string,
  updates: Partial<WaitlistEntry>
): Promise<WaitlistEntry> => {
  try {
    const dbUpdate: any = {}

    if (updates.priority !== undefined) {
      dbUpdate.priority_score = updates.priority
    }
    if (updates.notes !== undefined) {
      dbUpdate.notes = updates.notes
    }

    const { data, error } = await supabase
      .from('waitlist')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating waitlist entry:', error)
      throw new Error(`Failed to update waitlist entry: ${error.message}`)
    }

    if (!data) {
      throw new Error('No data returned from waitlist entry update')
    }

    return mapDbWaitlistToEntry(data)
  } catch (error) {
    console.error('Error in updateWaitlistEntry:', error)
    throw error
  }
}

// Delete waitlist entry (soft delete by setting is_active to false)
export const deleteWaitlistEntry = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('waitlist')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting waitlist entry:', error)
      throw new Error(`Failed to delete waitlist entry: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in deleteWaitlistEntry:', error)
    throw error
  }
}
