// Field mapping utilities to convert between database snake_case and app camelCase
import { Client, WatchModel, WaitlistEntry, Purchase, ClientTier } from '@/types'
import { Tables } from './client'
import { calculateClientTier } from '@/data/mockData'

// Database row types
type DbClient = Tables<'clients'>
type DbInventory = Tables<'inventory'>
type DbWaitlist = Tables<'waitlist'>
type DbPurchase = Tables<'purchases'>

// Helper to calculate client tier from VIP tier
const vipTierToClientTier = (vipTier: string, lifetimeSpend: number): ClientTier => {
  // Use the calculation from mockData
  return calculateClientTier(lifetimeSpend, [])
}

// Map database client to app client
export const mapDbClientToClient = (dbClient: DbClient, purchases: Purchase[] = []): Client => {
  const clientTier = vipTierToClientTier(dbClient.vip_tier, Number(dbClient.lifetime_spend))

  return {
    id: dbClient.id,
    name: dbClient.name,
    email: dbClient.email,
    phone: dbClient.phone || '',
    lifetimeSpend: Number(dbClient.lifetime_spend),
    vipTier: dbClient.vip_tier,
    clientTier,
    spendPercentile: 0, // Will be calculated in store
    lastPurchase: purchases.length > 0 ? purchases[0].date : '',
    preferredBrands: dbClient.preferred_brands || [],
    notes: dbClient.notes || '',
    joinDate: dbClient.created_at.split('T')[0],
    purchases
  }
}

// Map app client to database insert
export const mapClientToDbInsert = (client: Partial<Client>): Partial<DbClient> => {
  return {
    name: client.name,
    email: client.email,
    phone: client.phone || null,
    vip_tier: client.vipTier,
    lifetime_spend: client.lifetimeSpend,
    preferred_brands: client.preferredBrands || [],
    notes: client.notes || null
  }
}

// Map database inventory to app watch model
export const mapDbInventoryToWatch = (dbWatch: DbInventory): WatchModel => {
  // Determine watch tier based on price and availability
  let watchTier: 1 | 2 | 3 | 4 | 5 = 5
  const price = Number(dbWatch.price)

  if (price > 50000) watchTier = 1
  else if (price > 30000) watchTier = 2
  else if (price > 15000) watchTier = 3
  else if (price > 10000) watchTier = 4
  else watchTier = 5

  return {
    id: dbWatch.id,
    brand: dbWatch.brand,
    model: dbWatch.model,
    collection: dbWatch.reference_number || '',
    price,
    availability: dbWatch.is_available ? 'Available' : 'Waitlist',
    watchTier,
    rarityDescription: dbWatch.description || '',
    description: dbWatch.description || '',
    image: dbWatch.image_url || undefined
  }
}

// Map app watch to database insert
export const mapWatchToDbInsert = (watch: Partial<WatchModel>) => {
  return {
    brand: watch.brand!,
    model: watch.model!,
    reference_number: watch.collection || null,
    price: watch.price!,
    category: watch.watchTier && watch.watchTier <= 2 ? 'complicated' : 'steel',
    is_available: watch.availability === 'Available',
    description: watch.description || null,
    image_url: watch.image || null
  }
}

// Map database waitlist to app waitlist entry
export const mapDbWaitlistToEntry = (dbEntry: DbWaitlist, watchId?: string): WaitlistEntry => {
  return {
    id: dbEntry.id,
    clientId: dbEntry.client_id,
    watchModelId: watchId || `${dbEntry.brand}-${dbEntry.model}`,
    dateAdded: dbEntry.wait_start_date,
    priority: dbEntry.priority_score,
    notes: dbEntry.notes || ''
  }
}

// Map app waitlist entry to database insert
export const mapWaitlistToDbInsert = (entry: Partial<WaitlistEntry>, watch?: WatchModel) => {
  return {
    client_id: entry.clientId!,
    brand: watch?.brand || '',
    model: watch?.model || '',
    reference_number: watch?.collection || null,
    priority_score: entry.priority || 0,
    wait_start_date: entry.dateAdded || new Date().toISOString().split('T')[0],
    notes: entry.notes || null,
    is_active: true
  }
}

// Map database purchase to app purchase
export const mapDbPurchaseToPurchase = (dbPurchase: DbPurchase): Purchase => {
  return {
    id: dbPurchase.id,
    watchModel: dbPurchase.model,
    brand: dbPurchase.brand,
    price: Number(dbPurchase.price),
    date: dbPurchase.purchase_date,
    serialNumber: dbPurchase.id.slice(0, 8).toUpperCase()
  }
}

// Map app purchase to database insert
export const mapPurchaseToDbInsert = (purchase: Partial<Purchase>, clientId: string, watchId?: string) => {
  const price = purchase.price || 0
  const category = price > 30000 ? 'complicated' : price > 15000 ? 'gold' : 'steel'
  const commissionRate = category === 'complicated' ? 20 : category === 'gold' ? 15 : 10

  return {
    client_id: clientId,
    watch_id: watchId || null,
    brand: purchase.brand!,
    model: purchase.watchModel!,
    price: purchase.price!,
    commission_rate: commissionRate,
    commission_amount: (price * commissionRate) / 100,
    purchase_date: purchase.date || new Date().toISOString().split('T')[0],
    salesperson_id: null
  }
}
