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

-- Ensure priority score calculation uses correct VIP weights
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

-- Add index on lifetime_spend for performance
CREATE INDEX IF NOT EXISTS idx_clients_lifetime_spend ON clients(lifetime_spend DESC);

-- Add index on vip_tier for filtering
CREATE INDEX IF NOT EXISTS idx_clients_vip_tier ON clients(vip_tier);

-- Add index on assigned_to for RLS performance
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_purchases_salesperson_id ON purchases(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_client_id ON waitlist(client_id);
CREATE INDEX IF NOT EXISTS idx_reminders_client_id ON reminders(client_id);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_purchases_client_date ON purchases(client_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_active_priority ON waitlist(is_active, priority_score DESC) WHERE is_active = true;

-- Function to validate purchase integrity (prevents price manipulation)
CREATE OR REPLACE FUNCTION validate_purchase_integrity()
RETURNS TRIGGER AS $$
DECLARE
    watch_price DECIMAL;
    price_tolerance DECIMAL := 100; -- $100 tolerance
BEGIN
    -- If watch_model_id is provided, verify price matches inventory
    IF NEW.watch_model_id IS NOT NULL THEN
        SELECT price INTO watch_price
        FROM inventory
        WHERE id = NEW.watch_model_id;

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

-- Function to safely rollback failed purchases
CREATE OR REPLACE FUNCTION rollback_purchase(purchase_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    purchase_record RECORD;
BEGIN
    -- Get purchase details
    SELECT client_id, price, watch_model_id INTO purchase_record
    FROM purchases
    WHERE id = purchase_id_param;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Delete the purchase (trigger will update lifetime_spend)
    DELETE FROM purchases WHERE id = purchase_id_param;

    -- Re-mark inventory as available if it was an inventory purchase
    IF purchase_record.watch_model_id IS NOT NULL THEN
        UPDATE inventory
        SET is_available = true, sold_date = NULL
        WHERE id = purchase_record.watch_model_id;
    END IF;

    -- Recalculate VIP tier
    UPDATE clients
    SET vip_tier = calculate_vip_tier(lifetime_spend)
    WHERE id = purchase_record.client_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document security measures
COMMENT ON FUNCTION calculate_vip_tier IS 'Calculates VIP tier based on lifetime spend. Platinum: $100K+, Gold: $50K+, Silver: $25K+, Bronze: <$25K';
COMMENT ON FUNCTION validate_purchase_integrity IS 'Prevents price manipulation by validating purchase price against inventory price with $100 tolerance';
COMMENT ON FUNCTION rollback_purchase IS 'Safely rolls back a purchase including inventory and client lifetime spend updates';
