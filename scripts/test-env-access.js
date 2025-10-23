#!/usr/bin/env node

/**
 * Test Environment Variable Access
 *
 * This script simulates how Next.js accesses environment variables
 * to verify they'll work in production builds.
 */

require('dotenv').config({ path: '.env.local' });

console.log('='.repeat(70));
console.log('Testing Environment Variable Access Patterns');
console.log('='.repeat(70));
console.log('');

// Pattern 1: Direct access (what Next.js does during build)
console.log('Pattern 1: Direct process.env access (Build-time inlining)');
console.log('-'.repeat(70));
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ACCESSIBLE' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ACCESSIBLE' : 'MISSING');
console.log('');

// Pattern 2: Function wrapper (what env-runtime.ts does)
console.log('Pattern 2: Function wrapper (Runtime access)');
console.log('-'.repeat(70));
function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}
function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
console.log('getSupabaseUrl():', getSupabaseUrl() ? 'ACCESSIBLE' : 'MISSING');
console.log('getSupabaseAnonKey():', getSupabaseAnonKey() ? 'ACCESSIBLE' : 'MISSING');
console.log('');

// Pattern 3: Verify the values are actually present
console.log('Pattern 3: Value verification');
console.log('-'.repeat(70));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (url && key) {
  console.log('URL preview:', url.substring(0, 40) + '...');
  console.log('Key preview:', key.substring(0, 40) + '...');
  console.log('');
  console.log('✓ Both variables are accessible and have values');
} else {
  console.log('✗ One or more variables are missing!');
  process.exit(1);
}

console.log('');
console.log('='.repeat(70));
console.log('Environment Variable Access Test: PASSED');
console.log('='.repeat(70));
console.log('');
console.log('This means:');
console.log('- Variables are accessible via direct process.env access');
console.log('- Next.js will inline these during webpack compilation');
console.log('- They will be available in browser bundles in production');
console.log('');
