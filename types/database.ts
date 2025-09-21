export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      allocations: {
        Row: {
          allocation_date: string
          allocated_by: string | null
          client_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          delivery_date: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["allocation_status"]
          updated_at: string
          watch_id: string
        }
        Insert: {
          allocation_date?: string
          allocated_by?: string | null
          client_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["allocation_status"]
          updated_at?: string
          watch_id: string
        }
        Update: {
          allocation_date?: string
          allocated_by?: string | null
          client_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          delivery_date?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["allocation_status"]
          updated_at?: string
          watch_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_watch_id_fkey"
            columns: ["watch_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          lifetime_spend: number
          name: string
          notes: string | null
          phone: string | null
          preferred_brands: string[]
          updated_at: string
          vip_tier: Database["public"]["Enums"]["vip_tier"]
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          lifetime_spend?: number
          name: string
          notes?: string | null
          phone?: string | null
          preferred_brands?: string[]
          updated_at?: string
          vip_tier?: Database["public"]["Enums"]["vip_tier"]
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          lifetime_spend?: number
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_brands?: string[]
          updated_at?: string
          vip_tier?: Database["public"]["Enums"]["vip_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory: {
        Row: {
          availability_date: string | null
          brand: string
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          model: string
          price: number
          reference_number: string | null
          retail_price: number | null
          updated_at: string
        }
        Insert: {
          availability_date?: string | null
          brand: string
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          model: string
          price: number
          reference_number?: string | null
          retail_price?: number | null
          updated_at?: string
        }
        Update: {
          availability_date?: string | null
          brand?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          model?: string
          price?: number
          reference_number?: string | null
          retail_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          brand: string
          client_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          model: string
          price: number
          purchase_date: string
          salesperson_id: string | null
          watch_id: string | null
        }
        Insert: {
          brand: string
          client_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          model: string
          price: number
          purchase_date?: string
          salesperson_id?: string | null
          watch_id?: string | null
        }
        Update: {
          brand?: string
          client_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          model?: string
          price?: number
          purchase_date?: string
          salesperson_id?: string | null
          watch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_watch_id_fkey"
            columns: ["watch_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          commission_rate: number
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          team: string | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          team?: string | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          team?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      waitlist: {
        Row: {
          brand: string
          client_id: string
          created_at: string
          id: string
          is_active: boolean
          model: string
          notes: string | null
          priority_score: number
          reference_number: string | null
          updated_at: string
          wait_start_date: string
        }
        Insert: {
          brand: string
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          model: string
          notes?: string | null
          priority_score?: number
          reference_number?: string | null
          updated_at?: string
          wait_start_date?: string
        }
        Update: {
          brand?: string
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          model?: string
          notes?: string | null
          priority_score?: number
          reference_number?: string | null
          updated_at?: string
          wait_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allocate_watch: {
        Args: {
          client_id_param: string
          watch_id_param: string
          allocated_by_param: string
        }
        Returns: string
      }
      calculate_commission_rate: {
        Args: {
          category: string
        }
        Returns: number
      }
      calculate_priority_score: {
        Args: {
          client_id_param: string
          brand_param: string
          wait_start_date_param?: string
        }
        Returns: number
      }
      calculate_vip_tier: {
        Args: {
          spend: number
        }
        Returns: Database["public"]["Enums"]["vip_tier"]
      }
      get_waitlist_candidates: {
        Args: {
          brand_param: string
          model_param: string
          limit_param?: number
        }
        Returns: {
          waitlist_id: string
          client_id: string
          client_name: string
          vip_tier: Database["public"]["Enums"]["vip_tier"]
          priority_score: number
          days_waiting: number
          lifetime_spend: number
          wait_start_date: string
          reasoning: string
        }[]
      }
    }
    Enums: {
      allocation_status: "pending" | "confirmed" | "delivered" | "cancelled"
      user_role: "salesperson" | "manager" | "admin"
      vip_tier: "Bronze" | "Silver" | "Gold" | "Platinum"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}