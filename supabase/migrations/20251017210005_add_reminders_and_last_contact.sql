-- Migration: Add reminders table and last_contact_date to clients
-- Created: 2025-10-17
-- Purpose: Enable custom reminders and track last client contact for tiered follow-ups

-- Add last_contact_date column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP;

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reminder_date TIMESTAMP NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('follow-up', 'call-back', 'meeting', 'custom')),
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Index for efficient querying of active reminders
  CONSTRAINT valid_completion CHECK (
    (is_completed = FALSE AND completed_at IS NULL) OR
    (is_completed = TRUE AND completed_at IS NOT NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_client_id ON reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date) WHERE is_completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_reminders_active ON reminders(is_completed, reminder_date);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact ON clients(last_contact_date);

-- Enable Row Level Security
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reminders (allow all for authenticated users for now)
CREATE POLICY "Enable read access for all users" ON reminders
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON reminders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON reminders
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON reminders
  FOR DELETE USING (true);

-- Function to update last_contact_date
CREATE OR REPLACE FUNCTION update_client_last_contact(p_client_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE clients
  SET last_contact_date = NOW()
  WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a reminder
CREATE OR REPLACE FUNCTION complete_reminder(p_reminder_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reminders
  SET is_completed = TRUE,
      completed_at = NOW()
  WHERE id = p_reminder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active reminders (due today or overdue)
CREATE OR REPLACE FUNCTION get_active_reminders()
RETURNS TABLE (
  id UUID,
  client_id UUID,
  client_name TEXT,
  reminder_date TIMESTAMP,
  reminder_type TEXT,
  notes TEXT,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.client_id,
    c.name as client_name,
    r.reminder_date,
    r.reminder_type,
    r.notes,
    EXTRACT(DAY FROM NOW() - r.reminder_date)::INTEGER as days_overdue
  FROM reminders r
  JOIN clients c ON r.client_id = c.id
  WHERE r.is_completed = FALSE
    AND r.reminder_date <= NOW()
  ORDER BY r.reminder_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming reminders (next 7 days)
CREATE OR REPLACE FUNCTION get_upcoming_reminders(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  client_id UUID,
  client_name TEXT,
  reminder_date TIMESTAMP,
  reminder_type TEXT,
  notes TEXT,
  days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.client_id,
    c.name as client_name,
    r.reminder_date,
    r.reminder_type,
    r.notes,
    EXTRACT(DAY FROM r.reminder_date - NOW())::INTEGER as days_until
  FROM reminders r
  JOIN clients c ON r.client_id = c.id
  WHERE r.is_completed = FALSE
    AND r.reminder_date > NOW()
    AND r.reminder_date <= NOW() + (days_ahead || ' days')::INTERVAL
  ORDER BY r.reminder_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TABLE reminders IS 'Stores custom reminders for client follow-ups and scheduled interactions';
COMMENT ON COLUMN clients.last_contact_date IS 'Timestamp of last contact with client for tiered follow-up tracking';
