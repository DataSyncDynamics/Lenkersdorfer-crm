#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * Run this before deploying to ensure all required variables are set
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('='.repeat(60));
console.log('Environment Variable Verification');
console.log('='.repeat(60));
console.log('');

let hasErrors = false;

console.log('Required Variables:');
console.log('-'.repeat(60));

for (const varName of requiredEnvVars) {
  const value = process.env[varName];
  const status = value ? '✓ SET' : '✗ MISSING';
  const preview = value ? `${value.substring(0, 30)}...` : 'NOT FOUND';

  console.log(`${status} ${varName}`);
  console.log(`    Preview: ${preview}`);
  console.log('');

  if (!value) {
    hasErrors = true;
  }
}

console.log('Optional Variables:');
console.log('-'.repeat(60));

for (const varName of optionalEnvVars) {
  const value = process.env[varName];
  const status = value ? '✓ SET' : '○ NOT SET';
  const preview = value ? `${value.substring(0, 30)}...` : 'Not configured';

  console.log(`${status} ${varName}`);
  console.log(`    Preview: ${preview}`);
  console.log('');
}

console.log('='.repeat(60));

if (hasErrors) {
  console.error('ERROR: Missing required environment variables!');
  console.error('');
  console.error('To fix this:');
  console.error('1. Create .env.local file in project root');
  console.error('2. Add the missing variables');
  console.error('3. For Vercel deployment, set variables in project settings');
  console.error('');
  process.exit(1);
} else {
  console.log('✓ All required environment variables are set');
  console.log('');
  process.exit(0);
}
