-- ============================================================================
-- LENKERSDORFER CRM - DEMO USER SETUP
-- ============================================================================
-- This script creates a demo user account for accessing the Lenkersdorfer CRM
-- Execute this in your Supabase SQL Editor
-- ============================================================================

-- Demo User Credentials:
-- Email: demo@lenkersdorfer.com
-- Password: LuxuryWatch2024!
-- Role: Manager (full access to all features)

-- ============================================================================
-- STEP 1: Create the demo user in Supabase Auth
-- ============================================================================
-- IMPORTANT: This must be done through Supabase Dashboard or API
-- You CANNOT create auth users directly with SQL for security reasons.
--
-- METHOD 1: Use Supabase Dashboard (RECOMMENDED)
-- 1. Go to: Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Enter:
--    - Email: demo@lenkersdorfer.com
--    - Password: LuxuryWatch2024!
--    - Auto Confirm User: YES (check this box)
-- 4. Click "Create user"
-- 5. Copy the User UUID from the users table
--
-- METHOD 2: Use Supabase API/CLI
-- supabase auth users create demo@lenkersdorfer.com --password LuxuryWatch2024!

-- ============================================================================
-- STEP 2: Create sales team member profile
-- ============================================================================
-- Replace 'USER_UUID_HERE' with the actual UUID from Step 1

-- First, check if the sales_team table exists
-- If you don't have a sales_team table yet, you may need to create it:

-- CREATE TABLE IF NOT EXISTS public.sales_team (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--   name TEXT NOT NULL,
--   email TEXT UNIQUE NOT NULL,
--   role TEXT NOT NULL DEFAULT 'salesperson',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Insert the demo user profile (uncomment and replace USER_UUID_HERE):
-- INSERT INTO public.sales_team (user_id, name, email, role)
-- VALUES (
--   'USER_UUID_HERE'::uuid,
--   'Demo User',
--   'demo@lenkersdorfer.com',
--   'manager'
-- )
-- ON CONFLICT (email) DO UPDATE
-- SET name = EXCLUDED.name,
--     role = EXCLUDED.role,
--     updated_at = NOW();

-- ============================================================================
-- STEP 3: Verify the user was created
-- ============================================================================

-- Check auth.users table
SELECT id, email, created_at, confirmed_at
FROM auth.users
WHERE email = 'demo@lenkersdorfer.com';

-- Check sales_team table (if it exists)
-- SELECT * FROM public.sales_team WHERE email = 'demo@lenkersdorfer.com';

-- ============================================================================
-- STEP 4: Set up Row Level Security (RLS) policies
-- ============================================================================
-- Ensure users can access their own data

-- Example RLS policy for clients table (adjust based on your schema):
-- CREATE POLICY "Users can view their assigned clients"
-- ON public.clients
-- FOR SELECT
-- USING (
--   auth.uid() IN (
--     SELECT user_id FROM sales_team WHERE email = auth.jwt() ->> 'email'
--   )
--   OR
--   EXISTS (
--     SELECT 1 FROM sales_team
--     WHERE user_id = auth.uid()
--     AND role = 'manager'
--   )
-- );

-- ============================================================================
-- ALTERNATIVE: Use Supabase JavaScript API
-- ============================================================================
-- If you prefer to create the user programmatically, use this Node.js code:
--
-- import { createClient } from '@supabase/supabase-js'
--
-- const supabase = createClient(
--   process.env.NEXT_PUBLIC_SUPABASE_URL,
--   process.env.SUPABASE_SERVICE_ROLE_KEY // Admin key required!
-- )
--
-- const { data, error } = await supabase.auth.admin.createUser({
--   email: 'demo@lenkersdorfer.com',
--   password: 'LuxuryWatch2024!',
--   email_confirm: true,
--   user_metadata: {
--     name: 'Demo User',
--     role: 'manager'
--   }
-- })
--
-- if (error) console.error('Error:', error)
-- else console.log('User created:', data.user.id)

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Keep the password secure and share it only with authorized users
-- 2. For production, use stronger passwords and enable MFA
-- 3. The password can be changed after first login
-- 4. Manager role gives full access to all CRM features
-- 5. Make sure to enable email confirmation in Supabase settings
--    or set auto_confirm to true for demo purposes
