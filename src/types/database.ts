// Database types matching Supabase schema
export type VipTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
export type AllocationStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'
export type UserRole = 'salesperson' | 'manager' | 'admin'

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          vip_tier: VipTier
          lifetime_spend: number
          assigned_to: string | null
          preferred_brands: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          vip_tier?: VipTier
          lifetime_spend?: number
          assigned_to?: string | null
          preferred_brands?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          vip_tier?: VipTier
          lifetime_spend?: number
          assigned_to?: string | null
          preferred_brands?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          brand: string
          model: string
          reference_number: string | null
          price: number
          retail_price: number | null
          category: string
          availability_date: string | null
          is_available: boolean
          description: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand: string
          model: string
          reference_number?: string | null
          price: number
          retail_price?: number | null
          category: string
          availability_date?: string | null
          is_available?: boolean
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand?: string
          model?: string
          reference_number?: string | null
          price?: number
          retail_price?: number | null
          category?: string
          availability_date?: string | null
          is_available?: boolean
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      waitlist: {
        Row: {
          id: string
          client_id: string
          brand: string
          model: string
          reference_number: string | null
          priority_score: number
          wait_start_date: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          brand: string
          model: string
          reference_number?: string | null
          priority_score?: number
          wait_start_date?: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          brand?: string
          model?: string
          reference_number?: string | null
          priority_score?: number
          wait_start_date?: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          client_id: string
          watch_id: string | null
          brand: string
          model: string
          price: number
          commission_rate: number
          commission_amount: number
          purchase_date: string
          salesperson_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          watch_id?: string | null
          brand: string
          model: string
          price: number
          commission_rate: number
          commission_amount: number
          purchase_date?: string
          salesperson_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          watch_id?: string | null
          brand?: string
          model?: string
          price?: number
          commission_rate?: number
          commission_amount?: number
          purchase_date?: string
          salesperson_id?: string | null
          created_at?: string
        }
      }
      allocations: {
        Row: {
          id: string
          client_id: string
          watch_id: string
          allocation_date: string
          delivery_date: string | null
          status: AllocationStatus
          commission_rate: number
          commission_amount: number
          allocated_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          watch_id: string
          allocation_date?: string
          delivery_date?: string | null
          status?: AllocationStatus
          commission_rate: number
          commission_amount: number
          allocated_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          watch_id?: string
          allocation_date?: string
          delivery_date?: string | null
          status?: AllocationStatus
          commission_rate?: number
          commission_amount?: number
          allocated_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
