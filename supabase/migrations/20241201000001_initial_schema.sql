-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE vip_tier AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum');
CREATE TYPE allocation_status AS ENUM ('pending', 'confirmed', 'delivered', 'cancelled');
CREATE TYPE user_role AS ENUM ('salesperson', 'manager', 'admin');

-- Create clients table
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    vip_tier vip_tier DEFAULT 'Bronze',
    lifetime_spend DECIMAL(12,2) DEFAULT 0.00,
    assigned_to UUID REFERENCES auth.users(id),
    preferred_brands TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    reference_number TEXT UNIQUE,
    price DECIMAL(12,2) NOT NULL,
    retail_price DECIMAL(12,2),
    category TEXT NOT NULL, -- 'steel', 'gold', 'complicated'
    availability_date DATE,
    is_available BOOLEAN DEFAULT true,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waitlist table
CREATE TABLE waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    reference_number TEXT,
    priority_score INTEGER DEFAULT 0,
    wait_start_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create allocations table
CREATE TABLE allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    watch_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    allocation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_date DATE,
    status allocation_status DEFAULT 'pending',
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    allocated_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table (for historical tracking)
CREATE TABLE purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    watch_id UUID REFERENCES inventory(id),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    purchase_date DATE DEFAULT CURRENT_DATE,
    salesperson_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users profile table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    role user_role DEFAULT 'salesperson',
    team TEXT,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_clients_vip_tier ON clients(vip_tier);
CREATE INDEX idx_clients_lifetime_spend ON clients(lifetime_spend DESC);
CREATE INDEX idx_waitlist_client_id ON waitlist(client_id);
CREATE INDEX idx_waitlist_priority_score ON waitlist(priority_score DESC);
CREATE INDEX idx_waitlist_brand_model ON waitlist(brand, model);
CREATE INDEX idx_waitlist_active ON waitlist(is_active) WHERE is_active = true;
CREATE INDEX idx_inventory_brand_model ON inventory(brand, model);
CREATE INDEX idx_inventory_available ON inventory(is_available) WHERE is_available = true;
CREATE INDEX idx_allocations_client_id ON allocations(client_id);
CREATE INDEX idx_allocations_status ON allocations(status);
CREATE INDEX idx_purchases_client_id ON purchases(client_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allocations_updated_at BEFORE UPDATE ON allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();