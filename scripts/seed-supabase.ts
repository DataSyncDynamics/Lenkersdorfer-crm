#!/usr/bin/env ts-node

/**
 * Seed Supabase database with mock data
 *
 * This script populates the database with:
 * - Mock clients
 * - Mock watches (inventory)
 * - Mock waitlist entries
 * - Mock purchase history
 */

import { createClient } from '@supabase/supabase-js'
import { mockClients, mockWatchModels, mockWaitlist } from '../src/data/mockData'
import { Database } from '../src/types/database'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('L Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

async function clearDatabase() {
  console.log('=�  Clearing existing data...')

  // Delete in correct order due to foreign key constraints
  await supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('waitlist').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log(' Database cleared')
}

async function seedClients() {
  console.log('=e Seeding clients...')

  const clientInserts = mockClients.map(client => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone || null,
    vip_tier: client.vipTier as Database['public']['Tables']['clients']['Row']['vip_tier'],
    lifetime_spend: client.lifetimeSpend,
    preferred_brands: client.preferredBrands,
    notes: client.notes || null,
  }))

  const { data, error } = await supabase
    .from('clients')
    .insert(clientInserts)
    .select()

  if (error) {
    console.error('L Error seeding clients:', error)
    throw error
  }

  console.log(` Seeded ${data?.length || 0} clients`)
  return data
}

async function seedInventory() {
  console.log(' Seeding inventory...')

  const inventoryInserts = mockWatchModels.map(watch => {
    // Determine category based on price
    let category = 'steel'
    if (watch.price > 30000) category = 'complicated'
    else if (watch.price > 15000) category = 'gold'

    return {
      id: watch.id,
      brand: watch.brand,
      model: watch.model,
      reference_number: watch.collection,
      price: watch.price,
      retail_price: watch.price * 1.2, // 20% markup
      category,
      is_available: watch.availability === 'Available',
      description: watch.description || null,
      image_url: watch.image || null,
    }
  })

  const { data, error } = await supabase
    .from('inventory')
    .insert(inventoryInserts)
    .select()

  if (error) {
    console.error('L Error seeding inventory:', error)
    throw error
  }

  console.log(` Seeded ${data?.length || 0} watches`)
  return data
}

async function seedPurchases() {
  console.log('=� Seeding purchase history...')

  let totalPurchases = 0

  for (const client of mockClients) {
    if (client.purchases && client.purchases.length > 0) {
      const purchaseInserts = client.purchases.map(purchase => {
        const price = purchase.price
        // Determine commission rate based on price
        let commissionRate = 10
        if (price > 30000) commissionRate = 20
        else if (price > 15000) commissionRate = 15

        return {
          client_id: client.id,
          brand: purchase.brand,
          model: purchase.watchModel,
          price: purchase.price,
          commission_rate: commissionRate,
          commission_amount: (price * commissionRate) / 100,
          purchase_date: purchase.date,
        }
      }) as Database['public']['Tables']['purchases']['Insert'][]

      const { data, error } = await supabase
        .from('purchases')
        .insert(purchaseInserts)
        .select()

      if (error) {
        console.error(`L Error seeding purchases for ${client.name}:`, error)
      } else {
        totalPurchases += data?.length || 0
      }
    }
  }

  console.log(` Seeded ${totalPurchases} purchases`)
}

async function seedWaitlist() {
  console.log('=� Seeding waitlist...')

  const waitlistInserts = []

  for (const entry of mockWaitlist) {
    // Find the watch model
    const watch = mockWatchModels.find(w => w.id === entry.watchModelId)
    if (!watch) {
      console.warn(`�  Skipping waitlist entry - watch not found: ${entry.watchModelId}`)
      continue
    }

    waitlistInserts.push({
      id: entry.id,
      client_id: entry.clientId,
      brand: watch.brand,
      model: watch.model,
      reference_number: watch.collection,
      priority_score: entry.priority * 20, // Scale up priority
      wait_start_date: entry.dateAdded,
      notes: entry.notes || null,
      is_active: true,
    })
  }

  const { data, error } = await supabase
    .from('waitlist')
    .insert(waitlistInserts as Database['public']['Tables']['waitlist']['Insert'][])
    .select()

  if (error) {
    console.error('L Error seeding waitlist:', error)
    throw error
  }

  console.log(` Seeded ${data?.length || 0} waitlist entries`)
  return data
}

async function main() {
  console.log('=� Starting Supabase seed...\n')

  try {
    await clearDatabase()
    console.log('')

    await seedClients()
    console.log('')

    await seedInventory()
    console.log('')

    await seedPurchases()
    console.log('')

    await seedWaitlist()
    console.log('')

    console.log(' Database seeded successfully!')
    console.log('\n=� Summary:')
    console.log(`   - ${mockClients.length} clients`)
    console.log(`   - ${mockWatchModels.length} watches`)
    console.log(`   - ${mockWaitlist.length} waitlist entries`)
    console.log(`   - Purchase history included`)
    console.log('\n<� Your CRM is ready for production!')

  } catch (error) {
    console.error('\nL Seed failed:', error)
    process.exit(1)
  }
}

main()
