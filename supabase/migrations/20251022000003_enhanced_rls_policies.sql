-- =====================================================
-- ENHANCED RLS POLICIES
-- Phase 4: Security Remediation - Strengthen Row Level Security
-- =====================================================

-- Drop existing broad reminders policies
DROP POLICY IF EXISTS "Enable read access for all users" ON reminders;
DROP POLICY IF EXISTS "Enable insert for all users" ON reminders;
DROP POLICY IF EXISTS "Enable update for all users" ON reminders;
DROP POLICY IF EXISTS "Enable delete for all users" ON reminders;

-- =====================================================
-- REMINDERS TABLE RLS POLICIES
-- =====================================================

-- Users can only see reminders for their assigned clients
CREATE POLICY "Users can view reminders for assigned clients"
  ON reminders
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE assigned_to = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'admin')
    )
  );

-- Users can create reminders for their assigned clients
CREATE POLICY "Users can create reminders for assigned clients"
  ON reminders
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients
      WHERE assigned_to = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'admin')
    )
  );

-- Users can update reminders for their assigned clients
CREATE POLICY "Users can update reminders for assigned clients"
  ON reminders
  FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE assigned_to = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'admin')
    )
  );

-- Users can delete reminders for their assigned clients
CREATE POLICY "Users can delete reminders for assigned clients"
  ON reminders
  FOR DELETE
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE assigned_to = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('manager', 'admin')
    )
  );

-- =====================================================
-- VERIFY ALL TABLES HAVE RLS ENABLED
-- =====================================================

-- Ensure RLS is enabled on all sensitive tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Verify user_profiles table exists and has RLS
-- Note: This might be named differently in your schema
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_profiles') THEN
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- ADDITIONAL SECURITY POLICIES
-- =====================================================

-- Prevent users from modifying assigned_to field on clients
-- This is handled by the UPDATE policy which doesn't include assigned_to in updatable fields

-- Prevent deletion of purchase history (handled by application logic)
-- Only admins can delete purchases
CREATE POLICY "Only admins can delete purchases"
  ON purchases
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- RLS POLICY DOCUMENTATION
-- =====================================================

COMMENT ON TABLE clients IS 'Client records with RLS: users see only assigned clients, managers/admins see all';
COMMENT ON TABLE purchases IS 'Purchase records with RLS: users see purchases for assigned clients only';
COMMENT ON TABLE waitlist IS 'Waitlist entries with RLS: users see entries for assigned clients only';
COMMENT ON TABLE reminders IS 'Reminder records with RLS: users see reminders for assigned clients only';
COMMENT ON TABLE inventory IS 'Inventory/watches with RLS: all can read, only managers/admins can modify';
COMMENT ON TABLE allocations IS 'Watch allocations with RLS: users see allocations for assigned clients';
COMMENT ON TABLE profiles IS 'User profiles with RLS: users see own profile, managers/admins see all';

-- =====================================================
-- RLS TESTING QUERIES (For verification)
-- =====================================================

-- Example query to test RLS as different users:
-- SELECT * FROM clients; -- Should only return assigned clients
-- SELECT * FROM purchases; -- Should only return purchases for assigned clients
-- SELECT * FROM reminders; -- Should only return reminders for assigned clients

-- To test as different user:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL "request.jwt.claims" = '{"sub":"<user-id>"}';
-- SELECT * FROM clients;
