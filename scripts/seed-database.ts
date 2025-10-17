#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js'
import { mockClients, mockWatchModels, mockWaitlist } from '../src/data/mockData'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedDatabase() {
  console.log('Starting database seed...\n')

  try {
    // 1. Create a test user first (for foreign key constraints)
    console.log('Creating test user...')
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@lenkersdorfer.com',
      password: 'admin123456',
      email_confirm: true,
    })

    if (authError && !authError.message.includes('already exists')) {
      console.error('Error creating user:', authError)
      throw authError
    }

    const userId = authUser?.user?.id || (await supabase.auth.admin.listUsers()).data.users[0]?.id

    if (!userId) {
      throw new Error('No user ID available')
    }

    console.log(`User created/found: ${userId}\n`)

    // 2. Seed Clients
    console.log('Seeding clients...')
    const clientsToInsert = mockClients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone || null,
      lifetime_spend: client.lifetimeSpend || 0,
      vip_tier: client.vipTier,
      preferred_brands: client.preferredBrands || [],
      notes: client.notes || null,
      assigned_to: userId,
    }))

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .upsert(clientsToInsert, { onConflict: 'id' })
      .select()

    if (clientsError) {
      console.error('Error seeding clients:', clientsError)
      throw clientsError
    }

    console.log(`Seeded ${clients?.length || 0} clients\n`)

    // 3. Seed Inventory (Watches)
    console.log('Seeding inventory...')
    const watchesToInsert = mockWatchModels.map(watch => ({
      id: watch.id,
      brand: watch.brand,
      model: watch.model,
      category: watch.collection || 'Unknown',
      price: watch.price,
      retail_price: watch.price,
      reference_number: watch.collection,
      description: watch.description,
      is_available: watch.availability === 'Available',
    }))

    const { data: watches, error: watchesError } = await supabase
      .from('inventory')
      .upsert(watchesToInsert, { onConflict: 'id' })
      .select()

    if (watchesError) {
      console.error('Error seeding inventory:', watchesError)
      throw watchesError
    }

    console.log(`Seeded ${watches?.length || 0} watches\n`)

    // 4. Seed Purchases (from client purchase history)
    console.log('Seeding purchases...')
    const purchasesToInsert: any[] = []

    mockClients.forEach(client => {
      if (client.purchases) {
        client.purchases.forEach(purchase => {
          purchasesToInsert.push({
            id: purchase.id,
            client_id: client.id,
            brand: purchase.brand,
            model: purchase.watchModel,
            price: purchase.price,
            purchase_date: purchase.date,
            commission_rate: 0.10, // Default 10%
            commission_amount: purchase.price * 0.10,
            salesperson_id: userId,
          })
        })
      }
    })

    if (purchasesToInsert.length > 0) {
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .upsert(purchasesToInsert, { onConflict: 'id' })
        .select()

      if (purchasesError) {
        console.error('Error seeding purchases:', purchasesError)
        throw purchasesError
      }

      console.log(`Seeded ${purchases?.length || 0} purchases\n`)
    }

    // 5. Seed Waitlist
    console.log('Seeding waitlist...')
    const waitlistToInsert = mockWaitlist.map(entry => {
      const watch = mockWatchModels.find(w => w.id === entry.watchModelId)
      return {
        id: entry.id,
        client_id: entry.clientId,
        brand: watch?.brand || 'Unknown',
        model: watch?.model || 'Unknown',
        reference_number: watch?.collection,
        wait_start_date: entry.dateAdded,
        priority_score: entry.priority || 0,
        notes: entry.notes,
        is_active: true,
      }
    })

    const { data: waitlist, error: waitlistError } = await supabase
      .from('waitlist')
      .upsert(waitlistToInsert, { onConflict: 'id' })
      .select()

    if (waitlistError) {
      console.error('Error seeding waitlist:', waitlistError)
      throw waitlistError
    }

    console.log(`Seeded ${waitlist?.length || 0} waitlist entries\n`)

    console.log('Database seed completed successfully!')
    console.log('\nTest Credentials:')
    console.log('Email: admin@lenkersdorfer.com')
    console.log('Password: admin123456')

  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
seedDatabase()
