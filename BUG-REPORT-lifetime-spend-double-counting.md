# BUG REPORT: lifetime_spend Double-Counting

**Date Discovered:** 2025-10-18
**Severity:** HIGH - Data Integrity Issue
**Status:** FIXED

---

## Summary

The CSV import functionality was double-counting purchase amounts in the `lifetime_spend` field, resulting in inflated client spending totals.

**Example:** Manjula Udumala had 4 purchases totaling $87,050, but database showed `lifetime_spend = $174,100` (exactly double).

---

## Root Cause

There is a database trigger `trigger_update_client_lifetime_spend` (defined in `supabase/migrations/20241201000002_business_logic_functions.sql`) that automatically increments `lifetime_spend` when a purchase is inserted:

```sql
CREATE OR REPLACE FUNCTION update_client_lifetime_spend()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE clients
        SET lifetime_spend = lifetime_spend + NEW.price  -- ⚠️ ADDS to existing value
        WHERE id = NEW.client_id;
        RETURN NEW;
    ...
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_lifetime_spend
    AFTER INSERT OR DELETE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_client_lifetime_spend();
```

### The Bug Flow

When importing clients via CSV (`/api/clients/batch-import`):

1. **Client Insert**: Batch-import created client with `lifetime_spend = 87050` (sum of all purchases from CSV)
2. **Purchase 1 Insert**: Database trigger fires → `lifetime_spend = 87050 + 7950 = 95000` ❌
3. **Purchase 2 Insert**: Database trigger fires → `lifetime_spend = 95000 + 11100 = 106100` ❌
4. **Purchase 3 Insert**: Database trigger fires → `lifetime_spend = 106100 + 34000 = 140100` ❌
5. **Purchase 4 Insert**: Database trigger fires → `lifetime_spend = 140100 + 34000 = 174100` ❌

**Result:** Every purchase was counted TWICE - once during client creation, once via trigger.

---

## Affected Code

**File:** `/Users/dre/lenkersdorfer-crm/src/app/api/clients/batch-import/route.ts`

**Before (BUGGY):**
```typescript
const clientData = {
  name: client.name,
  email: client.email,
  phone: client.phone || null,
  vip_tier: client.vipTier,
  lifetime_spend: client.lifetimeSpend || 0,  // ❌ PRE-CALCULATED SUM
  notes: client.notes || null,
  preferred_brands: client.preferredBrands || []
}
```

**After (FIXED):**
```typescript
const clientData = {
  name: client.name,
  email: client.email,
  phone: client.phone || null,
  vip_tier: client.vipTier,
  lifetime_spend: 0,  // ✅ Let database trigger calculate from purchases
  notes: client.notes || null,
  preferred_brands: client.preferredBrands || []
}
```

---

## The Fix

Changed `lifetime_spend` to always be `0` on client creation during batch import. The database trigger will automatically calculate the correct sum as each purchase is inserted.

### Why This Works

- Client created with `lifetime_spend = 0`
- Purchase 1 inserted → Trigger fires → `lifetime_spend = 0 + 7950 = 7950` ✅
- Purchase 2 inserted → Trigger fires → `lifetime_spend = 7950 + 11100 = 19050` ✅
- Purchase 3 inserted → Trigger fires → `lifetime_spend = 19050 + 34000 = 53050` ✅
- Purchase 4 inserted → Trigger fires → `lifetime_spend = 53050 + 34000 = 87050` ✅

**Result:** Correct total of $87,050

---

## Verification

Tested with Manjula Udumala's data:

**Before Fix:**
```
Database lifetime_spend: $174,100
Sum of purchases:        $87,050
Difference:              $87,050 ❌
```

**After Fix (Expected):**
```
Database lifetime_spend: $87,050
Sum of purchases:        $87,050
Difference:              $0 ✅
```

---

## How to Recognize This Bug

**Symptoms:**
- `lifetime_spend` in database is approximately 2x the sum of all purchase prices
- VIP tiers are inflated (clients appear higher tier than they should be)
- Revenue analytics show inflated totals

**Quick Check:**
```sql
SELECT
  c.name,
  c.lifetime_spend as db_lifetime_spend,
  COALESCE(SUM(p.price), 0) as sum_of_purchases,
  c.lifetime_spend - COALESCE(SUM(p.price), 0) as difference
FROM clients c
LEFT JOIN purchases p ON p.client_id = c.id
GROUP BY c.id, c.name, c.lifetime_spend
HAVING c.lifetime_spend - COALESCE(SUM(p.price), 0) > 0.01
ORDER BY difference DESC;
```

If this query returns results, `lifetime_spend` values are incorrect.

---

## Prevention

**For Future Imports:**
- Always set `lifetime_spend = 0` when creating clients with purchases
- Let database triggers handle the calculation
- Never pre-calculate `lifetime_spend` when batch-importing with purchases

**For New Features:**
- Be aware of database triggers when inserting related data
- Check migration files for automatic calculations before implementing manual calculations
- Test with real data to catch trigger interactions

---

## Related Files

- `/src/app/api/clients/batch-import/route.ts` - Fixed batch import endpoint
- `/src/app/api/import/lenkersdorfer/route.ts` - CSV parsing endpoint (calls batch-import)
- `/supabase/migrations/20241201000002_business_logic_functions.sql` - Database trigger definition

---

## Resolution

✅ Fixed in commit: [Current Session]
✅ All incorrectly imported clients deleted and cleaned up
✅ Ready for re-import with correct values
✅ Bug documented for future reference
