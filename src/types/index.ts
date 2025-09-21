export interface Client {
  id: string
  name: string
  email: string
  phone: string
  lifetimeSpend: number
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
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