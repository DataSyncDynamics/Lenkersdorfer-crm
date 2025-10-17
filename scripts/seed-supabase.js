#!/usr/bin/env node

/**
 * Seed Supabase database with mock data
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mock data inline to avoid TS import issues
const mockClients = [
  {
    name: 'RICHARD BLACKSTONE',
    email: 'richard.blackstone@example.com',
    phone: '(555) 999-0001',
    lifetimeSpend: 487500,
    vipTier: 'Platinum',
    preferredBrands: ['PATEK PHILIPPE', 'ROLEX', 'AUDEMARS PIGUET'],
    notes: 'Ultra-high net worth collector. Qualified for any Tier 1 allocation including Platinum Daytona.',
    purchases: [
      { brand: 'PATEK PHILIPPE', model: 'NAUTILUS 5711/1A', price: 185000, date: '2024-08-15' },
      { brand: 'ROLEX', model: 'DAYTONA M116500LN STEEL', price: 85000, date: '2024-02-10' },
      { brand: 'AUDEMARS PIGUET', model: 'ROYAL OAK 15500ST', price: 67500, date: '2023-11-20' },
      { brand: 'ROLEX', model: 'GMT-MASTER II M126710BLNR', price: 65000, date: '2023-07-30' },
      { brand: 'ROLEX', model: 'SUBMARINER M126610LN', price: 85000, date: '2023-03-12' }
    ]
  },
  {
    name: 'JENNIFER CHEN',
    email: 'jennifer.chen@example.com',
    phone: '(555) 888-0002',
    lifetimeSpend: 142000,
    vipTier: 'Gold',
    preferredBrands: ['ROLEX', 'CARTIER'],
    notes: 'High net worth professional. Qualified for steel Daytona and GMT allocations.',
    purchases: [
      { brand: 'ROLEX', model: 'DAYTONA M116500LN STEEL', price: 45000, date: '2024-07-22' },
      { brand: 'ROLEX', model: 'GMT-MASTER II M126710BLNR', price: 38000, date: '2024-01-15' },
      { brand: 'CARTIER', model: 'SANTOS DE CARTIER LARGE', price: 32000, date: '2023-09-10' },
      { brand: 'ROLEX', model: 'SUBMARINER M126610LN', price: 27000, date: '2023-03-20' }
    ]
  },
  {
    name: 'MICHAEL SYKES',
    email: 'michael.sykes@example.com',
    phone: '(555) 123-4567',
    lifetimeSpend: 11236,
    vipTier: 'Bronze',
    preferredBrands: ['ROLEX', 'OMEGA'],
    notes: 'Entry level luxury client.',
    purchases: [
      { brand: 'ROLEX', model: 'SUBMARINER M126610LN', price: 8500, date: '2024-03-15' },
      { brand: 'OMEGA', model: 'SEAMASTER DIVER', price: 2736, date: '2024-01-20' }
    ]
  }
]

const mockWatches = [
  { brand: 'Rolex', model: 'Daytona', collection: '126500LN Panda', price: 35000, available: false, description: 'White dial Daytona' },
  { brand: 'Rolex', model: 'GMT-Master II', collection: '126720VTNR Sprite', price: 21000, available: false, description: 'Left-handed GMT' },
  { brand: 'Rolex', model: 'Submariner', collection: '116610LV Hulk', price: 28000, available: false, description: 'Discontinued green Submariner' },
  { brand: 'Rolex', model: 'Submariner', collection: '126610LN', price: 18500, available: false, description: 'Black dial steel Submariner' },
  { brand: 'Rolex', model: 'Sky-Dweller', collection: '326934 Steel', price: 22500, available: false, description: 'Steel Sky-Dweller with blue dial' },
  { brand: 'Rolex', model: 'Yacht-Master', collection: '126622 40mm', price: 14500, available: true, description: 'Steel and platinum Yacht-Master' },
  { brand: 'Rolex', model: 'Air-King', collection: '126900', price: 12000, available: true, description: 'Air-King with black dial' }
]

// Store client and watch IDs after creation
let clientIdMap = {}
let watchIdMap = {}

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...')

  await supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('waitlist').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('✅ Database cleared')
}

async function seedClients() {
  console.log('👥 Seeding clients...')

  const clientInserts = mockClients.map(client => ({
    name: client.name,
    email: client.email,
    phone: client.phone,
    vip_tier: client.vipTier,
    lifetime_spend: client.lifetimeSpend,
    preferred_brands: client.preferredBrands,
    notes: client.notes
  }))

  const { data, error } = await supabase
    .from('clients')
    .insert(clientInserts)
    .select()

  if (error) {
    console.error('❌ Error seeding clients:', error)
    throw error
  }

  // Store client ID mapping for later use
  data.forEach((client, index) => {
    clientIdMap[mockClients[index].email] = client.id
  })

  console.log(`✅ Seeded ${data?.length || 0} clients`)
  return data
}

async function seedInventory() {
  console.log('⌚ Seeding inventory...')

  const inventoryInserts = mockWatches.map(watch => {
    let category = 'steel'
    if (watch.price > 30000) category = 'complicated'
    else if (watch.price > 15000) category = 'gold'

    return {
      brand: watch.brand,
      model: watch.model,
      reference_number: watch.collection,
      price: watch.price,
      retail_price: watch.price * 1.2,
      category,
      is_available: watch.available,
      description: watch.description
    }
  })

  const { data, error } = await supabase
    .from('inventory')
    .insert(inventoryInserts)
    .select()

  if (error) {
    console.error('❌ Error seeding inventory:', error)
    throw error
  }

  // Store watch ID mapping for later use
  data.forEach((watch, index) => {
    const key = `${watch.brand}-${watch.model}-${watch.reference_number}`
    watchIdMap[key] = watch.id
  })

  console.log(`✅ Seeded ${data?.length || 0} watches`)
  return data
}

async function seedPurchases() {
  console.log('💰 Seeding purchase history...')

  let totalPurchases = 0

  for (const client of mockClients) {
    const clientId = clientIdMap[client.email]
    if (!clientId) {
      console.warn(`⚠️  Client ID not found for ${client.name}`)
      continue
    }

    if (client.purchases && client.purchases.length > 0) {
      const purchaseInserts = client.purchases.map(purchase => {
        const price = purchase.price
        let commissionRate = 10
        if (price > 30000) commissionRate = 20
        else if (price > 15000) commissionRate = 15

        return {
          client_id: clientId,
          brand: purchase.brand,
          model: purchase.model,
          price: purchase.price,
          commission_rate: commissionRate,
          commission_amount: (price * commissionRate) / 100,
          purchase_date: purchase.date
        }
      })

      const { data, error } = await supabase
        .from('purchases')
        .insert(purchaseInserts)
        .select()

      if (error) {
        console.error(`❌ Error seeding purchases for ${client.name}:`, error)
      } else {
        totalPurchases += data?.length || 0
      }
    }
  }

  console.log(`✅ Seeded ${totalPurchases} purchases`)
}

async function seedWaitlist() {
  console.log('📋 Seeding waitlist...')

  // Create a few waitlist entries
  const waitlistEntries = [
    { clientEmail: 'richard.blackstone@example.com', brand: 'Rolex', model: 'Daytona', collection: '126500LN Panda', dateAdded: '2024-05-15', priority: 1 },
    { clientEmail: 'jennifer.chen@example.com', brand: 'Rolex', model: 'Submariner', collection: '126610LN', dateAdded: '2024-06-01', priority: 1 }
  ]

  const waitlistInserts = []

  for (const entry of waitlistEntries) {
    const clientId = clientIdMap[entry.clientEmail]
    if (!clientId) {
      console.warn(`⚠️  Client ID not found for ${entry.clientEmail}`)
      continue
    }

    waitlistInserts.push({
      client_id: clientId,
      brand: entry.brand,
      model: entry.model,
      reference_number: entry.collection,
      priority_score: entry.priority * 20,
      wait_start_date: entry.dateAdded,
      is_active: true
    })
  }

  if (waitlistInserts.length === 0) {
    console.log('⚠️  No waitlist entries to seed')
    return
  }

  const { data, error} = await supabase
    .from('waitlist')
    .insert(waitlistInserts)
    .select()

  if (error) {
    console.error('❌ Error seeding waitlist:', error)
    throw error
  }

  console.log(`✅ Seeded ${data?.length || 0} waitlist entries`)
  return data
}

async function main() {
  console.log('🚀 Starting Supabase seed...\n')

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

    console.log('✅ Database seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`   - ${mockClients.length} clients`)
    console.log(`   - ${mockWatches.length} watches`)
    console.log(`   - 2 waitlist entries`)
    console.log(`   - Purchase history included`)
    console.log('\n🎉 Your CRM is ready for production!')

  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  }
}

main()
