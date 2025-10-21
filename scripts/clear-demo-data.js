#!/usr/bin/env node

/**
 * Clear all demo data from Lenkersdorfer CRM database
 * Keeps the schema intact but removes all records
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearAllData() {
  console.log('🗑️  Clearing all demo data from database...\n')

  try {
    // Delete in order of dependencies (child tables first)

    // 1. Delete reminders (depends on clients)
    console.log('Deleting reminders...')
    const { error: remindersError } = await supabase
      .from('reminders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (remindersError) {
      console.log('⚠️  Reminders table might not exist yet:', remindersError.message)
    } else {
      console.log('✅ Cleared reminders')
    }

    // 2. Delete allocations (depends on clients and waitlist)
    console.log('Deleting allocations...')
    const { error: allocationsError } = await supabase
      .from('allocations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (allocationsError) {
      console.log('⚠️  Allocations table might not exist yet:', allocationsError.message)
    } else {
      console.log('✅ Cleared allocations')
    }

    // 3. Delete waitlist entries (depends on clients)
    console.log('Deleting waitlist entries...')
    const { error: waitlistError } = await supabase
      .from('waitlist')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (waitlistError) {
      console.log('⚠️  Waitlist table might not exist yet:', waitlistError.message)
    } else {
      console.log('✅ Cleared waitlist')
    }

    // 4. Delete purchases (depends on clients)
    console.log('Deleting purchases...')
    const { error: purchasesError } = await supabase
      .from('purchases')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (purchasesError) {
      console.log('⚠️  Purchases table might not exist yet:', purchasesError.message)
    } else {
      console.log('✅ Cleared purchases')
    }

    // 5. Delete clients (parent table)
    console.log('Deleting clients...')
    const { error: clientsError } = await supabase
      .from('clients')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (clientsError) {
      console.error('❌ Error deleting clients:', clientsError)
      throw clientsError
    }
    console.log('✅ Cleared clients')

    console.log('\n✨ All demo data cleared successfully!')
    console.log('📝 Database is now empty and ready for real client data import')
    console.log('👉 Go to /import tab to upload your Lenkersdorfer client data\n')

  } catch (error) {
    console.error('\n❌ Error clearing data:', error)
    process.exit(1)
  }
}

clearAllData()
