# Security Remediation Deployment Guide
## Phase 4 & 5 Implementation - Lenkersdorfer CRM

---

## Overview

This guide covers the deployment of Phase 4 (Data Security & RLS) and Phase 5 (Configuration & Headers) security enhancements.

### Changes Summary

#### Phase 4: Data Security & RLS Enforcement
- ✅ Comprehensive audit logging system
- ✅ Explicit field selection (no SELECT *)
- ✅ Enhanced RLS policies for all tables
- ✅ Audit log utility library with fail-safe design

#### Phase 5: Configuration & Deployment Security
- ✅ Theme loader using Next.js Script component (CSP-safe)
- ✅ Business configuration externalized
- ✅ CORS headers configured
- ✅ Enhanced CSP and security headers
- ✅ Environment-based configuration

---

## Deployment Steps

### Step 1: Database Migrations

Run the new migrations in Supabase in order:

```bash
# 1. Audit logging infrastructure
supabase/migrations/20251022000002_audit_logging.sql

# 2. Enhanced RLS policies
supabase/migrations/20251022000003_enhanced_rls_policies.sql
```

**Verification:**
```sql
-- Verify audit_logs table exists
SELECT * FROM audit_logs LIMIT 1;

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('clients', 'purchases', 'waitlist', 'inventory', 'reminders', 'profiles');
-- All should show rowsecurity = true

-- Test audit logging function
SELECT log_audit_event('CREATE', 'test_table', gen_random_uuid(), NULL, '{"test": true}'::jsonb);
```

### Step 2: Environment Variables

Update your environment variables (Vercel dashboard or .env.local):

```bash
# Required (existing)
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# New (Phase 5)
ALLOWED_ORIGINS=https://your-production-url.vercel.app,https://www.your-production-url.vercel.app

# Optional override
# DEFAULT_COMMISSION_RATE=15
```

### Step 3: Code Deployment

Deploy the updated codebase:

```bash
# Build locally to verify
npm run build

# Deploy to Vercel
git add .
git commit -m "Phase 4 & 5: Security remediation - Audit logging, RLS, CSP, CORS"
git push origin main
```

### Step 4: Verification & Testing

#### 4.1 RLS Policy Testing

Test that users can only see their assigned data:

```typescript
// As User A (salesesperson)
const { data } = await supabase
  .from('clients')
  .select('*')
// Should only return clients where assigned_to = User A's ID

// As Manager/Admin
const { data } = await supabase
  .from('clients')
  .select('*')
// Should return all clients
```

#### 4.2 Audit Logging Testing

```sql
-- Check audit logs are being created
SELECT
  action,
  table_name,
  user_id,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 10;

-- View recent user activity
SELECT * FROM recent_user_activity LIMIT 10;

-- View client audit trail
SELECT * FROM client_audit_trail LIMIT 10;
```

#### 4.3 Security Headers Testing

Test with curl or browser dev tools:

```bash
# Test CORS
curl -H "Origin: https://evil.com" https://your-app.vercel.app/api/clients
# Should be blocked or return CORS error

# Test CSP headers
curl -I https://your-app.vercel.app/
# Should include Content-Security-Policy header

# Test security headers
curl -I https://your-app.vercel.app/
# Should include:
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - Strict-Transport-Security
# - Referrer-Policy
```

#### 4.4 Field Selection Testing

Verify no SELECT * in network requests:

```typescript
// Open browser DevTools > Network
// Filter by "api"
// Check response payloads - should only include necessary fields
// Previously: All fields including sensitive internal data
// Now: Only explicitly selected fields
```

#### 4.5 Business Config Testing

```typescript
// Test commission rate calculation
import { BusinessConfig } from '@/config/business'

// Should use config values
console.log(BusinessConfig.getCommissionRate('Platinum')) // 20
console.log(BusinessConfig.getDefaultCommissionRate()) // 15 or env override

// Test price tolerance
console.log(BusinessConfig.isPriceWithinTolerance(10000, 10050)) // true
console.log(BusinessConfig.isPriceWithinTolerance(10000, 10200)) // false
```

---

## Security Checklist

### Phase 4 Verification

- [ ] **Audit Logging**
  - [ ] audit_logs table created with indexes
  - [ ] Audit triggers applied to all tables
  - [ ] log_audit_event function working
  - [ ] Audit logs accumulating for operations
  - [ ] Audit views accessible (recent_user_activity, etc.)

- [ ] **RLS Enforcement**
  - [ ] All tables have RLS enabled
  - [ ] Users can only see assigned clients
  - [ ] Managers can see all data
  - [ ] Cross-user data access blocked
  - [ ] Reminders have proper RLS policies

- [ ] **Data Exposure**
  - [ ] No SELECT * in any API route
  - [ ] Client responses only include necessary fields
  - [ ] Purchase responses only include necessary fields
  - [ ] Waitlist responses only include necessary fields
  - [ ] Watch/inventory responses only include necessary fields

- [ ] **Pagination Security**
  - [ ] Max limit enforced (100) via Zod schema
  - [ ] Page numbers validated
  - [ ] No negative offsets allowed

### Phase 5 Verification

- [ ] **Theme Loader**
  - [ ] No dangerouslySetInnerHTML in layout.tsx
  - [ ] Using Next.js Script component
  - [ ] Theme loading works correctly
  - [ ] No CSP violations in console

- [ ] **Business Configuration**
  - [ ] BusinessConfig file created
  - [ ] Commission rates externalized
  - [ ] All hard-coded values moved to config
  - [ ] API routes use BusinessConfig
  - [ ] Environment overrides work

- [ ] **CORS Configuration**
  - [ ] next.config.js has CORS headers
  - [ ] ALLOWED_ORIGINS env variable set
  - [ ] Cross-origin requests blocked
  - [ ] Same-origin requests work

- [ ] **Security Headers**
  - [ ] CSP header present and correct
  - [ ] Strict-Transport-Security enabled
  - [ ] X-Frame-Options set to DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy configured
  - [ ] Permissions-Policy restrictive

---

## Rollback Procedure

If issues arise, follow this rollback process:

### 1. Code Rollback
```bash
# Revert to previous deployment
git revert HEAD
git push origin main
```

### 2. Database Rollback
```sql
-- Drop audit logging (if needed)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP FUNCTION IF EXISTS log_audit_event CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_func CASCADE;

-- Restore old reminders RLS (if needed)
-- See previous migration for policies
```

### 3. Environment Variables
```bash
# Remove new env vars from Vercel dashboard
# - ALLOWED_ORIGINS
# - DEFAULT_COMMISSION_RATE
```

---

## Performance Impact

### Expected Impact
- **Audit Logging**: <5ms overhead per write operation
- **Explicit Field Selection**: 10-20% faster queries (less data transfer)
- **RLS Policies**: <10ms overhead per query (properly indexed)
- **Security Headers**: No runtime impact (static headers)

### Monitoring
Monitor these metrics post-deployment:

```sql
-- Query performance (should improve with explicit SELECT)
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%clients%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Audit log growth (plan for retention)
SELECT
  COUNT(*) as total_logs,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
  pg_size_pretty(pg_total_relation_size('audit_logs')) as table_size
FROM audit_logs;
```

---

## Maintenance

### Audit Log Retention

Set up periodic cleanup (run monthly):

```sql
-- Clean up audit logs older than 2 years
SELECT cleanup_old_audit_logs(730);
```

Or create a scheduled job in Supabase:

```sql
-- Create a cron job (requires pg_cron extension)
SELECT cron.schedule(
  'cleanup-old-audit-logs',
  '0 0 1 * *', -- First day of month at midnight
  'SELECT cleanup_old_audit_logs(730);'
);
```

### Security Header Updates

Review and update CSP headers quarterly as browser capabilities change.

### Business Config Updates

Update commission rates and thresholds via environment variables without code changes:

```bash
# Vercel dashboard > Settings > Environment Variables
DEFAULT_COMMISSION_RATE=18
```

---

## Troubleshooting

### Issue: RLS policies blocking legitimate access

**Symptoms:** Users can't see their data, queries return empty

**Solution:**
```sql
-- Check user's profile and role
SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- Check client assignments
SELECT id, name, assigned_to FROM clients WHERE assigned_to = auth.uid();

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'clients';
```

### Issue: Audit logging not working

**Symptoms:** audit_logs table empty after operations

**Solution:**
```sql
-- Test function directly
SELECT log_audit_event('CREATE', 'test', gen_random_uuid());

-- Check triggers
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%audit%';

-- Check for errors in logs
SELECT * FROM pg_stat_statements WHERE query LIKE '%audit%';
```

### Issue: CSP violations in browser

**Symptoms:** Console errors about blocked scripts/styles

**Solution:**
- Check browser console for specific violations
- Update CSP header in vercel.json to allow necessary sources
- Ensure Script component has proper strategy
- Verify no inline scripts without proper nonce

### Issue: CORS errors

**Symptoms:** API calls blocked from certain origins

**Solution:**
```bash
# Verify ALLOWED_ORIGINS env variable
echo $ALLOWED_ORIGINS

# Update to include missing origin
ALLOWED_ORIGINS=https://app.com,https://new-origin.com

# Redeploy
```

---

## Support & Documentation

- **Supabase RLS Docs**: https://supabase.com/docs/guides/auth/row-level-security
- **Next.js Security**: https://nextjs.org/docs/advanced-features/security-headers
- **CSP Reference**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

## Sign-Off

Once all checklist items are verified:

- [ ] Database migrations applied successfully
- [ ] RLS policies tested and working
- [ ] Audit logging verified
- [ ] Security headers confirmed
- [ ] No CSP violations
- [ ] Performance metrics acceptable
- [ ] Rollback procedure documented

**Deployed by:** _________________
**Date:** _________________
**Version:** Phase 4 & 5 - Security Remediation
**Status:** ✅ Complete
