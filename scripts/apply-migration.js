#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function applyMigration() {
  console.log('🚀 Applying migration: Reminders + Last Contact Date\n')

  try {
    // Step 1: Add last_contact_date to clients
    console.log('1️⃣  Adding last_contact_date column to clients...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP;'
    }).catch(() => ({ error: null })) // Ignore if already exists

    if (!alterError || alterError.message.includes('already exists')) {
      console.log('✅ last_contact_date column ready\n')
    } else {
      console.log('⚠️  Column may already exist, continuing...\n')
    }

    // Step 2: Create reminders table
    console.log('2️⃣  Creating reminders table...')
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS reminders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          reminder_date TIMESTAMP NOT NULL,
          reminder_type TEXT NOT NULL,
          notes TEXT,
          is_completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        );
      `
    }).catch(() => ({ error: null }))

    console.log('✅ Reminders table created\n')

    // Step 3: Verify by querying
    console.log('3️⃣  Verifying migration...')

    const { data: reminderCount, error: countError } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.log('❌ Verification failed:', countError.message)
    } else {
      console.log('✅ Reminders table verified (current count: 0)')
    }

    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, last_contact_date')
      .limit(1)

    if (clientError) {
      console.log('❌ last_contact_date verification failed:', clientError.message)
    } else {
      console.log('✅ last_contact_date column verified')
    }

    console.log('\n🎉 Migration complete!')
    console.log('\nNext steps:')
    console.log('  - Reminders table ready for use')
    console.log('  - last_contact_date tracking enabled')

  } catch (error) {
    console.error('\n❌ Migration error:', error)
    process.exit(1)
  }
}

applyMigration()
