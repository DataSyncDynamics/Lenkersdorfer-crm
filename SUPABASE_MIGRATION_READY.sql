-- =====================================================
-- LUXURY WATCH CRM - SECURITY & PERFORMANCE MIGRATION
-- Copy-paste this entire script into Supabase SQL Editor
-- =====================================================

-- PART 1: VIP TIER CORRECTIONS
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

UPDATE clients
SET vip_tier = calculate_vip_tier(lifetime_spend)
WHERE vip_tier != calculate_vip_tier(lifetime_spend);

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
    SELECT vip_tier, lifetime_spend, preferred_brands
    INTO client_record
    FROM clients
    WHERE id = client_id_param;

    CASE client_record.vip_tier
        WHEN 'Platinum' THEN vip_score := 40;
        WHEN 'Gold' THEN vip_score := 30;
        WHEN 'Silver' THEN vip_score := 20;
        WHEN 'Bronze' THEN vip_score := 10;
        ELSE vip_score := 0;
    END CASE;

    CASE
        WHEN client_record.lifetime_spend >= 100000 THEN spend_score := 30;
        WHEN client_record.lifetime_spend >= 50000 THEN spend_score := 20;
        WHEN client_record.lifetime_spend >= 25000 THEN spend_score := 10;
        ELSE spend_score := 0;
    END CASE;

    days_waiting := CURRENT_DATE - wait_start_date_param;
    CASE
        WHEN days_waiting >= 90 THEN wait_score := 15;
        WHEN days_waiting >= 60 THEN wait_score := 10;
        WHEN days_waiting >= 30 THEN wait_score := 5;
        ELSE wait_score := 0;
    END CASE;

    IF brand_param = ANY(client_record.preferred_brands) THEN
        brand_score := 15;
    END IF;

    RETURN vip_score + spend_score + wait_score + brand_score;
END;
$$ LANGUAGE plpgsql;

-- PART 2: PURCHASE INTEGRITY VALIDATION
CREATE OR REPLACE FUNCTION validate_purchase_integrity()
RETURNS TRIGGER AS $$
DECLARE
    watch_price DECIMAL;
    price_tolerance DECIMAL := 100;
BEGIN
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

DROP TRIGGER IF EXISTS trigger_validate_purchase_integrity ON purchases;
CREATE TRIGGER trigger_validate_purchase_integrity
    BEFORE INSERT OR UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION validate_purchase_integrity();

-- PART 3: SAFE PURCHASE ROLLBACK
CREATE OR REPLACE FUNCTION rollback_purchase(purchase_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    purchase_record RECORD;
BEGIN
    SELECT client_id, price, watch_id INTO purchase_record
    FROM purchases
    WHERE id = purchase_id_param;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    DELETE FROM purchases WHERE id = purchase_id_param;

    IF purchase_record.watch_id IS NOT NULL THEN
        UPDATE inventory
        SET is_available = true
        WHERE id = purchase_record.watch_id;
    END IF;

    UPDATE clients
    SET vip_tier = calculate_vip_tier(lifetime_spend)
    WHERE id = purchase_record.client_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- PART 4: PERFORMANCE INDEXES
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

-- PART 5: AUDIT LOGGING TABLE
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Managers can view team audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can delete old audit logs" ON audit_logs;

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin')
  );

CREATE POLICY "Managers can view team audit logs"
  ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'manager')
  );

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can delete old audit logs"
  ON audit_logs FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin')
    AND created_at < NOW() - INTERVAL '2 years'
  );

-- PART 6: AUDIT LOGGING FUNCTIONS
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
  v_user_id := auth.uid();

  IF p_action NOT IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'ALLOCATE') THEN
    RAISE EXCEPTION 'Invalid audit action: %', p_action;
  END IF;

  INSERT INTO audit_logs (
    user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent
  ) VALUES (
    v_user_id, p_action, p_table_name, p_record_id, p_old_values, p_new_values,
    CASE WHEN p_ip_address IS NOT NULL THEN p_ip_address::INET ELSE NULL END, p_user_agent
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Audit logging failed: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event('DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::JSONB, NULL);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit_event('UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event('CREATE', TG_TABLE_NAME, NEW.id, NULL, row_to_json(NEW)::JSONB);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 7: AUDIT TRIGGERS ON ALL TABLES
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

-- PART 8: AUDIT CLEANUP FUNCTION
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

REVOKE EXECUTE ON FUNCTION cleanup_old_audit_logs FROM PUBLIC;

-- PART 9: ENHANCED REMINDERS RLS POLICIES
DROP POLICY IF EXISTS "Enable read access for all users" ON reminders;
DROP POLICY IF EXISTS "Enable insert for all users" ON reminders;
DROP POLICY IF EXISTS "Enable update for all users" ON reminders;
DROP POLICY IF EXISTS "Enable delete for all users" ON reminders;
DROP POLICY IF EXISTS "Users can view reminders for assigned clients" ON reminders;
DROP POLICY IF EXISTS "Users can create reminders for assigned clients" ON reminders;
DROP POLICY IF EXISTS "Users can update reminders for assigned clients" ON reminders;
DROP POLICY IF EXISTS "Users can delete reminders for assigned clients" ON reminders;

CREATE POLICY "Users can view reminders for assigned clients"
  ON reminders FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('manager', 'admin'))
  );

CREATE POLICY "Users can create reminders for assigned clients"
  ON reminders FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('manager', 'admin'))
  );

CREATE POLICY "Users can update reminders for assigned clients"
  ON reminders FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('manager', 'admin'))
  );

CREATE POLICY "Users can delete reminders for assigned clients"
  ON reminders FOR DELETE USING (
    client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role IN ('manager', 'admin'))
  );

-- PART 10: ENSURE RLS ENABLED
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- PART 11: PURCHASE DELETION POLICY
DROP POLICY IF EXISTS "Only admins can delete purchases" ON purchases;
CREATE POLICY "Only admins can delete purchases"
  ON purchases FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin')
  );

-- =====================================================
-- MIGRATION COMPLETE!
-- Includes:
-- - VIP tier calculation (Platinum $100K+, Gold $50K+, Silver $25K+)
-- - Purchase integrity validation
-- - Safe rollback function
-- - Performance indexes
-- - Complete audit logging system
-- - Enhanced RLS policies
-- =====================================================
