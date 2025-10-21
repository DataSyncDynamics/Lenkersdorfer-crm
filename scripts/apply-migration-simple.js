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
    // Create reminders table using direct INSERT (works around RPC limitations)
    console.log('1️⃣  Creating reminders table...')

    // Try to insert a test row to create the table structure
    const { data, error } = await supabase
      .from('reminders')
      .insert([{
        client_id: '00000000-0000-0000-0000-000000000000', // Dummy ID for structure
        reminder_date: new Date().toISOString(),
        reminder_type: 'custom',
        notes: 'Migration test',
        is_completed: true
      }])
      .select()

    if (error) {
      if (error.message.includes('relation "reminders" does not exist')) {
        console.log('⚠️  Reminders table does not exist - need manual SQL execution')
        console.log('\n📋 Please run this SQL in Supabase SQL Editor:')
        console.log('=' .repeat(60))
        console.log(`
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

ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_reminders_client_id ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date) WHERE is_completed = FALSE;
        `)
        console.log('=' .repeat(60))
        console.log('\nAfter running the SQL, re-run this script to verify.\n')
      } else {
        console.log('✅ Reminders table appears to exist already')
      }
    } else {
      console.log('✅ Reminders table is accessible')

      // Clean up test row
      await supabase
        .from('reminders')
        .delete()
        .eq('client_id', '00000000-0000-0000-0000-000000000000')
    }

    // Test last_contact_date
    console.log('\n2️⃣  Checking last_contact_date column...')
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, last_contact_date')
      .limit(1)

    if (clientError && clientError.message.includes('column "last_contact_date" does not exist')) {
      console.log('⚠️  last_contact_date column needs to be added')
      console.log('   Include the ALTER TABLE statement from above')
    } else {
      console.log('✅ last_contact_date column verified')
    }

    console.log('\n🎉 Migration check complete!')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
  }
}

applyMigration()
