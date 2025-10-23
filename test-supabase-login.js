#!/usr/bin/env node

/**
 * Test Supabase Login Credentials
 *
 * This script tests if the demo credentials work with your Supabase instance
 * Run with: node test-supabase-login.js
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://zqstpmfatjatnvodiaey.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxc3RwbWZhdGphdG52b2RpYWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzUyMTYsImV4cCI6MjA3NjMxMTIxNn0.zkYP2qBo-nqv0Mc_OaSBlHVpT4cqDLl10LUiK8AbztA'

const EMAIL = 'jason@lenkersdorfer.com'
const PASSWORD = 'Complex123'

async function testLogin() {
  console.log('🔍 Testing Supabase Login...\n')
  console.log('URL:', SUPABASE_URL)
  console.log('Email:', EMAIL)
  console.log('Password:', '***' + PASSWORD.slice(-4))
  console.log('')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    console.log('📡 Attempting sign in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD
    })

    if (error) {
      console.error('❌ Sign in FAILED:', error.message)
      console.error('Error status:', error.status)
      console.error('Error details:', error)

      if (error.message.includes('Email not confirmed')) {
        console.log('\n💡 TIP: The user email needs to be confirmed in Supabase.')
        console.log('   Go to: Supabase Dashboard → Authentication → Users')
        console.log('   Find the user and confirm their email')
      }

      if (error.message.includes('Invalid login credentials')) {
        console.log('\n💡 TIP: Check that the user was created with the correct password.')
        console.log('   You may need to reset the password in Supabase Dashboard')
      }

      process.exit(1)
    }

    console.log('✅ Sign in SUCCESSFUL!')
    console.log('')
    console.log('User ID:', data.user?.id)
    console.log('User Email:', data.user?.email)
    console.log('Email Confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No')
    console.log('Session Token:', data.session?.access_token?.substring(0, 20) + '...')
    console.log('')
    console.log('🎉 Login credentials are working correctly!')

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    console.error(err)
    process.exit(1)
  }
}

testLogin()
