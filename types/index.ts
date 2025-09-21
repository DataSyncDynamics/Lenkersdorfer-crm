export type VipTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
export type AllocationStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type UserRole = 'salesperson' | 'manager' | 'admin';
export type WatchCategory = 'steel' | 'gold' | 'complicated';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vip_tier: VipTier;
  lifetime_spend: number;
  assigned_to?: string;
  preferred_brands: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  brand: string;
  model: string;
  reference_number?: string;
  price: number;
  retail_price?: number;
  category: WatchCategory;
  availability_date?: string;
  is_available: boolean;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface WaitlistEntry {
  id: string;
  client_id: string;
  brand: string;
  model: string;
  reference_number?: string;
  priority_score: number;
  wait_start_date: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  client?: Client;
}

export interface Allocation {
  id: string;
  client_id: string;
  watch_id: string;
  allocation_date: string;
  delivery_date?: string;
  status: AllocationStatus;
  commission_rate: number;
  commission_amount: number;
  allocated_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  client?: Client;
  watch?: Inventory;
  allocated_by_user?: UserProfile;
}

export interface Purchase {
  id: string;
  client_id: string;
  watch_id?: string;
  brand: string;
  model: string;
  price: number;
  commission_rate: number;
  commission_amount: number;
  purchase_date: string;
  salesperson_id?: string;
  created_at: string;
  // Joined fields
  client?: Client;
  watch?: Inventory;
  salesperson?: UserProfile;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  role: UserRole;
  team?: string;
  commission_rate: number;
  created_at: string;
  updated_at: string;
}

export interface WaitlistCandidate {
  waitlist_id: string;
  client_id: string;
  client_name: string;
  vip_tier: VipTier;
  priority_score: number;
  days_waiting: number;
  lifetime_spend: number;
  wait_start_date: string;
  reasoning: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Request types
export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  preferred_brands?: string[];
  notes?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  lifetime_spend?: number;
  assigned_to?: string;
}

export interface CreateWaitlistRequest {
  client_id: string;
  brand: string;
  model: string;
  reference_number?: string;
  notes?: string;
}

export interface CreateAllocationRequest {
  client_id: string;
  watch_id: string;
  notes?: string;
}

export interface SearchParams {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ClientSearchParams extends SearchParams {
  vip_tier?: VipTier;
  assigned_to?: string;
}

export interface WaitlistSearchParams extends SearchParams {
  brand?: string;
  model?: string;
  client_id?: string;
  active_only?: boolean;
}

export interface InventorySearchParams extends SearchParams {
  brand?: string;
  category?: WatchCategory;
  available_only?: boolean;
  price_min?: number;
  price_max?: number;
}