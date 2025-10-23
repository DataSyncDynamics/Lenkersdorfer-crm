# Quick Deploy Guide - Environment Variable Fix

## URGENT: Deploy to Production NOW

### 1. Verify Vercel Has Environment Variables

```bash
vercel env ls
```

**Must have** (for Production, Preview, Development):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. If Missing, Add Them:

```bash
# Add Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://zqstpmfatjatnvodiaey.supabase.co
# Select: Production, Preview, Development

# Add Supabase Anon Key
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxc3RwbWZhdGphdG52b2RpYWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzUyMTYsImV4cCI6MjA3NjMxMTIxNn0.zkYP2qBo-nqv0Mc_OaSBlHVpT4cqDLl10LUiK8AbztA
# Select: Production, Preview, Development
```

### 3. Deploy

```bash
# Commit the fix
git add .
git commit -m "fix: Environment variables now accessible in browser (production)"
git push origin main

# OR deploy directly
vercel --prod
```

### 4. Verify It Works

**Wait 2-3 minutes for build**, then:

1. Open: `https://your-app.vercel.app/login`
2. Check browser console (F12)
3. Should see NO errors about missing environment variables

### 5. If Still Broken

Enable debug endpoint:
```bash
vercel env add ENABLE_DEBUG_ENDPOINT
# Value: true
# Environment: Production
```

Redeploy, then check:
```bash
curl https://your-app.vercel.app/api/debug/env
```

Should return: `"verdict": "ALL TESTS PASSED"`

---

## What Changed?

**Before**: Used `next.config.js env{}` property (deprecated, doesn't work)
**After**: Direct `process.env.VARIABLE_NAME` access (gets inlined at build time)

**Key Files**:
- `/src/lib/env-runtime.ts` - NEW: Direct environment variable access
- `/src/lib/supabase/client.ts` - Updated to use `env-runtime.ts`
- `/next.config.js` - Removed deprecated `env{}` property

**Why It Works Now**:
Next.js webpack replaces `process.env.NEXT_PUBLIC_*` with string literals during build. This ONLY works with direct access, not dynamic getters.

---

## Demo Tonight?

**5-Minute Deployment**:
1. `vercel env ls` (verify variables exist)
2. `vercel --prod` (deploy)
3. Wait for build (2-3 min)
4. Test login page
5. DONE

**Variables MUST be set BEFORE build runs!**

---

## Rollback (If Needed)

```bash
# Revert to previous deployment
vercel rollback
```

---

**Status**: READY FOR PRODUCTION ✓
**Risk**: LOW - All changes are backward compatible
**Test Coverage**: Local build tested ✓, Variables inlined in bundle ✓
