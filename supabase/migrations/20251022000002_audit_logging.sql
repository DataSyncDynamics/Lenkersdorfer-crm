-- =====================================================
-- AUDIT LOGGING SYSTEM
-- Phase 4: Security Remediation - Comprehensive Audit Trail
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

-- Composite index for user activity queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Managers can view audit logs for their team
CREATE POLICY "Managers can view team audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
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

-- No updates or deletes allowed (immutable audit trail)
-- Admins can delete old logs for retention purposes
CREATE POLICY "Admins can delete old audit logs"
  ON audit_logs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    AND created_at < NOW() - INTERVAL '2 years'
  );

-- =====================================================
-- AUDIT LOGGING FUNCTION
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
-- AUTOMATIC AUDIT TRIGGERS
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
-- AUDIT LOG RETENTION POLICY
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
-- HELPFUL AUDIT QUERY VIEWS
-- =====================================================

-- View for recent user activity
CREATE OR REPLACE VIEW recent_user_activity AS
SELECT
  al.id,
  al.user_id,
  p.email as user_email,
  p.full_name as user_name,
  al.action,
  al.table_name,
  al.record_id,
  al.created_at,
  al.ip_address
FROM audit_logs al
LEFT JOIN profiles p ON p.id = al.user_id
WHERE al.created_at > NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;

-- View for client data changes
CREATE OR REPLACE VIEW client_audit_trail AS
SELECT
  al.id,
  al.user_id,
  p.email as user_email,
  al.action,
  al.record_id as client_id,
  c.name as client_name,
  al.old_values,
  al.new_values,
  al.created_at
FROM audit_logs al
LEFT JOIN profiles p ON p.id = al.user_id
LEFT JOIN clients c ON c.id = al.record_id
WHERE al.table_name = 'clients'
ORDER BY al.created_at DESC;

-- View for purchase audit trail
CREATE OR REPLACE VIEW purchase_audit_trail AS
SELECT
  al.id,
  al.user_id,
  p.email as user_email,
  al.action,
  al.record_id as purchase_id,
  pur.brand,
  pur.model,
  pur.price,
  al.old_values,
  al.new_values,
  al.created_at
FROM audit_logs al
LEFT JOIN profiles p ON p.id = al.user_id
LEFT JOIN purchases pur ON pur.id = al.record_id
WHERE al.table_name = 'purchases'
ORDER BY al.created_at DESC;

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive immutable audit trail for all sensitive data operations';
COMMENT ON FUNCTION log_audit_event IS 'Logs audit events with user context, IP, and user agent';
COMMENT ON FUNCTION audit_trigger_func IS 'Automatic trigger function for audit logging on DML operations';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Cleanup function for audit log retention (default 2 years)';
COMMENT ON VIEW recent_user_activity IS 'Shows recent user activity across all tables (7 days)';
COMMENT ON VIEW client_audit_trail IS 'Complete audit trail for client data changes';
COMMENT ON VIEW purchase_audit_trail IS 'Complete audit trail for purchase data changes';
