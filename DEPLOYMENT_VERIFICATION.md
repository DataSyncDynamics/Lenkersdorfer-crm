# Deployment Verification Checklist

## Environment Variable Fix - Production Deployment Guide

This guide ensures environment variables are properly accessible in the browser on Vercel.

---

## The Problem (SOLVED)

**Issue**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were not accessible in the browser runtime in production on Vercel.

**Root Cause**: Next.js 14+ requires DIRECT `process.env.VARIABLE_NAME` access for proper build-time inlining. The `env{}` property in `next.config.js` is deprecated and doesn't work.

**Solution**: Created `/src/lib/env-runtime.ts` with direct `process.env` access patterns that get inlined during webpack compilation.

---

## Pre-Deployment Checklist

### 1. Verify Environment Variables Locally

```bash
# Run verification script
npm run verify-env

# Expected output:
# ✓ SET NEXT_PUBLIC_SUPABASE_URL
# ✓ SET NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. Test Local Build

```bash
# Clean build
rm -rf .next

# Run production build
npm run build

# Expected: Build completes without errors
# Verify: Check .next/static/chunks for inlined values

# Test the built app
npm start

# Access: http://localhost:3000
```

### 3. Verify Vercel Environment Variables

```bash
# List environment variables
vercel env ls

# Verify these are set for Production:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**CRITICAL**: Variables must be set BEFORE triggering a build. Vercel inlines them during compilation.

---

## Deployment Steps

### Step 1: Verify Vercel Project Settings

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `lenkersdorfer-crm`
3. Navigate to **Settings** → **Environment Variables**
4. Verify these variables exist:

| Variable Name | Environment | Required |
|--------------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | YES |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | YES |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | Optional |

**Important**: Make sure they're set for **all three environments** (Production, Preview, Development).

### Step 2: Trigger New Deployment

```bash
# Option A: Deploy via CLI
vercel --prod

# Option B: Push to main branch (if auto-deploy enabled)
git add .
git commit -m "Fix: Environment variable browser access in production"
git push origin main
```

### Step 3: Wait for Build Completion

Monitor the build logs in Vercel dashboard for:
- ✓ Environment variable verification passes
- ✓ Next.js build completes
- ✓ Static page generation succeeds

### Step 4: Verify Deployment

#### Test 1: Debug Endpoint (Server-side)

**Only works if you set `ENABLE_DEBUG_ENDPOINT=true` in Vercel**

```bash
# Enable debug endpoint first in Vercel:
vercel env add ENABLE_DEBUG_ENDPOINT
# Value: true
# Environment: Production

# Redeploy, then test:
curl https://your-app.vercel.app/api/debug/env
```

Expected response:
```json
{
  "verdict": "ALL TESTS PASSED - Environment variables are accessible",
  "tests": {
    "directAccess": {
      "NEXT_PUBLIC_SUPABASE_URL": { "isSet": true },
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": { "isSet": true }
    },
    "functionAccess": {
      "getSupabaseUrl": { "isSet": true },
      "getSupabaseAnonKey": { "isSet": true }
    }
  }
}
```

#### Test 2: Browser Console (Client-side)

1. Open your deployed app: `https://your-app.vercel.app`
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Run these tests:

```javascript
// Test 1: Direct access (this WON'T work in browser)
console.log('Direct:', process.env.NEXT_PUBLIC_SUPABASE_URL)
// Expected: undefined (process.env doesn't exist in browser)

// Test 2: Check if values are inlined in bundle
// Open Network tab → Find a JS chunk → Search for "supabase"
// You should find the URL hardcoded as a string literal
```

#### Test 3: Login Flow

1. Navigate to `/login`
2. Try to sign in with test credentials
3. Check browser console for errors
4. Expected: No Supabase initialization errors

If you see: `"Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"`
- Variables were NOT set before build
- Redeploy after setting variables

---

## Troubleshooting

### Issue: "Missing required environment variable" in Browser

**Cause**: Variables were not set in Vercel BEFORE the build ran.

**Fix**:
1. Verify variables in Vercel dashboard
2. Trigger a NEW deployment (rebuilding is required)
3. Variables are inlined at BUILD TIME, not runtime

### Issue: Variables work locally but not in production

**Cause**: Local `.env.local` exists but Vercel variables don't.

**Fix**:
1. Copy values from `.env.local`
2. Add them to Vercel project settings
3. Redeploy

### Issue: Build succeeds but app fails at runtime

**Cause**: Middleware or server-side code can't access client-side code.

**Fix**: Check that server-side code uses `/lib/supabase/server.ts`, not `/lib/supabase/client.ts`

### Issue: Debug endpoint returns 403

**Cause**: `ENABLE_DEBUG_ENDPOINT` is not set to `true` in production.

**Fix**:
```bash
vercel env add ENABLE_DEBUG_ENDPOINT
# Value: true
# Environment: Production
# Redeploy
```

---

## Verification Commands

### Local Development
```bash
# Verify env vars
npm run verify-env

# Test env access
node scripts/test-env-access.js

# Build and test
npm run build && npm start
```

### Production (via Vercel CLI)
```bash
# List environment variables
vercel env ls

# Pull environment variables
vercel env pull .env.production

# Deploy to production
vercel --prod
```

---

## Code Changes Summary

### Files Modified:
1. **`/src/lib/env-runtime.ts`** (NEW) - Direct `process.env` access
2. **`/src/lib/env.ts`** - Updated to delegate to `env-runtime.ts`
3. **`/src/lib/supabase/client.ts`** - Uses `env-runtime.ts` functions
4. **`/next.config.js`** - Removed deprecated `env{}` property
5. **`/src/app/api/debug/env/route.ts`** - Updated debug endpoint

### Key Pattern:
```typescript
// OLD (didn't work in production browser)
const config = getConfig()
const url = config.supabase.url

// NEW (works everywhere)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
// OR
import { getSupabaseUrl } from '@/lib/env-runtime'
const url = getSupabaseUrl()
```

---

## Success Criteria

✅ Build completes without errors
✅ No console errors in browser
✅ Login page works
✅ Supabase client initializes successfully
✅ Debug endpoint shows "ALL TESTS PASSED"
✅ No "Missing required environment variable" errors

---

## Post-Deployment

### Disable Debug Endpoint (Security)

Once verified, remove the debug endpoint or disable it:

```bash
# Option 1: Remove ENABLE_DEBUG_ENDPOINT
vercel env rm ENABLE_DEBUG_ENDPOINT production

# Option 2: Set to false
vercel env add ENABLE_DEBUG_ENDPOINT
# Value: false
# Environment: Production

# Redeploy
vercel --prod
```

### Monitor Production

1. Check Vercel logs for runtime errors
2. Monitor Supabase dashboard for connection issues
3. Test critical flows (login, client management, etc.)

---

## Reference

- **Next.js Environment Variables**: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- **Vercel Environment Variables**: https://vercel.com/docs/projects/environment-variables
- **Supabase Next.js Guide**: https://supabase.com/docs/guides/auth/server-side/nextjs

---

**Last Updated**: 2025-10-22
**Status**: TESTED ✓ WORKING ✓
