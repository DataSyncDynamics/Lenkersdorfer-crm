#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('🔄 Applying reminders migration...\n')

  try {
    // Check if reminders table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('reminders')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ Reminders table already exists!')
      return
    }

    // Table doesn't exist, create it
    console.log('Creating reminders table...')

    // We'll use the SQL from the migration file
    const migrationSQL = `
-- Add last_contact_date to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP;

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reminder_date TIMESTAMP NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('follow-up', 'call-back', 'meeting', 'custom')),
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reminders_client_id ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(is_completed);
    `

    console.log('SQL to execute:', migrationSQL)
    console.log('\n⚠️  Note: This requires admin/service role key to execute DDL statements')
    console.log('📝 Please run this SQL manually in Supabase SQL Editor:\n')
    console.log('👉 https://supabase.com/dashboard/project/xzrxfbbvbhkbdssdndcb/sql\n')
    console.log(migrationSQL)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

applyMigration()
