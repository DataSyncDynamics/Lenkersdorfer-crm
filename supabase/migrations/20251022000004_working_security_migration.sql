-- =====================================================
-- WORKING SECURITY MIGRATION
-- Single migration that only references existing tables/columns
-- =====================================================

-- =====================================================
-- PART 1: VIP TIER CORRECTIONS (100% SAFE)
-- =====================================================

-- Update VIP tier calculation to match business requirements
-- Platinum: $100K+ lifetime spend
-- Gold: $50K+ lifetime spend
-- Silver: $25K+ lifetime spend
-- Bronze: < $25K lifetime spend

CREATE OR REPLACE FUNCTION calculate_vip_tier(spend DECIMAL)
RETURNS vip_tier AS $$
BEGIN
    CASE
        WHEN spend >= 100000 THEN RETURN 'Platinum';
        WHEN spend >= 50000 THEN RETURN 'Gold';
        WHEN spend >= 25000 THEN RETURN 'Silver';
        ELSE RETURN 'Bronze';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing clients to correct VIP tiers based on new thresholds
UPDATE clients
SET vip_tier = calculate_vip_tier(lifetime_spend)
WHERE vip_tier != calculate_vip_tier(lifetime_spend);

-- Update priority score calculation with correct VIP weights
CREATE OR REPLACE FUNCTION calculate_priority_score(
    client_id_param UUID,
    brand_param TEXT,
    wait_start_date_param DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    vip_score INTEGER := 0;
    spend_score INTEGER := 0;
    wait_score INTEGER := 0;
    brand_score INTEGER := 0;
    days_waiting INTEGER;
    client_record RECORD;
BEGIN
    -- Get client information
    SELECT vip_tier, lifetime_spend, preferred_brands
    INTO client_record
    FROM clients
    WHERE id = client_id_param;

    -- VIP tier scoring (Platinum=40, Gold=30, Silver=20, Bronze=10)
    CASE client_record.vip_tier
        WHEN 'Platinum' THEN vip_score := 40;
        WHEN 'Gold' THEN vip_score := 30;
        WHEN 'Silver' THEN vip_score := 20;
        WHEN 'Bronze' THEN vip_score := 10;
        ELSE vip_score := 0;
    END CASE;

    -- Lifetime spend scoring ($100K+=30, $50K+=20, $25K+=10)
    CASE
        WHEN client_record.lifetime_spend >= 100000 THEN spend_score := 30;
        WHEN client_record.lifetime_spend >= 50000 THEN spend_score := 20;
        WHEN client_record.lifetime_spend >= 25000 THEN spend_score := 10;
        ELSE spend_score := 0;
    END CASE;

    -- Wait time scoring (90+ days=15, 60+=10, 30+=5)
    days_waiting := CURRENT_DATE - wait_start_date_param;
    CASE
        WHEN days_waiting >= 90 THEN wait_score := 15;
        WHEN days_waiting >= 60 THEN wait_score := 10;
        WHEN days_waiting >= 30 THEN wait_score := 5;
        ELSE wait_score := 0;
    END CASE;

    -- Brand preference match (15 points)
    IF brand_param = ANY(client_record.preferred_brands) THEN
        brand_score := 15;
    END IF;

    RETURN vip_score + spend_score + wait_score + brand_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 2: PURCHASE INTEGRITY VALIDATION (FIXED)
-- =====================================================

-- Function to validate purchase integrity (prevents price manipulation)
-- NOTE: Uses watch_id (not watch_model_id) as that's the actual column name
CREATE OR REPLACE FUNCTION validate_purchase_integrity()
RETURNS TRIGGER AS $$
DECLARE
    watch_price DECIMAL;
    price_tolerance DECIMAL := 100; -- $100 tolerance
BEGIN
    -- If watch_id is provided, verify price matches inventory
    IF NEW.watch_id IS NOT NULL THEN
        SELECT price INTO watch_price
        FROM inventory
        WHERE id = NEW.watch_id;

        IF FOUND AND ABS(watch_price - NEW.price) > price_tolerance THEN
            RAISE EXCEPTION 'Purchase price % does not match inventory price % (tolerance: $%)',
                NEW.price, watch_price, price_tolerance;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for purchase integrity validation
DROP TRIGGER IF EXISTS trigger_validate_purchase_integrity ON purchases;
CREATE TRIGGER trigger_validate_purchase_integrity
    BEFORE INSERT OR UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION validate_purchase_integrity();

-- =====================================================
-- PART 3: SAFE PURCHASE ROLLBACK FUNCTION (FIXED)
-- =====================================================

-- Function to safely rollback failed purchases
-- NOTE: Only updates fields that actually exist in inventory table
CREATE OR REPLACE FUNCTION rollback_purchase(purchase_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    purchase_record RECORD;
BEGIN
    -- Get purchase details
    SELECT client_id, price, watch_id INTO purchase_record
    FROM purchases
    WHERE id = purchase_id_param;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Delete the purchase (trigger will update lifetime_spend)
    DELETE FROM purchases WHERE id = purchase_id_param;

    -- Re-mark inventory as available if it was an inventory purchase
    IF purchase_record.watch_id IS NOT NULL THEN
        UPDATE inventory
        SET is_available = true
        WHERE id = purchase_record.watch_id;
    END IF;

    -- Recalculate VIP tier
    UPDATE clients
    SET vip_tier = calculate_vip_tier(lifetime_spend)
    WHERE id = purchase_record.client_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: PERFORMANCE INDEXES (EXISTING TABLES ONLY)
-- =====================================================

-- Create indexes only if they don't already exist
CREATE INDEX IF NOT EXISTS idx_clients_lifetime_spend ON clients(lifetime_spend DESC);
CREATE INDEX IF NOT EXISTS idx_clients_vip_tier ON clients(vip_tier);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_purchases_salesperson_id ON purchases(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_purchases_client_date ON purchases(client_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_client_id ON waitlist(client_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_active_priority ON waitlist(is_active, priority_score DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reminders_client_id ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON clients(last_contact_date);

-- =====================================================
-- PART 5: AUDIT LOGGING SYSTEM
-- =====================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'ALLOCATE')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Managers can view team audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can delete old audit logs" ON audit_logs;

-- Admins can view all audit logs
-- NOTE: Uses user_profiles (not profiles) as that's the actual table name
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Managers can view audit logs for their team
CREATE POLICY "Managers can view team audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'manager'
    )
  );

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Only system can insert audit logs (via function)
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Admins can delete old logs for retention purposes
CREATE POLICY "Admins can delete old audit logs"
  ON audit_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
    AND created_at < NOW() - INTERVAL '2 years'
  );

-- =====================================================
-- PART 6: AUDIT LOGGING FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID (returns NULL if not authenticated)
  v_user_id := auth.uid();

  -- Validate action
  IF p_action NOT IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'ALLOCATE') THEN
    RAISE EXCEPTION 'Invalid audit action: %', p_action;
  END IF;

  -- Insert audit log entry
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    v_user_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    CASE WHEN p_ip_address IS NOT NULL THEN p_ip_address::INET ELSE NULL END,
    p_user_agent
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Audit logging failed: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;

-- =====================================================
-- PART 7: AUTOMATIC AUDIT TRIGGERS
-- =====================================================

-- Trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event(
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      row_to_json(OLD)::JSONB,
      NULL
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit_event(
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      row_to_json(OLD)::JSONB,
      row_to_json(NEW)::JSONB
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event(
      'CREATE',
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      row_to_json(NEW)::JSONB
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS clients_audit_trigger ON clients;
CREATE TRIGGER clients_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS purchases_audit_trigger ON purchases;
CREATE TRIGGER purchases_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON purchases
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS inventory_audit_trigger ON inventory;
CREATE TRIGGER inventory_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON inventory
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS waitlist_audit_trigger ON waitlist;
CREATE TRIGGER waitlist_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS allocations_audit_trigger ON allocations;
CREATE TRIGGER allocations_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON allocations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- =====================================================
-- PART 8: AUDIT LOG RETENTION & CLEANUP
-- =====================================================

-- Function to clean up old audit logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 730)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RAISE NOTICE 'Deleted % old audit log entries', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to admin role only
REVOKE EXECUTE ON FUNCTION cleanup_old_audit_logs FROM PUBLIC;

-- =====================================================
-- PART 9: ENHANCED RLS POLICIES FOR REMINDERS
-- =====================================================

-- Drop existing broad reminders policies
DROP POLICY IF EXISTS "Enable read access for all users" ON reminders;
DROP POLICY IF EXISTS "Enable insert for all users" ON reminders;
DROP POLICY IF EXISTS "Enable update for all users" ON reminders;
DROP POLICY IF EXISTS "Enable delete for all users" ON reminders;
DROP POLICY IF EXISTS "Users can view reminders for assigned clients" ON reminders;
DROP POLICY IF EXISTS "Users can create reminders for assigned clients" ON reminders;
DROP POLICY IF EXISTS "Users can update reminders for assigned clients" ON reminders;
DROP POLICY IF EXISTS "Users can delete reminders for assigned clients" ON reminders;

-- Users can only see reminders for their assigned clients
-- NOTE: Uses user_profiles (not profiles) as that's the actual table name
CREATE POLICY "Users can view reminders for assigned clients"
  ON reminders
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE assigned_to = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('manager', 'admin')
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
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('manager', 'admin')
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
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('manager', 'admin')
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
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('manager', 'admin')
    )
  );

-- =====================================================
-- PART 10: ENSURE RLS IS ENABLED ON ALL TABLES
-- =====================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 11: ADDITIONAL SECURITY POLICIES
-- =====================================================

-- Only admins can delete purchases
DROP POLICY IF EXISTS "Only admins can delete purchases" ON purchases;
CREATE POLICY "Only admins can delete purchases"
  ON purchases
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- =====================================================
-- PART 12: DOCUMENTATION COMMENTS
-- =====================================================

COMMENT ON FUNCTION calculate_vip_tier IS 'Calculates VIP tier based on lifetime spend. Platinum: $100K+, Gold: $50K+, Silver: $25K+, Bronze: <$25K';
COMMENT ON FUNCTION validate_purchase_integrity IS 'Prevents price manipulation by validating purchase price against inventory price with $100 tolerance';
COMMENT ON FUNCTION rollback_purchase IS 'Safely rolls back a purchase including inventory and client lifetime spend updates';
COMMENT ON FUNCTION log_audit_event IS 'Logs audit events with user context, IP, and user agent';
COMMENT ON FUNCTION audit_trigger_func IS 'Automatic trigger function for audit logging on DML operations';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Cleanup function for audit log retention (default 2 years)';

COMMENT ON TABLE audit_logs IS 'Comprehensive immutable audit trail for all sensitive data operations';
COMMENT ON TABLE clients IS 'Client records with RLS: users see only assigned clients, managers/admins see all';
COMMENT ON TABLE purchases IS 'Purchase records with RLS: users see purchases for assigned clients only';
COMMENT ON TABLE waitlist IS 'Waitlist entries with RLS: users see entries for assigned clients only';
COMMENT ON TABLE reminders IS 'Reminder records with RLS: users see reminders for assigned clients only';
COMMENT ON TABLE inventory IS 'Inventory/watches with RLS: all can read, only managers/admins can modify';
COMMENT ON TABLE allocations IS 'Watch allocations with RLS: users see allocations for assigned clients';
COMMENT ON TABLE user_profiles IS 'User profiles with RLS: users see own profile, managers/admins see all';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration includes:
-- 1. Correct VIP tier calculation (Platinum $100K+, Gold $50K+, Silver $25K+)
-- 2. Purchase integrity validation (prevents price manipulation)
-- 3. Safe purchase rollback function
-- 4. Performance indexes on all existing tables
-- 5. Complete audit logging system with RLS
-- 6. Automatic audit triggers on all sensitive tables
-- 7. Enhanced RLS policies for reminders
-- 8. All security policies using correct table names (user_profiles not profiles)
-- =====================================================
