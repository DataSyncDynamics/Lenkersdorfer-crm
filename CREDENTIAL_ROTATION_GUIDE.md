# URGENT: Supabase Credential Rotation Guide

## Why This Is Critical

Your Supabase credentials were exposed in git history (commit: 23739fce12c29ea9a955bd1abc9fdc094ad76af0 on October 17, 2025). Anyone with access to your repository history can see:
- `NEXT_PUBLIC_SUPABASE_URL`: https://zqstpmfatjatnvodiaey.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: eyJhbGci...

This means unauthorized users could potentially access your database.

---

## Step-by-Step Rotation Process

### Step 1: Access Supabase Dashboard

1. Go to: https://app.supabase.com/
2. Log in with your account
3. Select the "lenkersdorfer-crm" project
4. Click "Settings" (gear icon in the left sidebar)
5. Click "API" in the settings menu

---

### Step 2: Rotate the Anonymous Key

**Current Exposed Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpxc3RwbWZhdGphdG52b2RpYWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzUyMTYsImV4cCI6MjA3NjMxMTIxNn0.zkYP2qBo-nqv0Mc_OaSBlHVpT4cqDLl10LUiK8AbztA
```

**To Rotate:**
1. In the API settings page, find "Project API keys"
2. Locate "anon" key (also called "public")
3. Click the "Regenerate key" button
4. Confirm the regeneration
5. **IMPORTANT:** Copy the new key immediately (you'll need it in Step 4)

⚠️ **Note:** The old key will be invalidated instantly. The app will stop working until you update the credentials.

---

### Step 3: Rotate the Service Role Key (Best Practice)

While the service role key may not have been exposed in the same way, it's best practice to rotate it as well.

**To Rotate:**
1. In the same API settings page
2. Find "service_role" key
3. Click "Regenerate key"
4. Confirm the regeneration
5. **IMPORTANT:** Copy the new key immediately

---

### Step 4: Update Local Environment File

1. Open `/Users/dre/lenkersdorfer-crm/.env.local` in your editor
2. Replace the old keys with the new keys:

```bash
# BEFORE (OLD - COMPROMISED):
NEXT_PUBLIC_SUPABASE_URL=https://zqstpmfatjatnvodiaey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...OLD_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=old_service_key_here

# AFTER (NEW - SECURE):
NEXT_PUBLIC_SUPABASE_URL=https://zqstpmfatjatnvodiaey.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key_here
```

3. Save the file

---

### Step 5: Update Vercel Environment Variables

1. Go to: https://vercel.com/
2. Navigate to your project
3. Click "Settings"
4. Click "Environment Variables"
5. Find each of these variables and click "Edit":
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

6. Update each one with the new values
7. **IMPORTANT:** Set them for all environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

8. Click "Save" for each variable

---

### Step 6: Redeploy on Vercel

After updating environment variables:

1. In Vercel, go to "Deployments" tab
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete
4. Test the live site to ensure it works with new credentials

---

### Step 7: Test Locally

1. In your terminal, navigate to the project:
```bash
cd /Users/dre/lenkersdorfer-crm
```

2. Restart your development server:
```bash
npm run dev
```

3. Test the following:
   - Can you load the homepage?
   - Can you view client data?
   - Can you perform database operations?

---

### Step 8: Clean Git History (Optional but Recommended)

Since the credentials were committed to git history, consider these options:

#### Option A: If Repository Is Private and Not Shared
- The exposure risk is lower
- Keep monitoring for suspicious activity
- Ensure the rotated credentials are never committed

#### Option B: If Repository Is Public or Shared Widely
- Consider using git-filter-branch or BFG Repo-Cleaner to remove sensitive data
- Force push the cleaned history
- **WARNING:** This rewrites history and affects all collaborators
- Documentation: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

#### Recommended Approach for This Project:
Since you've already rotated the credentials, and the repository appears to be private:
1. Keep the history as-is
2. The old credentials are now invalid
3. Focus on preventing future exposures
4. Monitor Supabase logs for unusual activity

---

## Verification Checklist

After completing all steps, verify:

- [ ] New anon key generated in Supabase
- [ ] New service role key generated in Supabase
- [ ] `.env.local` updated with new keys
- [ ] Vercel environment variables updated (all 3 environments)
- [ ] Vercel redeployed successfully
- [ ] Local development server works with new keys
- [ ] Production site works with new keys
- [ ] Can authenticate and access data
- [ ] Import functions work (if you're a manager/admin)

---

## Monitoring After Rotation

For the next 24-48 hours, monitor:

### Supabase Dashboard:
1. Go to "Logs" in Supabase
2. Check "Database" logs for:
   - Failed authentication attempts
   - Unusual query patterns
   - Access from unexpected IP addresses

### Application Behavior:
- Watch for unexpected errors
- Monitor for unauthorized access attempts
- Check that all features work correctly

---

## If You Encounter Issues

### Issue: "Invalid API key" errors
**Solution:**
- Double-check you copied the complete key (they're long!)
- Ensure no extra spaces before/after the key
- Verify the key is set in all environments (Vercel)

### Issue: Vercel deployment fails
**Solution:**
- Check Vercel build logs
- Ensure all 3 environment variables are set
- Try redeploying again

### Issue: Local development server fails
**Solution:**
- Restart the dev server
- Clear Next.js cache: `rm -rf .next`
- Run `npm run dev` again

---

## Prevention for the Future

### Best Practices:
1. ✅ Never commit `.env.local` to git (it's already in `.gitignore`)
2. ✅ Use `.env.example` for templates only
3. ✅ Never hardcode credentials in source files
4. ✅ Use environment variables in Vercel dashboard
5. ✅ Regularly rotate credentials (every 90 days)
6. ✅ Use different credentials for development vs production

### Pre-Commit Checklist:
Before committing code, always check:
- [ ] `git status` shows no `.env*` files (except `.env.example`)
- [ ] No hardcoded URLs or keys in code
- [ ] `vercel.json` contains no secrets

---

## Timeline

**Exposure Date:** October 17, 2025 (commit 23739fce)
**Discovery Date:** October 22, 2025 (today)
**Days Exposed:** 5 days

**Priority:** CRITICAL - Rotate credentials within 24 hours

---

## Questions?

If you need help with credential rotation:
1. Check Supabase documentation: https://supabase.com/docs/guides/api
2. Review this guide again
3. Contact Supabase support if keys aren't regenerating

---

## Summary

**What Happened:**
- Supabase credentials were accidentally committed to git history
- The exposure was detected during Phase 1 security remediation
- Old credentials must be rotated to prevent unauthorized access

**What To Do:**
1. Rotate credentials in Supabase (Steps 2-3)
2. Update local `.env.local` file (Step 4)
3. Update Vercel environment variables (Step 5)
4. Redeploy and test (Steps 6-7)
5. Monitor for 24-48 hours (Monitoring section)

**Time Required:** 15-20 minutes

**Downtime:** 1-2 minutes while redeploying Vercel

---

**Document Created:** October 22, 2025
**Priority:** CRITICAL - Action Required Within 24 Hours
