# Bug Tracking Log - Lenkersdorfer CRM

This file tracks all bugs discovered during development, their root causes, and solutions implemented.

---

## Bug #001: Allocation Logic Showing Non-Waitlist Clients for Waitlist Watches

**Date Discovered:** 2025-10-04
**Severity:** Critical
**Status:** ✅ Fixed

### Description
When selecting a watch with availability status "Waitlist" in the Smart Allocation page, the system was incorrectly showing clients who were NOT on the waitlist for that specific watch. This resulted in nonsensical recommendations like suggesting a $9,500 Rolex Explorer to a client with only $10,653 lifetime spend who wasn't even waiting for it.

### Root Cause
The allocation logic in `src/lib/stores/allocationStore.ts` had a flawed conditional:

```typescript
// BUGGY CODE:
if (showAllClients || watch.availability === 'Available') {
  // Show all clients
} else {
  // Show only waitlist
}
```

**The Problem:** This logic uses an OR condition, meaning if `showAllClients` was `true` (even from toggling on a previous available watch), it would show ALL clients regardless of the watch's availability status.

### Impact
- Salespeople received incorrect allocation recommendations
- System suggested watches to clients who weren't interested
- Confused the purpose of waitlist vs. available inventory
- Undermined trust in the GREEN BOX matching system

### Solution
Restructured the conditional to check `watch.availability` FIRST, then apply user preferences:

```typescript
// FIXED CODE:
if (watch.availability === 'Available') {
  if (showAllClients) {
    // User choice: show all clients
  } else {
    // User choice: show only waitlist clients
  }
} else {
  // For Waitlist/Sold Out: ALWAYS show only waitlist clients
  // IGNORE showAllClients flag completely
}
```

### Files Modified
- `src/lib/stores/allocationStore.ts` (lines 139-165)

### Prevention Strategy
1. Always check resource availability/status BEFORE applying user preferences
2. For restricted resources (waitlist, sold out), ignore user toggles that could bypass restrictions
3. Add explicit comments explaining business logic constraints
4. Test both available and unavailable watches when implementing allocation features

### Test Cases to Verify Fix
- [ ] Select an "Available" watch → Should see all clients by default OR toggle option
- [ ] Select a "Waitlist" watch → Should ONLY see clients on waitlist, no toggle option
- [ ] Toggle "All Clients" on available watch, then switch to waitlist watch → Should reset to waitlist-only view
- [ ] Verify "On Waitlist" badge appears correctly for waitlist clients
- [ ] Verify "Not on waitlist" text appears only for available watches when showing all clients

---

## Bug Template

```markdown
## Bug #XXX: [Brief Title]

**Date Discovered:** YYYY-MM-DD
**Severity:** [Critical/High/Medium/Low]
**Status:** [Open/In Progress/Fixed/Won't Fix]

### Description
[Clear description of the bug and how it manifests]

### Root Cause
[Technical explanation of what caused the bug]

### Impact
[How this affects users/business]

### Solution
[How it was fixed, with code examples if relevant]

### Files Modified
[List of files changed]

### Prevention Strategy
[How to avoid this type of bug in the future]

### Test Cases to Verify Fix
[Checklist of tests to confirm the fix works]
```

---

## Bug #002: Critical Function Parameter Mismatch in allocateWatchToClient

**Date Discovered:** 2025-10-04
**Severity:** Critical
**Status:** Open

### Description
The `allocateWatchToClient` function in `allocationStore.ts` calls `removeFromWaitlist()` with the wrong parameter. It passes `allocation.watchModelId` (the watch ID) when the function expects `entryId` (the waitlist entry ID). This causes the waitlist entry to never be removed when a watch is allocated to a client, leading to duplicate allocations and data corruption.

### Root Cause
Function signature mismatch in `src/lib/stores/allocationStore.ts` line 257:

```typescript
// BUGGY CODE (line 257):
get().removeFromWaitlist(allocation.watchModelId)  // ❌ WRONG: passes watch ID

// But removeFromWaitlist expects:
removeFromWaitlist: (entryId: string) => void  // Expects waitlist entry ID
```

The function should pass the waitlist entry ID that links this specific client to this specific watch, not just the watch ID.

### Impact
- **Critical data integrity issue:** Clients remain on waitlist after allocation
- Same watch can be allocated multiple times to different clients
- Waitlist never gets cleaned up, showing stale data
- GREEN BOX system shows incorrect match counts
- Salespeople may contact the same client multiple times about the same watch

### Solution
Find the actual waitlist entry ID before removing:

```typescript
// FIXED CODE:
const waitlistEntry = get().waitlist.find(
  entry => entry.clientId === allocation.clientId && entry.watchModelId === allocation.watchModelId
)
if (waitlistEntry) {
  get().removeFromWaitlist(waitlistEntry.id)
}
```

### Files Modified
- `src/lib/stores/allocationStore.ts` (line 257)

### Prevention Strategy
1. Use TypeScript strict mode to catch type mismatches
2. Add JSDoc comments documenting expected parameter types
3. Create integration tests for allocation workflow
4. Validate that waitlist entries are actually removed after allocation

### Test Cases to Verify Fix
- [ ] Allocate a watch to a client → Verify client is removed from waitlist for that specific watch
- [ ] Allocate same watch to multiple clients → Verify each is removed individually
- [ ] Check waitlist count before and after allocation → Should decrease by 1
- [ ] Verify allocation.id !== waitlistEntry.id (they are different IDs)

---

## Bug #003: Division by Zero Risk in Client Tier Calculations

**Date Discovered:** 2025-10-04
**Severity:** High
**Status:** Open

### Description
Multiple tier calculation functions perform division without checking for zero values. When clients have no purchase history (`purchases.length === 0`) or when calculating average order values with zero clients, the system can produce `Infinity`, `NaN`, or incorrect tier assignments.

### Root Cause
Missing zero-checks before division in multiple locations:

**Location 1:** `src/lib/stores/clientStore.ts` line 72-73
```typescript
// BUGGY CODE:
const rank = spends.findIndex(spend => spend === client.lifetimeSpend) + 1
const percentile = Math.round(((spends.length - rank + 1) / spends.length) * 100)
// If spends.length === 0, this produces NaN
```

**Location 2:** `src/components/analytics/AnalyticsDashboard.tsx` line 44
```typescript
// BUGGY CODE:
const avgOrderValue = totalSales / totalClients || 0
// Uses || 0 fallback, but totalSales / 0 = Infinity, which is truthy
```

**Location 3:** `src/app/page.tsx` line 381
```typescript
// BUGGY CODE:
const avgOrderValue = totalRevenue / activeClients || 0
// Same issue: Infinity || 0 = Infinity
```

### Impact
- **Incorrect tier assignments** for new clients with no purchase history
- **Dashboard displays "Infinity"** or "NaN" for average order values when no clients exist
- **Analytics breakdown** if client database is empty or just imported
- **Financial calculations become unreliable** for business reporting

### Solution
Add explicit zero-checks before all division operations:

```typescript
// FIXED CODE (clientStore.ts):
const percentile = spends.length > 0
  ? Math.round(((spends.length - rank + 1) / spends.length) * 100)
  : 0

// FIXED CODE (analytics):
const avgOrderValue = totalClients > 0 ? totalSales / totalClients : 0
const avgOrderValue = activeClients > 0 ? totalRevenue / activeClients : 0
```

### Files Modified
- `src/lib/stores/clientStore.ts` (line 73)
- `src/components/analytics/AnalyticsDashboard.tsx` (line 44)
- `src/app/page.tsx` (line 381)

### Prevention Strategy
1. Add linting rule to detect division operations without zero-checks
2. Create helper function `safeDivide(a, b, fallback = 0)` for reuse
3. Add unit tests for edge cases (empty arrays, zero values)
4. Review all financial calculation code for similar issues

### Test Cases to Verify Fix
- [ ] Import empty CSV → Dashboard should show $0 avg order value, not Infinity
- [ ] Create client with zero purchases → Tier calculation should not crash
- [ ] Delete all clients → Analytics should gracefully show zeros
- [ ] Client with $0 lifetime spend → Should assign to Tier 5 correctly

---

## Bug #004: Unimplemented API Call in Add Client Form

**Date Discovered:** 2025-10-04
**Severity:** High
**Status:** Open

### Description
The "Add Client" form at `/clients/add` has a TODO comment indicating the API call is not implemented. When users submit the form, it only logs to console and manipulates localStorage, but never actually creates the client in the system. This is a critical gap in functionality.

### Root Cause
`src/app/clients/add/page.tsx` line 148-149:

```typescript
// BUGGY CODE:
// TODO: Implement actual API call
console.log('Creating client:', clientData)
```

The form collects all client data correctly but never sends it to the Zustand store or any backend API.

### Impact
- **Form appears broken** - users fill it out but nothing happens
- **Lost client data** - all entered information is discarded
- **No new clients can be added** through the UI
- **localStorage draft is never cleared** for successful submissions
- **Navigation occurs without confirmation** that data was saved

### Solution
Integrate with the existing Zustand store's `addClient` function:

```typescript
// FIXED CODE:
import { useAppStore } from '@/lib/store'

const { addClient } = useAppStore()

const handleSubmit = async (action: 'save' | 'call' | 'schedule' | 'continue') => {
  if (!formData.name.trim() || !formData.phone.trim()) {
    alert('Name and phone are required')
    return
  }

  setIsSubmitting(true)
  try {
    // Create client using store
    const newClientId = addClient({
      name: formData.name.trim(),
      email: formData.email.trim() || 'unknown@example.com',
      phone: formData.phone.trim(),
      preferredBrands: formData.interests,
      notes: [
        formData.notes,
        formData.budget > 0 ? `Estimated Budget: $${formData.budget.toLocaleString()}` : '',
        formData.source ? `Source: ${formData.source}` : ''
      ].filter(Boolean).join('\n')
    })

    // Clear draft
    localStorage.removeItem('draft-client')

    // Handle different actions with the new client ID
    switch (action) {
      case 'call':
        router.push(`/clients/${newClientId}?action=call`)
        break
      case 'schedule':
        router.push(`/clients/${newClientId}?action=schedule`)
        break
      case 'continue':
        // Reset form
        setFormData({ name: '', phone: '', email: '', interests: [], budget: 0, source: '', notes: '' })
        break
      default:
        router.push('/clients')
    }
  } catch (error) {
    console.error('Error creating client:', error)
    setSaveStatus('error')
    alert('Failed to create client. Please try again.')
  } finally {
    setIsSubmitting(false)
  }
}
```

### Files Modified
- `src/app/clients/add/page.tsx` (lines 148-178)

### Prevention Strategy
1. **Never commit TODO comments in production** - use issue tracking instead
2. Add integration tests for all form submissions
3. Review all pages for unimplemented API calls before deployment
4. Add error boundaries to catch submission failures
5. Show visual confirmation when clients are successfully created

### Test Cases to Verify Fix
- [ ] Submit form with valid data → Client appears in client list
- [ ] Click "Save & Call" → Redirects to client detail page with call modal
- [ ] Click "Save & Add Another" → Form clears, new client is saved
- [ ] Submit with missing required fields → Shows validation error
- [ ] Check localStorage draft is cleared after successful submission

---

## Bug #005: Debugging Console.log Statements Left in Production Code

**Date Discovered:** 2025-10-04
**Severity:** Medium
**Status:** Open

### Description
There are 20+ `console.log`, `console.warn`, and `console.error` statements scattered throughout the codebase that were left from debugging. These clutter the browser console, expose internal logic, and can cause performance issues in production.

### Root Cause
Debugging statements were not removed before deployment:

**Import API Route** (`src/app/api/import/lenkersdorfer/route.ts`):
- Lines 113, 126, 163, 165, 169, 211, 259, 282, 400: CSV parsing debug logs

**Pages & Components:**
- `src/app/page.tsx`: Lines 275, 342, 345, 370, 596, 712, 722, 726
- `src/app/notifications/page.tsx`: Line 84
- `src/app/clients/add/page.tsx`: Lines 90, 149
- `src/app/clients/[id]/page.tsx`: Line 179
- `src/app/import/page.tsx`: Line 102
- `src/components/notifications/UrgentNotificationDashboard.tsx`: Line 101
- `src/components/notifications/NotificationFAB.tsx`: Line 70

### Impact
- **Performance degradation:** Console operations are expensive in loops
- **Security concern:** Exposes internal data structures and business logic
- **Poor user experience:** Cluttered console makes real errors hard to find
- **Unprofessional appearance:** Debug output visible to end users
- **Memory leaks:** Console keeps references to logged objects

### Solution
1. **Remove all console.log statements** from production code
2. **Replace console.error with proper error handling:**

```typescript
// BEFORE:
console.error('Upload error:', err)

// AFTER:
import { logger } from '@/lib/logger'
logger.error('Upload error', { error: err, context: 'CSV Import' })

// Or use error boundary/toast notification for user-facing errors
showErrorToast('Failed to upload file. Please try again.')
```

3. **For important debugging, use conditional logging:**

```typescript
// FIXED CODE:
if (process.env.NODE_ENV === 'development') {
  console.log('CSV Headers detected:', headers)
}
```

### Files Modified
- `src/app/api/import/lenkersdorfer/route.ts` (remove 10 console statements)
- `src/app/page.tsx` (remove 8 console statements)
- `src/app/notifications/page.tsx` (remove 1 console statement)
- `src/app/clients/add/page.tsx` (remove 2 console statements)
- `src/app/clients/[id]/page.tsx` (remove 1 console statement)
- `src/app/import/page.tsx` (remove 1 console statement)
- `src/components/notifications/UrgentNotificationDashboard.tsx` (remove 1 console statement)
- `src/components/notifications/NotificationFAB.tsx` (remove 1 console statement)

### Prevention Strategy
1. Add ESLint rule to ban console statements: `"no-console": ["error", { allow: ["warn", "error"] }]`
2. Create proper logging utility for development/production
3. Use structured logging library (winston, pino) for backend
4. Add pre-commit hook to prevent console.log from being committed
5. Set up proper error tracking (Sentry, LogRocket, etc.)

### Test Cases to Verify Fix
- [ ] Open browser console on production → No debug logs appear
- [ ] Trigger errors → Proper error messages shown to user, details logged properly
- [ ] CSV import → No verbose parsing logs in console
- [ ] Check build output → No console warnings about console statements

---

## Bug #006: Incorrect Parameter Type in AllocationContactPanel

**Date Discovered:** 2025-10-04
**Severity:** High
**Status:** Open

### Description
The `AllocationContactPanel` component calls `removeFromWaitlist(contact.id)` at line 79, but this is incorrect. The `contact.id` is the allocation contact ID (format: `allocation_${id}`), not a waitlist entry ID. This is the same bug as #002 but in a different location.

### Root Cause
`src/components/allocation/AllocationContactPanel.tsx` line 79:

```typescript
// BUGGY CODE:
removeFromWaitlist(contact.id)  // ❌ Wrong: contact.id is allocation ID, not waitlist entry ID
```

This happens when a salesperson contacts a client about an allocation. The system tries to remove them from the waitlist but uses the wrong ID format.

### Impact
- **Waitlist entries never removed** when contact is initiated
- **Same client appears in allocation list multiple times** for the same watch
- **Inconsistent with completeSale function** which correctly finds and removes waitlist entries
- **Data integrity violation** - waitlist becomes polluted with stale entries

### Solution
Find the correct waitlist entry before removing:

```typescript
// FIXED CODE:
const waitlistEntry = get().waitlist.find(
  entry => entry.clientId === contact.clientId && entry.watchModelId === contact.watchModelId
)
if (waitlistEntry) {
  removeFromWaitlist(waitlistEntry.id)
} else {
  // Client wasn't on waitlist (shown via "All Clients" toggle)
  // No removal needed
}
```

### Files Modified
- `src/components/allocation/AllocationContactPanel.tsx` (line 79)

### Prevention Strategy
1. Use stricter TypeScript types to distinguish ID types:
   ```typescript
   type WaitlistEntryId = string & { __brand: 'waitlistEntry' }
   type AllocationContactId = string & { __brand: 'allocationContact' }
   ```
2. Add runtime validation to `removeFromWaitlist` to check ID format
3. Create integration tests for allocation flow
4. Document ID format conventions in code comments

### Test Cases to Verify Fix
- [ ] Initiate contact via SMS → Client removed from waitlist correctly
- [ ] Initiate contact via CALL → Client removed from waitlist correctly
- [ ] Contact client not on waitlist → No error, gracefully skips removal
- [ ] Check waitlist table before/after → Entry is actually deleted

---

## Bug #007: Potential Division by Zero in Purchase History Analysis

**Date Discovered:** 2025-10-04
**Severity:** Medium
**Status:** Open

### Description
The `calculatePriorityScore` function in `greenBoxStore.ts` calculates `priceRatio = watch.price / avgPurchase` without checking if `avgPurchase` is zero. For new clients with no purchase history, `avgPurchase` will be 0, resulting in `Infinity` for the price ratio.

### Root Cause
`src/lib/stores/greenBoxStore.ts` lines 248-252:

```typescript
// BUGGY CODE:
const avgPurchase = client.purchases.length > 0
  ? client.purchases.reduce((sum, p) => sum + p.price, 0) / client.purchases.length
  : 0

const priceRatio = avgPurchase > 0 ? watch.price / avgPurchase : 0
// ✓ GOOD: Has zero-check

// But then:
if (priceRatio >= 0.5 && priceRatio <= 1.5) {
  score += 20
} else if (priceRatio < 0.5) {  // This handles the avgPurchase === 0 case
  score += 10
}
```

**Wait, this actually looks correct!** The code has `avgPurchase > 0 ? ... : 0`, which handles the division by zero. However, when `avgPurchase === 0`, `priceRatio` becomes 0, which triggers the `priceRatio < 0.5` condition.

**The bug is semantic, not syntactic:** A client with $0 purchase history and looking at a $50,000 watch gets scored as "watch is cheaper than usual - easy sell" which makes no sense. The logic should be:

```typescript
// FIXED CODE:
const avgPurchase = client.purchases.length > 0
  ? client.purchases.reduce((sum, p) => sum + p.price, 0) / client.purchases.length
  : 0

// Better logic for no purchase history
if (client.purchases.length === 0) {
  // No purchase history - can't compare price ratios
  score += 0 // Neutral, rely on other factors
} else {
  const priceRatio = watch.price / avgPurchase
  if (priceRatio >= 0.5 && priceRatio <= 1.5) {
    score += 20 // Watch price aligns with purchase history
  } else if (priceRatio < 0.5) {
    score += 10 // Watch is cheaper than usual - easy sell
  } else {
    score -= 10 // Watch is much more expensive than usual
  }
}
```

### Impact
- **Incorrect priority scoring** for new clients
- **New clients get +10 score bonus** they don't deserve
- **GREEN BOX recommendations skewed** toward clients without purchase history
- **Less accurate allocation suggestions**

### Files Modified
- `src/lib/stores/greenBoxStore.ts` (lines 247-259)

### Prevention Strategy
1. Always handle "no data" cases explicitly, don't let them fall through to numeric comparisons
2. Add JSDoc comments explaining scoring logic
3. Write unit tests for edge cases (empty purchase history, single purchase, etc.)
4. Create test data with various purchase patterns

### Test Cases to Verify Fix
- [ ] New client ($0 purchases) looking at $50K watch → Score should not include price ratio bonus
- [ ] Client with 1 purchase ($10K) looking at similar watch ($12K) → Should get price alignment bonus
- [ ] Client with purchases averaging $5K looking at $50K watch → Should get penalty
- [ ] Verify scoring is consistent and intuitive

---

## Bug #008: TypeScript Type Safety Bypass with "as any"

**Date Discovered:** 2025-10-04
**Severity:** Low
**Status:** Open

### Description
The codebase uses `as any` type assertion in one location, which bypasses TypeScript's type safety. This is in the QuickSearch component for browser speech recognition API.

### Root Cause
`src/components/ui/QuickSearch.tsx` line 45:

```typescript
// BUGGY CODE:
recognition.current = new (window as any).webkitSpeechRecognition()
```

This bypasses TypeScript to access the non-standard `webkitSpeechRecognition` API.

### Impact
- **Low runtime risk** (this is intentional for browser API compatibility)
- **Reduces type safety** - errors not caught at compile time
- **Missing browser compatibility check** - will throw error in non-webkit browsers
- **No fallback handling** if API is unavailable

### Solution
Use proper TypeScript typing and feature detection:

```typescript
// FIXED CODE:
// Add to types/index.ts or window.d.ts:
interface Window {
  webkitSpeechRecognition?: typeof SpeechRecognition
  SpeechRecognition?: typeof SpeechRecognition
}

// In QuickSearch.tsx:
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

if (!SpeechRecognition) {
  console.warn('Speech recognition not supported in this browser')
  return
}

recognition.current = new SpeechRecognition()
```

### Files Modified
- `src/components/ui/QuickSearch.tsx` (line 45)
- `src/types/index.ts` or `window.d.ts` (add interface extension)

### Prevention Strategy
1. Add ESLint rule to warn on `as any` usage
2. Create type definitions for all browser APIs used
3. Always feature-detect before using non-standard APIs
4. Add polyfills or fallbacks for missing APIs

### Test Cases to Verify Fix
- [ ] Test in Chrome → Speech recognition works
- [ ] Test in Safari → Speech recognition works
- [ ] Test in Firefox (no webkit API) → Graceful fallback, no crash
- [ ] Test with voice input → Search executes correctly

---

## Bug #009: Inconsistent Tier Calculation Logic Across Codebase

**Date Discovered:** 2025-10-04
**Severity:** High
**Status:** Open

### Description
There are THREE different implementations of `calculateClientTier()` with slightly different logic:

1. **mockData.ts** (line 52): Uses `lifetimeSpend` as fallback when no purchases
2. **greenBoxStore.ts** (line 73): Uses `lifetimeSpend / 3` as fallback when no purchases
3. **API route** (line 23): Uses percentile-based calculation

This causes tier assignments to be inconsistent depending on which function is called.

### Root Cause
Duplicate logic in multiple files:

**Version 1:** `src/data/mockData.ts` lines 54-56
```typescript
const avgOrderValue = purchases.length > 0
  ? purchases.reduce((sum, p) => sum + p.price, 0) / purchases.length
  : lifetimeSpend  // ← Assumes entire lifetime spend is one order
```

**Version 2:** `src/lib/stores/greenBoxStore.ts` lines 75-77
```typescript
const avgOrderValue = purchases.length > 0
  ? purchases.reduce((sum, p) => sum + p.price, 0) / purchases.length
  : lifetimeSpend / 3  // ← More conservative: assumes 3 purchases
```

**Version 3:** `src/app/api/import/lenkersdorfer/route.ts` lines 23-28
```typescript
function calculateClientTier(percentile: number): ClientTier {
  if (percentile >= 80) return 1
  if (percentile >= 60) return 2
  if (percentile >= 40) return 3
  if (percentile >= 20) return 4
  return 5
}
```

### Impact
- **Same client gets different tiers** depending on code path
- **Import assigns tiers differently** than runtime calculation
- **GREEN BOX matching unreliable** - tier comparisons may be incorrect
- **Tier recalculation may change tiers** unexpectedly after import
- **Business logic inconsistency** - which formula is correct?

### Solution
Create ONE canonical tier calculation function:

```typescript
// FIXED CODE: Create src/lib/tierCalculations.ts

import { ClientTier, Purchase } from '@/types'

/**
 * Calculate client tier based on lifetime spend and purchase history
 * This is the SINGLE SOURCE OF TRUTH for tier calculations
 */
export function calculateClientTier(
  lifetimeSpend: number,
  purchases: Purchase[] = []
): ClientTier {
  // Calculate average order value if purchases exist
  const avgOrderValue = purchases.length > 0
    ? purchases.reduce((sum, p) => sum + p.price, 0) / purchases.length
    : lifetimeSpend / 3 // Conservative estimate: assume 3 purchases

  // Tier 1: Ultra-High Net Worth ($250K+ lifetime, $50K+ avg orders)
  if (lifetimeSpend >= 250000 && avgOrderValue >= 50000) return 1

  // Tier 2: High Net Worth ($100K+ lifetime, $25K+ avg orders)
  if (lifetimeSpend >= 100000 && avgOrderValue >= 25000) return 2

  // Tier 3: Established Collectors ($50K+ lifetime, $15K+ avg orders)
  if (lifetimeSpend >= 50000 && avgOrderValue >= 15000) return 3

  // Tier 4: Growing Enthusiasts ($20K+ lifetime, $8K+ avg orders)
  if (lifetimeSpend >= 20000 && avgOrderValue >= 8000) return 4

  // Tier 5: Entry Level (Under $20K lifetime)
  return 5
}
```

Then import and use this function everywhere:
- Delete duplicate in `mockData.ts`
- Delete duplicate in `greenBoxStore.ts`
- Replace percentile-based calculation in API route

### Files Modified
- Create: `src/lib/tierCalculations.ts` (new file)
- `src/data/mockData.ts` (replace lines 52-77)
- `src/lib/stores/greenBoxStore.ts` (replace lines 73-92)
- `src/app/api/import/lenkersdorfer/route.ts` (replace lines 23-28)
- `src/lib/stores/clientStore.ts` (import and use canonical function)

### Prevention Strategy
1. **DRY principle:** Never duplicate business logic
2. Create `/lib/businessLogic/` folder for shared calculations
3. Add unit tests for tier calculation with known inputs/outputs
4. Document tier thresholds in product requirements doc
5. Code review checklist: "Is this logic duplicated elsewhere?"

### Test Cases to Verify Fix
- [ ] New client ($50K spend, no purchases) → All code paths return same tier
- [ ] After CSV import → Tier matches what GREEN BOX calculates
- [ ] Recalculate tiers → No unexpected tier changes
- [ ] Client with exact threshold values → Tier assignment is consistent

---

## Statistics

- **Total Bugs Logged:** 9
- **Critical Bugs:** 2 (22%)
- **High Bugs:** 4 (44%)
- **Medium Bugs:** 2 (22%)
- **Low Bugs:** 1 (11%)
- **Fixed Bugs:** 1 (11%)
- **Open Bugs:** 8 (89%)

**Severity Breakdown:**
- **Critical:** #002 (removeFromWaitlist parameter bug), #006 (AllocationContactPanel parameter bug)
- **High:** #003 (division by zero), #004 (unimplemented API), #009 (inconsistent tier logic), #006
- **Medium:** #005 (console.log statements), #007 (purchase history scoring)
- **Low:** #008 (TypeScript type safety bypass)

**Last Updated:** 2025-10-04
