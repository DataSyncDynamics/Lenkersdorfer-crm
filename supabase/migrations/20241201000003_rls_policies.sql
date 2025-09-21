-- Enable Row Level Security on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
-- Salespeople can only see their assigned clients
CREATE POLICY "Salespeople can view assigned clients" ON clients
    FOR SELECT
    USING (
        assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Salespeople can update assigned clients" ON clients
    FOR UPDATE
    USING (
        assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Managers and admins can insert clients" ON clients
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

-- Policies for inventory table
-- Everyone can view inventory
CREATE POLICY "All authenticated users can view inventory" ON inventory
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only managers and admins can modify inventory
CREATE POLICY "Managers and admins can modify inventory" ON inventory
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

-- Policies for waitlist table
-- Users can see waitlist entries for their assigned clients
CREATE POLICY "Users can view relevant waitlist entries" ON waitlist
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients
            WHERE assigned_to = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Users can modify waitlist for assigned clients" ON waitlist
    FOR ALL
    USING (
        client_id IN (
            SELECT id FROM clients
            WHERE assigned_to = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

-- Policies for allocations table
-- Users can see allocations for their assigned clients
CREATE POLICY "Users can view relevant allocations" ON allocations
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients
            WHERE assigned_to = auth.uid()
        )
        OR allocated_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Users can create allocations for assigned clients" ON allocations
    FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients
            WHERE assigned_to = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Users can update allocations they created" ON allocations
    FOR UPDATE
    USING (
        allocated_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

-- Policies for purchases table
-- Users can see purchases for their assigned clients
CREATE POLICY "Users can view relevant purchases" ON purchases
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients
            WHERE assigned_to = auth.uid()
        )
        OR salesperson_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Users can create purchases for assigned clients" ON purchases
    FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients
            WHERE assigned_to = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

-- Policies for user_profiles table
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Managers and admins can view all profiles
CREATE POLICY "Managers can view all profiles" ON user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

-- Only admins can create and modify user profiles
CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );