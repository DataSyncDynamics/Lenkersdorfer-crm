# React Hooks Rules - Critical Guide

## Issue Encountered: "Rendered more hooks than during the previous render"

**Date:** 2025-10-20
**Component:** `AllocationContactPanel.tsx`
**Severity:** Critical - App completely unusable

---

## Root Cause Analysis

### The Problem
The `AllocationContactPanel` component had a `useEffect` hook placed AFTER an early return statement:

```tsx
// ❌ WRONG - Violates Rules of Hooks
const AllocationContactPanel = ({ isOpen, watchId, ... }) => {
  const [state, setState] = useState(...)
  const { ... } = useAppStore()

  const watch = getWatchModelById(watchId)

  if (!watch) return null  // ⚠️ EARLY RETURN

  // ... component logic ...

  useEffect(() => {  // ❌ Hook called AFTER conditional return
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
  }, [isOpen])
}
```

### Why This Breaks

**React's Rules of Hooks require:**
1. Hooks must be called in the **exact same order** on every render
2. Hooks cannot be called conditionally
3. Hooks cannot be called after early returns

**What happened:**
- **Render 1:** `watch` is `null` → component returns early → `useEffect` is NOT called → React sees 0 hooks after the early return
- **Render 2:** `watch` exists → component doesn't return early → `useEffect` IS called → React sees 1 hook after the early return
- **Result:** React detects different hook counts between renders → **CRASH**

---

## The Fix

Move ALL hooks BEFORE any conditional returns:

```tsx
// ✅ CORRECT - All hooks before early return
const AllocationContactPanel = ({ isOpen, watchId, ... }) => {
  const [state, setState] = useState(...)
  const { ... } = useAppStore()

  const watch = getWatchModelById(watchId)

  // ✅ useEffect called BEFORE early return
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])

  // ✅ Now safe to return early
  if (!watch) return null

  // ... rest of component ...
}
```

---

## Prevention Strategy

### Golden Rules

**1. All Hooks at the Top**
```tsx
function Component() {
  // ✅ ALL hooks here
  const [state1] = useState()
  const [state2] = useState()
  useEffect(() => {}, [])
  const value = useMemo(() => {}, [])

  // ✅ THEN conditionals and early returns
  if (condition) return null

  // ✅ THEN component logic
  return <div>...</div>
}
```

**2. Never Conditional Hooks**
```tsx
// ❌ WRONG
if (condition) {
  useEffect(() => {}, [])
}

// ✅ RIGHT
useEffect(() => {
  if (condition) {
    // conditional logic inside hook
  }
}, [condition])
```

**3. Never Hooks After Early Returns**
```tsx
// ❌ WRONG
if (!data) return null
useEffect(() => {}, [])  // Will not always be called!

// ✅ RIGHT
useEffect(() => {}, [])
if (!data) return null
```

**4. Never Hooks in Loops**
```tsx
// ❌ WRONG
items.forEach(item => {
  const [state] = useState()
})

// ✅ RIGHT
const [states] = useState({})
items.forEach(item => {
  // use states object
})
```

---

## Checklist for Code Reviews

When reviewing components, verify:

- [ ] All hooks are declared at the top of the component
- [ ] No hooks are called after `if` statements with `return`
- [ ] No hooks are called inside `if`/`else` blocks
- [ ] No hooks are called inside loops (`map`, `forEach`, `for`)
- [ ] No hooks are called inside functions that may not be called every render
- [ ] Components with early returns have ALL hooks before the first possible return

---

## Testing Strategy

To catch these errors early:

1. **React Strict Mode** (already enabled)
   - Helps catch hook violations during development

2. **Test Different Data States**
   - Test with `null`/`undefined` data
   - Test with valid data
   - Test transitions between states

3. **ESLint Rule**
   ```json
   {
     "rules": {
       "react-hooks/rules-of-hooks": "error",
       "react-hooks/exhaustive-deps": "warn"
     }
   }
   ```

---

## Files Modified

### Fix Applied
- **File:** `src/components/allocation/AllocationContactPanel.tsx`
- **Lines:** 58-67 (moved `useEffect` before early return)
- **Date:** 2025-10-20

### Related Changes
- **File:** `src/app/page.tsx`
- **Fix:** Moved `useState` hooks before loading skeleton early return
- **Date:** 2025-10-20

---

## Impact

**Before Fix:**
- ❌ Application completely unusable
- ❌ Error: "Rendered more hooks than during the previous render"
- ❌ Users saw error boundary page

**After Fix:**
- ✅ Application loads correctly
- ✅ All hooks called in consistent order
- ✅ No React errors
- ✅ Proper loading states and transitions

---

## References

- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [ESLint Plugin React Hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
