# Supabase Setup Guide

This guide will walk you through setting up Supabase for the Lenkersdorfer luxury watch CRM.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works fine)
- Basic understanding of PostgreSQL

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - **Name**: Lenkersdorfer CRM
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for setup to complete (~2 minutes)

## Step 2: Run Database Migrations

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

   This will execute all migrations in `supabase/migrations/`:
   - `20241201000001_initial_schema.sql` - Creates tables
   - `20241201000002_business_logic_functions.sql` - Creates functions
   - `20241201000003_rls_policies.sql` - Sets up Row Level Security

## Step 3: Configure Environment Variables

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to Project Settings > API in Supabase dashboard
   - Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy the **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

3. Update `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 4: Seed Database with Mock Data

Run the seed script to populate with sample data:

```bash
npm run seed
```

Or using ts-node directly:

```bash
npx ts-node scripts/seed-database.ts
```

This will create:
- 12 sample clients (various VIP tiers)
- 17 watches in inventory
- Purchase history for clients
- Waitlist entries

## Step 5: Create Your First User

The seed script creates a default admin user:

**Email**: `admin@lenkersdorfer.com`
**Password**: `admin123456`

You can create additional users in two ways:

### Option 1: Via Supabase Dashboard
1. Go to Authentication > Users
2. Click "Add user"
3. Enter email and password
4. The user will be created and can login immediately

### Option 2: Via SQL
```sql
-- Create user
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'user@example.com',
  crypt('password123', gen_salt('bf')),
  NOW()
);

-- Create user profile (optional, for salespeople)
INSERT INTO user_profiles (id, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),
  'John Doe',
  'salesperson'
);
```

## Step 6: Verify Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. You should be redirected to `/login`

4. Login with credentials from Step 5

5. You should see the dashboard with seeded data

## Database Schema Overview

### Core Tables

**clients**
- Stores client information
- Includes lifetime_spend, vip_tier, preferred_brands
- Has RLS policies for salesperson isolation

**inventory**
- Watch catalog
- Tracks availability, pricing, categories

**waitlist**
- Clients waiting for specific watches
- Includes priority_score (auto-calculated)

**purchases**
- Purchase history
- Triggers update to client lifetime_spend
- Calculates commissions automatically

**allocations**
- Watch allocation decisions
- Links clients to inventory
- Tracks delivery status

### Business Logic Functions

**calculate_vip_tier(spend)**
- Input: lifetime spend amount
- Returns: Bronze/Silver/Gold/Platinum

**calculate_priority_score(client_id, brand, wait_start_date)**
- Calculates waitlist priority based on:
  - Lifetime spend (40%)
  - Days waiting (30%)
  - Recent activity (20%)
  - VIP bonus (10%)

**get_waitlist_candidates(brand, model)**
- Returns top candidates for allocation
- Includes reasoning for each candidate

**allocate_watch(client_id, watch_id, allocated_by)**
- Creates allocation record
- Updates inventory availability
- Removes from waitlist
- Calculates commission

## Row Level Security (RLS)

All tables have RLS enabled:

- **Salespeople** can only access their assigned clients
- **Managers** can access their team's data
- **Admins** have full access
- All mutations are logged for audit trails

## Real-time Subscriptions

The app uses Supabase Realtime for:
- Live client updates
- Inventory changes
- Waitlist modifications
- New purchase notifications

## Troubleshooting

### Issue: "Invalid API key"
- Check that env variables are correctly set
- Restart dev server after changing .env.local

### Issue: "Relation does not exist"
- Run migrations: `supabase db push`
- Verify migrations ran: `supabase db diff`

### Issue: "Row Level Security policy violation"
- Check user is authenticated
- Verify user has correct role in user_profiles table

### Issue: Seed script fails
- Ensure SUPABASE_SERVICE_ROLE_KEY is set
- Check migrations have run first
- Look for foreign key constraint errors

## Next Steps

1. **Customize VIP Tiers**: Edit `calculate_vip_tier` function in migrations
2. **Add More Users**: Create salespeople via Supabase dashboard
3. **Configure Email**: Set up email templates in Supabase > Authentication > Email Templates
4. **Enable 2FA**: Go to Authentication > Policies to enable MFA
5. **Set up Backups**: Enable daily backups in Project Settings > Database

## Useful Commands

```bash
# View database schema
supabase db dump --schema public

# Reset database (WARNING: deletes all data)
supabase db reset

# View real-time logs
supabase functions logs

# Generate TypeScript types
supabase gen types typescript --local > types/database.ts
```

## Production Deployment

Before deploying to production:

1. Enable SSL in Supabase (automatic)
2. Set up proper backup schedule
3. Review and tighten RLS policies
4. Enable rate limiting in Project Settings
5. Set up monitoring and alerts
6. Configure custom SMTP for emails
7. Add database connection pooling for scale

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Project Issues](https://github.com/your-repo/issues)
