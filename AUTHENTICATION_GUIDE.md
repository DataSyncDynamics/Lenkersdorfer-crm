# Authentication Guide - Lenkersdorfer CRM

## Overview
This CRM uses Supabase authentication with cookie-based session storage for seamless server-side verification.

## Architecture

### Client-Side (Browser)
**File:** `/src/lib/supabase/browser.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'
import { supabaseBrowser } from '@/lib/supabase/browser'

// Use in client components
await supabaseBrowser.auth.signInWithPassword({ email, password })
```

**Key Features:**
- Uses `@supabase/ssr` for cookie-based sessions
- Sessions stored in HTTP cookies (not localStorage)
- Compatible with server-side middleware

### Server-Side (Middleware)
**File:** `/src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'

// Middleware reads cookies automatically
const { data: { session } } = await supabase.auth.getSession()
```

**Key Features:**
- Validates sessions on every request
- Protects routes automatically
- Redirects unauthenticated users to login
- Prevents authenticated users from accessing login page

## Authentication Flow

```
1. User Login
   ↓
2. supabaseBrowser.auth.signInWithPassword()
   ↓
3. Session stored in HTTP cookie: sb-{project}-auth-token
   ↓
4. Redirect to dashboard (window.location.href = '/')
   ↓
5. Middleware intercepts request
   ↓
6. Reads cookie → Validates session
   ↓
7. Session valid? Allow access : Redirect to login
```

## Protected Routes

### Automatically Protected:
- `/` (Dashboard)
- `/clients`
- `/inventory`
- `/waitlist`
- `/allocation`
- `/messages`
- `/analytics`
- `/reminders`
- `/notifications`
- `/import`
- `/api/*` (All API routes)

### Public Routes:
- `/login`
- `/signup`
- `/auth/callback`

## Usage Examples

### Login Component
```typescript
import { supabaseBrowser } from '@/lib/supabase/browser'

async function handleLogin(email: string, password: string) {
  const { data, error } = await supabaseBrowser.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login failed:', error.message)
    return
  }

  // Wait for cookies to propagate
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Redirect to dashboard
  window.location.href = '/'
}
```

### Logout Component
```typescript
import { supabaseBrowser } from '@/lib/supabase/browser'

async function handleLogout() {
  await supabaseBrowser.auth.signOut()
  window.location.href = '/login'
}
```

### Check Current User (Client Component)
```typescript
import { supabaseBrowser } from '@/lib/supabase/browser'

async function getCurrentUser() {
  const { data: { user } } = await supabaseBrowser.auth.getUser()
  return user
}
```

### Check Session (Server Component)
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    // User not authenticated
    return <div>Please login</div>
  }

  return <div>Welcome {session.user.email}</div>
}
```

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional (for admin operations):
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Cookie Details

### Cookie Name Pattern:
```
sb-{project-ref}-auth-token
```

Example:
```
sb-zqstpmfatjatnvodiaey-auth-token
```

### Cookie Properties:
- Path: `/`
- HttpOnly: Yes (server can read it)
- Secure: Yes (HTTPS only in production)
- SameSite: Lax
- Max-Age: Based on session expiry

### Inspecting Cookies (Browser Console):
```javascript
// Check if auth cookie exists
document.cookie.split(';').filter(c => c.includes('sb-'))

// Expected output:
// ["sb-zqstpmfatjatnvodiaey-auth-token=..."]
```

## Troubleshooting

### User stays on login page after signing in

**Cause:** Client not using cookie-based authentication

**Fix:** Ensure login page imports `supabaseBrowser` from `/src/lib/supabase/browser.ts`

```typescript
// ❌ Wrong - uses localStorage
import { supabase } from '@/lib/supabase/client'

// ✅ Correct - uses cookies
import { supabaseBrowser } from '@/lib/supabase/browser'
```

### Middleware redirects to login despite valid session

**Cause:** Cookies not being sent or read correctly

**Fixes:**
1. Check cookie domain matches your app domain
2. Verify middleware imports from `@supabase/ssr`
3. Ensure 1-second delay before redirect in login flow
4. Check browser allows cookies (not in private mode)

### Session expires too quickly

**Cause:** Supabase default session expiry

**Fix:** Configure session timeout in Supabase dashboard:
- Go to Authentication → Settings
- Adjust JWT expiry time (default: 3600 seconds / 1 hour)

### API routes return 401 Unauthorized

**Cause:** Cookies not being sent with API requests

**Fix:** Ensure requests include credentials:
```typescript
fetch('/api/endpoint', {
  credentials: 'include', // Important for cookies
})
```

## Testing

### Manual Test:
```bash
# Run verification script
./test-login-flow.sh
```

### Browser Test:
1. Open http://localhost:3000/login
2. Enter credentials
3. Open browser DevTools → Application → Cookies
4. Verify `sb-*-auth-token` cookie is set after login
5. Verify redirect to dashboard happens within 1 second

### Middleware Logs:
```bash
# Watch middleware activity
tail -f /tmp/dev-server.log | grep "\[Middleware\]"

# Expected after successful login:
# [Middleware] { path: '/', hasSession: true, userId: '5ed5d5cf' }
```

## Security Best Practices

1. **Never use service role key in browser** - It bypasses Row Level Security
2. **Use HTTPS in production** - Cookies should only be sent over secure connections
3. **Implement session refresh** - Auto-refresh tokens before expiry
4. **Add rate limiting** - Prevent brute force login attempts
5. **Validate on server** - Always verify permissions server-side, not just client-side

## API Reference

### Browser Client Methods
```typescript
// Sign in
supabaseBrowser.auth.signInWithPassword({ email, password })

// Sign out
supabaseBrowser.auth.signOut()

// Get current user
supabaseBrowser.auth.getUser()

// Get session
supabaseBrowser.auth.getSession()

// Listen to auth changes
supabaseBrowser.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session)
})
```

### Server Client Methods
```typescript
const supabase = await createServerSupabaseClient()

// Get session (from cookies)
await supabase.auth.getSession()

// Get user (validates token)
await supabase.auth.getUser()
```

## Migration Notes

### From localStorage to Cookies

If you have existing code using the localStorage client:

**Before:**
```typescript
import { supabase } from '@/lib/supabase/client'
await supabase.auth.signInWithPassword({ email, password })
```

**After:**
```typescript
import { supabaseBrowser } from '@/lib/supabase/browser'
await supabaseBrowser.auth.signInWithPassword({ email, password })
```

**Important:** Users will need to re-authenticate after this change as their localStorage sessions won't be transferred to cookies.

## Related Files

- `/src/lib/supabase/browser.ts` - Cookie-based browser client
- `/src/lib/supabase/client.ts` - Legacy localStorage client (deprecated)
- `/src/lib/supabase/server.ts` - Server-side client
- `/src/middleware.ts` - Authentication middleware
- `/src/app/login/page.tsx` - Login page implementation

## Support

For issues related to:
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Next.js Middleware:** https://nextjs.org/docs/app/building-your-application/routing/middleware
- **@supabase/ssr:** https://supabase.com/docs/guides/auth/server-side

---

**Last Updated:** 2025-10-23
**Status:** Production Ready ✓
