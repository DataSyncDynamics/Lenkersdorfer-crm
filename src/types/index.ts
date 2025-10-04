export type ClientTier = 1 | 2 | 3 | 4 | 5
export type WatchTier = 1 | 2 | 3 | 4 | 5
export type GreenBoxStatus = 'GREEN' | 'YELLOW' | 'RED'
export type VipTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum'

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  lifetimeSpend: number
  vipTier: VipTier
  clientTier: ClientTier // 1-5 based on lifetime spend percentiles
  spendPercentile: number // 0-100 percentile ranking
  lastPurchase: string
  preferredBrands: string[]
  notes: string
  avatar?: string
  joinDate: string
  purchases: Purchase[]
}

export interface Purchase {
  id: string
  watchModel: string
  brand: string
  price: number
  date: string
  serialNumber: string
}

export interface WatchModel {
  id: string
  brand: string
  model: string
  collection: string
  price: number
  availability: 'Available' | 'Waitlist' | 'Sold Out'
  watchTier: WatchTier // 1-5 rarity tier (1=Nearly Impossible, 5=Available)
  rarityDescription: string
  image?: string
  description: string
}

export interface WaitlistEntry {
  id: string
  clientId: string
  watchModelId: string
  dateAdded: string
  priority: number
  notes: string
}

export interface AllocationSuggestion {
  clientId: string
  score: number
  reasons: string[]
}

export interface GreenBoxMatch {
  id: string
  clientId: string
  watchModelId: string
  clientTier: ClientTier
  watchTier: WatchTier
  status: GreenBoxStatus
  priorityScore: number
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  daysWaiting: number
  lifetimeSpend: number
  spendPercentile: number
  callToAction: string
  dateCreated: string
}

export interface TierDefinition {
  tier: ClientTier
  name: string
  description: string
  minPercentile: number
  maxPercentile: number
  color: string
}

export interface WatchRarityDefinition {
  tier: WatchTier
  name: string
  description: string
  examples: string[]
  color: string
}

// Allocation workflow types
export interface AllocationContact {
  id: string
  clientId: string
  watchModelId: string
  rank: number // 1 = primary, 2 = backup, etc.
  score: number
  reasons: string[]
  contacted: boolean
  contactMethod?: 'SMS' | 'CALL' | 'EMAIL'
  contactTimestamp?: string
  saleCompleted: boolean
  completedAt?: string
  // New business logic fields
  businessCategory?: 'PERFECT_MATCH' | 'STRETCH_PURCHASE' | 'UPGRADE_OPPORTUNITY' | 'NOT_SUITABLE'
  businessLabel?: string
  businessAction?: string
  businessReasoning?: string
  businessConfidence?: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
  daysWaiting?: number
  isOnWaitlist?: boolean // True if client is actually on waitlist for this watch
}

export interface ContactAttempt {
  id: string
  clientId: string
  watchModelId: string
  method: 'SMS' | 'CALL' | 'EMAIL'
  message?: string
  timestamp: string
  successful: boolean
  notes?: string
}

// SMS Template types
export interface SMSTemplate {
  id: string
  name: string
  message: string
  type: 'ALLOCATION' | 'FOLLOWUP' | 'CUSTOM'
}

// Create client request type
export interface CreateClientRequest {
  name: string
  email: string
  phone: string
  notes?: string
  preferredBrands?: string[]
  vipTier?: VipTier
}

// New client data from form
export interface NewClientData {
  firstName: string
  lastName: string
  email: string
  phone: string
  notes: string
  wishlistWatches: { watchId: string; notes: string }[]
}

// Allocation type for notifications service
export interface Allocation {
  id: string
  clientId: string
  watchModelId: string
  allocationDate: string
  priority: number
  status: 'PENDING' | 'CONTACTED' | 'CONFIRMED' | 'DECLINED'
}