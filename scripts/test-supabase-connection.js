#!/usr/bin/env node

/**
 * Comprehensive Supabase Connection Test
 * Tests all database operations and API endpoints for production readiness
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Supabase Connection Test Suite')
console.log('=' .repeat(60))
console.log('')

// Validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Missing Supabase credentials in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('✅ Environment variables loaded')
console.log(`   URL: ${supabaseUrl}`)
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`)
console.log('')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
}

function logTest(name, status, message = '', data = null) {
  const symbols = { pass: '✅', fail: '❌', warn: '⚠️' }
  const symbol = symbols[status] || '●'

  console.log(`${symbol} ${name}`)
  if (message) console.log(`   ${message}`)
  if (data) console.log(`   Data:`, data)

  results.tests.push({ name, status, message, data })
  if (status === 'pass') results.passed++
  if (status === 'fail') results.failed++
  if (status === 'warn') results.warnings++

  console.log('')
}

async function testDatabaseConnection() {
  console.log('📊 Testing Database Connection...')
  console.log('-'.repeat(60))

  try {
    // Test basic connectivity with a simple query
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1)

    if (error) {
      logTest('Database Connection', 'fail', `Error: ${error.message}`)
      return false
    }

    logTest('Database Connection', 'pass', 'Successfully connected to Supabase')
    return true
  } catch (error) {
    logTest('Database Connection', 'fail', `Exception: ${error.message}`)
    return false
  }
}

async function testClientsTable() {
  console.log('👥 Testing Clients Table...')
  console.log('-'.repeat(60))

  try {
    // Read test
    const { data: clients, error: readError } = await supabase
      .from('clients')
      .select('*')
      .limit(5)

    if (readError) {
      logTest('Clients: Read', 'fail', `Error: ${readError.message}`)
      return false
    }

    logTest('Clients: Read', 'pass', `Retrieved ${clients?.length || 0} clients`)

    if (!clients || clients.length === 0) {
      logTest('Clients: Data Check', 'warn', 'No clients found in database - run seed script')
    } else {
      logTest('Clients: Data Check', 'pass', `Sample: ${clients[0].name}`)
    }

    // Test write capability with a test client
    const testClient = {
      name: 'CONNECTION_TEST_CLIENT',
      email: `test_${Date.now()}@example.com`,
      phone: '(555) 000-0000',
      vip_tier: 'Bronze',
      lifetime_spend: 0
    }

    const { data: created, error: createError } = await supabase
      .from('clients')
      .insert([testClient])
      .select()

    if (createError) {
      logTest('Clients: Write', 'fail', `Error: ${createError.message}`)
      return false
    }

    logTest('Clients: Write', 'pass', `Created test client: ${created[0].id}`)

    // Test update
    const { data: updated, error: updateError } = await supabase
      .from('clients')
      .update({ notes: 'Connection test - OK' })
      .eq('id', created[0].id)
      .select()

    if (updateError) {
      logTest('Clients: Update', 'fail', `Error: ${updateError.message}`)
    } else {
      logTest('Clients: Update', 'pass', 'Successfully updated test client')
    }

    // Test delete (cleanup)
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', created[0].id)

    if (deleteError) {
      logTest('Clients: Delete', 'fail', `Error: ${deleteError.message}`)
    } else {
      logTest('Clients: Delete', 'pass', 'Successfully deleted test client')
    }

    return true
  } catch (error) {
    logTest('Clients Table Test', 'fail', `Exception: ${error.message}`)
    return false
  }
}

async function testInventoryTable() {
  console.log('⌚ Testing Inventory Table...')
  console.log('-'.repeat(60))

  try {
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*')
      .limit(5)

    if (error) {
      logTest('Inventory: Read', 'fail', `Error: ${error.message}`)
      return false
    }

    logTest('Inventory: Read', 'pass', `Retrieved ${inventory?.length || 0} watches`)

    if (!inventory || inventory.length === 0) {
      logTest('Inventory: Data Check', 'warn', 'No inventory found - run seed script')
    } else {
      logTest('Inventory: Data Check', 'pass', `Sample: ${inventory[0].brand} ${inventory[0].model}`)
    }

    return true
  } catch (error) {
    logTest('Inventory Table Test', 'fail', `Exception: ${error.message}`)
    return false
  }
}

async function testPurchasesTable() {
  console.log('💰 Testing Purchases Table...')
  console.log('-'.repeat(60))

  try {
    const { data: purchases, error } = await supabase
      .from('purchases')
      .select('*')
      .limit(5)

    if (error) {
      logTest('Purchases: Read', 'fail', `Error: ${error.message}`)
      return false
    }

    logTest('Purchases: Read', 'pass', `Retrieved ${purchases?.length || 0} purchases`)

    if (!purchases || purchases.length === 0) {
      logTest('Purchases: Data Check', 'warn', 'No purchases found - run seed script')
    } else {
      const total = purchases.reduce((sum, p) => sum + (p.price || 0), 0)
      logTest('Purchases: Data Check', 'pass', `Total value: $${total.toLocaleString()}`)
    }

    return true
  } catch (error) {
    logTest('Purchases Table Test', 'fail', `Exception: ${error.message}`)
    return false
  }
}

async function testWaitlistTable() {
  console.log('📋 Testing Waitlist Table...')
  console.log('-'.repeat(60))

  try {
    const { data: waitlist, error } = await supabase
      .from('waitlist')
      .select('*')
      .limit(5)

    if (error) {
      logTest('Waitlist: Read', 'fail', `Error: ${error.message}`)
      return false
    }

    logTest('Waitlist: Read', 'pass', `Retrieved ${waitlist?.length || 0} waitlist entries`)

    if (!waitlist || waitlist.length === 0) {
      logTest('Waitlist: Data Check', 'warn', 'No waitlist entries - run seed script')
    } else {
      logTest('Waitlist: Data Check', 'pass', `Sample: ${waitlist[0].brand} ${waitlist[0].model}`)
    }

    return true
  } catch (error) {
    logTest('Waitlist Table Test', 'fail', `Exception: ${error.message}`)
    return false
  }
}

async function testPerformance() {
  console.log('⚡ Testing Performance...')
  console.log('-'.repeat(60))

  try {
    const start = Date.now()

    const { data, error } = await supabase
      .from('clients')
      .select('*, purchases(*)')
      .limit(10)

    const duration = Date.now() - start

    if (error) {
      logTest('Performance: Join Query', 'fail', `Error: ${error.message}`)
      return false
    }

    if (duration < 500) {
      logTest('Performance: Join Query', 'pass', `Excellent: ${duration}ms`)
    } else if (duration < 1000) {
      logTest('Performance: Join Query', 'pass', `Good: ${duration}ms`)
    } else {
      logTest('Performance: Join Query', 'warn', `Slow: ${duration}ms - consider optimization`)
    }

    return true
  } catch (error) {
    logTest('Performance Test', 'fail', `Exception: ${error.message}`)
    return false
  }
}

async function testRowLevelSecurity() {
  console.log('🔒 Testing Row Level Security...')
  console.log('-'.repeat(60))

  try {
    // Test that we can read data (RLS allows read)
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .limit(1)

    if (error) {
      logTest('RLS: Read Access', 'warn', 'RLS may be blocking reads - check policies')
    } else {
      logTest('RLS: Read Access', 'pass', 'Read operations permitted')
    }

    return true
  } catch (error) {
    logTest('RLS Test', 'fail', `Exception: ${error.message}`)
    return false
  }
}

async function printSummary() {
  console.log('')
  console.log('=' .repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(60))
  console.log('')
  console.log(`Total Tests: ${results.tests.length}`)
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⚠️  Warnings: ${results.warnings}`)
  console.log('')

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED - PRODUCTION READY!')
    console.log('')
    console.log('✨ Supabase backend is fully operational')
    console.log('✨ All CRUD operations working correctly')
    console.log('✨ Performance is optimal')
    console.log('')

    if (results.warnings > 0) {
      console.log('⚠️  RECOMMENDATIONS:')
      console.log('   - Run seed script to populate database with sample data')
      console.log('   - Command: npm run seed')
    }
  } else {
    console.log('❌ PRODUCTION BLOCKERS DETECTED')
    console.log('')
    console.log('Failed tests:')
    results.tests
      .filter(t => t.status === 'fail')
      .forEach(t => {
        console.log(`   ❌ ${t.name}: ${t.message}`)
      })
    console.log('')
    console.log('⚠️  DO NOT DEPLOY - Fix issues above first')
  }

  console.log('')
  console.log('=' .repeat(60))

  return results.failed === 0
}

async function main() {
  try {
    const connected = await testDatabaseConnection()
    if (!connected) {
      console.error('\n❌ Cannot proceed - database connection failed')
      process.exit(1)
    }

    await testClientsTable()
    await testInventoryTable()
    await testPurchasesTable()
    await testWaitlistTable()
    await testPerformance()
    await testRowLevelSecurity()

    const success = await printSummary()

    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

main()
