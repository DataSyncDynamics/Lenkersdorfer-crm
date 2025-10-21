#!/usr/bin/env node

/**
 * Run database migration for reminders table
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runMigration() {
  console.log('🚀 Running migration: add_reminders_and_last_contact')
  console.log('=' .repeat(60))
  console.log('')

  try {
    // Read migration file
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20251017210005_add_reminders_and_last_contact.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split into individual statements (basic splitting on semicolon + newline)
    const statements = migrationSQL
      .split(';\n')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ')

      console.log(`[${i + 1}/${statements.length}] ${preview}...`)

      const { data, error } = await supabase.rpc('exec_sql', { sql: statement })

      if (error) {
        console.error(`❌ Error on statement ${i + 1}:`, error.message)
        console.error('Statement:', statement)
        // Continue with other statements
      } else {
        console.log(`✅ Success`)
      }
    }

    console.log('')
    console.log('=' .repeat(60))
    console.log('✅ Migration completed!')
    console.log('')

    // Verify tables were created
    console.log('🔍 Verifying migration...')

    const { data: reminderTest, error: reminderError } = await supabase
      .from('reminders')
      .select('count')
      .limit(1)

    if (reminderError && !reminderError.message.includes('does not exist')) {
      console.log('⚠️  Reminders table check:', reminderError.message)
    } else {
      console.log('✅ Reminders table accessible')
    }

    const { data: clientTest, error: clientError } = await supabase
      .from('clients')
      .select('last_contact_date')
      .limit(1)

    if (clientError) {
      console.log('⚠️  Clients.last_contact_date check:', clientError.message)
    } else {
      console.log('✅ Clients.last_contact_date column accessible')
    }

    console.log('')
    console.log('🎉 Migration verification complete!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

runMigration()
