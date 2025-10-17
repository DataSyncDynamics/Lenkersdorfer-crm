# Lenkersdorfer CRM - Supabase Integration

This document provides a comprehensive overview of the Supabase integration in the Lenkersdorfer luxury watch CRM.

## Implementation Overview

The application has been fully integrated with Supabase for:
- **Authentication** - Secure user login/logout
- **Database** - PostgreSQL with business logic functions
- **Real-time** - Live updates for clients, inventory, and waitlist
- **Row Level Security** - Data isolation per salesperson

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Next.js App                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │   Pages    │  │  API Routes │  │ Middleware ││
│  └────────────┘  └────────────┘  └────────────┘│
│         │              │                │        │
│         └──────────────┴────────────────┘        │
│                        │                          │
│              ┌─────────▼─────────┐               │
│              │ Supabase Clients  │               │
│              │ (Browser/Server)  │               │
│              └─────────┬─────────┘               │
└────────────────────────┼─────────────────────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │    Supabase Cloud     │
             ├───────────────────────┤
             │  • PostgreSQL DB      │
             │  • Auth Service       │
             │  • Realtime Engine    │
             │  • Edge Functions     │
             └───────────────────────┘
```

## Files Created/Modified

### Supabase Utilities
- `/src/lib/supabase/client.ts` - Browser-side client
- `/src/lib/supabase/server.ts` - Server-side client
- `/src/lib/supabase/middleware.ts` - Auth middleware helpers

### Authentication
- `/src/components/auth/AuthProvider.tsx` - Auth context provider
- `/src/app/login/page.tsx` - Login page
- `/middleware.ts` - Route protection middleware

### API Routes
- `/src/app/api/clients/route.ts` - Clients CRUD (list, create)
- `/src/app/api/clients/[id]/route.ts` - Single client (get, update, delete)
- `/src/app/api/watches/route.ts` - Inventory CRUD (list, create)
- `/src/app/api/watches/[id]/route.ts` - Single watch (get, update, delete)
- `/src/app/api/waitlist/route.ts` - Waitlist CRUD (list, create)
- `/src/app/api/waitlist/[id]/route.ts` - Single waitlist (get, update, delete)
- `/src/app/api/purchases/route.ts` - Purchases (list, create)
- `/src/app/api/purchases/[id]/route.ts` - Single purchase (get)

### Data Layer
- `/src/lib/api/clients.ts` - Client API wrapper functions
- `/src/lib/stores/clientStoreSupabase.ts` - Enhanced Zustand store with API calls
- `/src/lib/hooks/useSupabaseData.ts` - Data fetching hook
- `/src/components/providers/DataProvider.tsx` - Real-time subscription provider

### Error Handling
- `/src/components/ErrorBoundary.tsx` - React error boundary

### Scripts & Config
- `/scripts/seed-database.ts` - Database seeding script
- `/.env.local.example` - Environment variable template
- `/SUPABASE_SETUP.md` - Setup documentation
- `/DEPLOYMENT.md` - Deployment guide

## Database Schema

### Core Tables

**clients**
```sql
- id (uuid, primary key)
- name (text)
- email (text, unique)
- phone (text)
- lifetime_spend (decimal)
- vip_tier (enum: Bronze, Silver, Gold, Platinum)
- preferred_brands (text[])
- notes (text)
- assigned_to (uuid, FK to auth.users)
- created_at, updated_at (timestamps)
```

**inventory**
```sql
- id (uuid, primary key)
- brand (text)
- model (text)
- category (text)
- price (decimal)
- retail_price (decimal)
- reference_number (text)
- description (text)
- image_url (text)
- is_available (boolean)
- availability_date (date)
- created_at, updated_at (timestamps)
```

**waitlist**
```sql
- id (uuid, primary key)
- client_id (uuid, FK to clients)
- brand (text)
- model (text)
- reference_number (text)
- wait_start_date (date)
- priority_score (integer)
- notes (text)
- is_active (boolean)
- created_at, updated_at (timestamps)
```

**purchases**
```sql
- id (uuid, primary key)
- client_id (uuid, FK to clients)
- watch_id (uuid, FK to inventory)
- brand (text)
- model (text)
- price (decimal)
- purchase_date (date)
- commission_rate (decimal)
- commission_amount (decimal)
- salesperson_id (uuid, FK to auth.users)
- created_at (timestamp)
```

**allocations**
```sql
- id (uuid, primary key)
- client_id (uuid, FK to clients)
- watch_id (uuid, FK to inventory)
- allocation_date (date)
- delivery_date (date)
- status (enum: pending, confirmed, delivered, cancelled)
- commission_rate (decimal)
- commission_amount (decimal)
- allocated_by (uuid, FK to auth.users)
- notes (text)
- created_at, updated_at (timestamps)
```

**user_profiles**
```sql
- id (uuid, primary key, FK to auth.users)
- full_name (text)
- role (enum: salesperson, manager, admin)
- team (text)
- commission_rate (decimal)
- created_at, updated_at (timestamps)
```

## Business Logic Functions

### VIP Tier Calculation
```sql
calculate_vip_tier(spend: decimal) -> vip_tier
```
- Platinum: €500K+
- Gold: €200K+
- Silver: €100K+
- Bronze: < €100K

### Priority Score Calculation
```sql
calculate_priority_score(
  client_id: uuid,
  brand: text,
  wait_start_date: date
) -> integer
```

Formula:
- VIP tier score (0-40 points)
- Lifetime spend score (0-30 points)
- Wait time score (0-15 points)
- Brand preference match (0-15 points)

### Waitlist Candidates
```sql
get_waitlist_candidates(
  brand: text,
  model: text,
  limit: integer
) -> TABLE (
  waitlist_id, client_id, client_name,
  vip_tier, priority_score, days_waiting,
  lifetime_spend, wait_start_date, reasoning
)
```

Returns top candidates with detailed reasoning.

### Watch Allocation
```sql
allocate_watch(
  client_id: uuid,
  watch_id: uuid,
  allocated_by: uuid
) -> uuid
```

Atomically:
1. Creates allocation record
2. Marks watch unavailable
3. Deactivates waitlist entries
4. Calculates commission

## Row Level Security (RLS)

### Clients Table
```sql
-- Salespeople can only see their assigned clients
CREATE POLICY "Salespeople access own clients"
ON clients FOR ALL
USING (assigned_to = auth.uid());

-- Managers can see team clients
CREATE POLICY "Managers access team clients"
ON clients FOR ALL
USING (
  assigned_to IN (
    SELECT id FROM user_profiles
    WHERE team = (
      SELECT team FROM user_profiles
      WHERE id = auth.uid()
    )
  )
);
```

### Purchases Table
```sql
-- Users can only see purchases they made
CREATE POLICY "Users access own purchases"
ON purchases FOR ALL
USING (salesperson_id = auth.uid());
```

## API Endpoints

### Clients
- `GET /api/clients?search=query&page=1` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/[id]` - Get client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Delete client

### Watches/Inventory
- `GET /api/watches?available=true&brand=Rolex` - List watches
- `POST /api/watches` - Add watch
- `GET /api/watches/[id]` - Get watch
- `PUT /api/watches/[id]` - Update watch
- `DELETE /api/watches/[id]` - Delete watch

### Waitlist
- `GET /api/waitlist?brand=Rolex&model=Daytona` - List waitlist
- `POST /api/waitlist` - Add to waitlist
- `GET /api/waitlist/[id]` - Get waitlist entry
- `PUT /api/waitlist/[id]` - Update waitlist
- `DELETE /api/waitlist/[id]` - Remove from waitlist

### Purchases
- `GET /api/purchases?client_id=xxx` - List purchases
- `POST /api/purchases` - Record purchase
- `GET /api/purchases/[id]` - Get purchase

## Authentication Flow

1. **User visits app** → Middleware checks session
2. **No session** → Redirect to `/login`
3. **Login attempt** → `AuthProvider.signIn()`
4. **Success** → Supabase sets session cookie
5. **Middleware validates** → Allow access
6. **API routes** → Check `auth.getUser()` for each request

## Real-time Subscriptions

The app subscribes to database changes:

```typescript
// Client changes
supabase
  .channel('clients-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'clients' },
    (payload) => {
      // Update UI
    }
  )
  .subscribe()
```

Subscribed tables:
- `clients`
- `inventory`
- `waitlist`
- `purchases`

## Migration Process

### Initial Setup
1. Create Supabase project
2. Run migrations from `/supabase/migrations/`
3. Verify functions and triggers
4. Test RLS policies

### Data Migration
```bash
npm run seed
```

Seeds the database with:
- 12 sample clients (various tiers)
- 17 watches in inventory
- Purchase history
- 10 waitlist entries

### Production Migration
1. Export data from old system
2. Transform to match schema
3. Use Supabase API or SQL for bulk insert
4. Verify data integrity
5. Update foreign keys

## Environment Variables

Required:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
# Test auth flow
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lenkersdorfer.com","password":"admin123456"}'

# Test client creation
curl -X POST http://localhost:3000/api/clients \
  -H "Cookie: sb-access-token=..." \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Client","email":"test@example.com"}'
```

### Load Testing
Use tools like k6 or Artillery to test API performance.

## Performance Benchmarks

Target metrics:
- **Page Load**: < 2s (First Contentful Paint)
- **API Response**: < 100ms (p95)
- **Database Query**: < 50ms (p95)
- **Real-time Latency**: < 500ms

Optimization:
- Index frequently queried columns
- Use connection pooling
- Enable Supabase Edge caching
- Implement client-side caching

## Security Considerations

1. **Never expose service role key** in client code
2. **Always validate user input** in API routes
3. **Use RLS policies** for all tables
4. **Enable 2FA** for admin accounts
5. **Rotate keys quarterly**
6. **Monitor for suspicious activity**
7. **Log all admin actions**

## Troubleshooting

### Common Issues

**"Invalid API key"**
- Check `.env.local` has correct values
- Restart dev server
- Verify Supabase project is active

**"Row Level Security policy violation"**
- User not authenticated
- Wrong RLS policy
- Check user role in `user_profiles`

**"Function does not exist"**
- Migrations not run
- Check function name spelling
- Run `supabase db reset` (dev only)

## Next Steps

1. **Add features**: Email notifications, PDF reports
2. **Enhance RLS**: More granular permissions
3. **Add webhooks**: External system integration
4. **Implement caching**: Redis for frequently accessed data
5. **Add monitoring**: Sentry, LogRocket
6. **Set up CI/CD**: Automated testing and deployment

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Setup Guide](./SUPABASE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
