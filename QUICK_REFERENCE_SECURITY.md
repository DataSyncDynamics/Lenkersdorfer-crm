# Security Implementation - Quick Reference Card
## Lenkersdorfer CRM - Phase 4 & 5

---

## 🚀 Quick Start

### Deploy Checklist
```bash
# 1. Database migrations (Supabase dashboard)
Run: 20251022000002_audit_logging.sql
Run: 20251022000003_enhanced_rls_policies.sql

# 2. Environment variables (Vercel)
ALLOWED_ORIGINS=https://your-app.vercel.app

# 3. Deploy code
git push origin main

# 4. Verify
Check audit_logs table
Test RLS with different users
Check browser console for CSP errors
```

---

## 📝 Audit Logging

### Log an Event (Manual)
```typescript
import { logClientCreated, logAuditEvent } from '@/lib/audit-log'

// Automatic (via request context)
await logClientCreated(request, clientId, clientData)

// Manual (custom event)
await logAuditEvent({
  action: 'EXPORT',
  tableName: 'clients',
  recordId: 'xxx',
  ipAddress: getClientIP(request),
  userAgent: getUserAgent(request)
})
```

### Query Audit Logs
```sql
-- Recent activity
SELECT * FROM recent_user_activity LIMIT 20;

-- Client changes
SELECT * FROM client_audit_trail WHERE client_id = 'xxx';

-- All logs
SELECT action, table_name, user_id, created_at
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🔒 RLS Policies

### Test RLS
```typescript
// As salesperson - should only see assigned clients
const { data } = await supabase
  .from('clients')
  .select('*')

// As manager - should see all clients
const { data } = await supabase
  .from('clients')
  .select('*')
```

### RLS Rules
| Role | Clients | Purchases | Inventory |
|------|---------|-----------|-----------|
| Salesperson | Assigned only | Own clients only | Read all |
| Manager | All | All | Read + Write |
| Admin | All | All | All |

---

## 💼 Business Configuration

### Use Config Values
```typescript
import { BusinessConfig } from '@/config/business'

// Commission rates
const rate = BusinessConfig.getCommissionRate('Platinum') // 20%
const defaultRate = BusinessConfig.getDefaultCommissionRate() // 15%

// Calculate VIP tier
const tier = BusinessConfig.calculateVipTier(75000) // 'Gold'

// Validate price
const valid = BusinessConfig.isPriceWithinTolerance(10000, 10050) // true

// Priority score
const score = BusinessConfig.calculatePriorityScore({
  lifetimeSpend: 50000,
  daysWaiting: 30,
  recentActivity: 80,
  vipTier: 'Gold'
})
```

### Config Values
```typescript
CommissionRates.platinum = 20%
CommissionRates.gold = 18%
CommissionRates.silver = 16%
CommissionRates.bronze = 15%

VipTierThresholds.platinum = $100,000
VipTierThresholds.gold = $50,000
VipTierThresholds.silver = $25,000

BusinessRules.maxPageSize = 100
BusinessRules.purchasePriceTolerance = $100
BusinessRules.maxImportsPerHour = 5
```

---

## 🛡️ API Best Practices

### Explicit Field Selection
```typescript
// ❌ NEVER do this
.select('*')

// ✅ ALWAYS do this
.select('id, name, email, vip_tier, lifetime_spend')

// ✅ With joins
.select(`
  id, name, email,
  purchases:purchases(id, price, date),
  waitlist:waitlist(id, priority_score)
`)
```

### Audit Logging Pattern
```typescript
export async function POST(request: NextRequest) {
  // ... auth check ...

  // Create record
  const { data } = await supabase.from('clients').insert(...)

  // Log it (fail-safe, won't throw)
  await logClientCreated(request, data.id, data)

  return NextResponse.json(data)
}
```

### Rate Limiting
```typescript
// Already implemented on all routes
const rateLimitResult = await rateLimit(request, limit, options)
if (!rateLimitResult.success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

---

## 🔍 Debugging

### Check RLS Issues
```sql
-- See which policies apply
SELECT * FROM pg_policies WHERE tablename = 'clients';

-- Check user's role
SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- Check assignments
SELECT id, name, assigned_to FROM clients WHERE assigned_to = auth.uid();
```

### Check Audit Logs
```sql
-- Is logging working?
SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 hour';

-- Any errors?
SELECT * FROM pg_stat_statements WHERE query LIKE '%audit%' AND calls = 0;

-- Triggers active?
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%audit%' AND tgenabled = 'O';
```

### Check Security Headers
```bash
# Test CORS
curl -H "Origin: https://evil.com" https://your-app.com/api/clients

# Check headers
curl -I https://your-app.com/

# Expected headers:
# - Content-Security-Policy
# - X-Frame-Options: DENY
# - Strict-Transport-Security
```

---

## ⚡ Performance

### Query Optimization
```typescript
// ❌ Slow - fetches all fields
const clients = await supabase.from('clients').select('*')

// ✅ Fast - only needed fields (10-20% faster)
const clients = await supabase.from('clients').select('id, name, email')
```

### Pagination
```typescript
// ✅ Always paginate large queries
.select('id, name')
.range(offset, offset + limit - 1) // Max 100
```

### Audit Log Cleanup
```sql
-- Run monthly (scheduled job)
SELECT cleanup_old_audit_logs(730); -- Keep 2 years
```

---

## 🚨 Common Issues

### "Can't see my clients"
**Cause:** RLS blocking access
**Fix:** Check `assigned_to` field matches your user ID

### "Audit logs not appearing"
**Cause:** Trigger not firing or function error
**Fix:** Check pg_stat_statements for errors, verify triggers enabled

### "CSP violation in console"
**Cause:** Inline script or disallowed source
**Fix:** Use Next.js Script component, check CSP policy in vercel.json

### "CORS error"
**Cause:** Origin not in ALLOWED_ORIGINS
**Fix:** Add origin to ALLOWED_ORIGINS env variable

---

## 📊 Monitoring

### Key Metrics
```sql
-- Audit log growth
SELECT
  COUNT(*) as total,
  pg_size_pretty(pg_total_relation_size('audit_logs')) as size
FROM audit_logs;

-- Query performance
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE query LIKE '%clients%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- RLS overhead
SELECT
  schemaname,
  tablename,
  seq_scan,
  idx_scan
FROM pg_stat_user_tables
WHERE tablename IN ('clients', 'purchases');
```

---

## 🔧 Maintenance

### Weekly
- [ ] Review audit_logs for anomalies
- [ ] Check RLS policy performance

### Monthly
- [ ] Run audit log cleanup
- [ ] Review security headers
- [ ] Update CSP if needed

### Quarterly
- [ ] Audit commission rates
- [ ] Review business rules
- [ ] Security header audit
- [ ] RLS policy review

---

## 📞 Support

### Documentation
- `SECURITY_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `PHASE_4_5_SUMMARY.md` - Complete implementation summary
- `SECURITY_REMEDIATION_PLAN.md` - Original security audit

### Key Files
- `/src/lib/audit-log.ts` - Audit utilities
- `/src/config/business.ts` - Business config
- `/supabase/migrations/20251022000002_*.sql` - Audit system
- `/supabase/migrations/20251022000003_*.sql` - RLS policies

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (server only!)
ALLOWED_ORIGINS=https://prod.com,https://www.prod.com
DEFAULT_COMMISSION_RATE=15 (optional)
```

---

## ✅ Pre-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Code deployed to staging
- [ ] RLS tested with different roles
- [ ] Audit logs accumulating
- [ ] No CSP violations in console
- [ ] CORS tested
- [ ] Performance acceptable
- [ ] Rollback plan documented

---

**Version:** Phase 4 & 5 Complete
**Last Updated:** October 22, 2025
**Status:** ✅ Production Ready
