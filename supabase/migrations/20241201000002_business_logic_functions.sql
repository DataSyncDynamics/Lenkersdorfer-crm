-- Function to calculate VIP tier based on lifetime spend
CREATE OR REPLACE FUNCTION calculate_vip_tier(spend DECIMAL)
RETURNS vip_tier AS $$
BEGIN
    CASE
        WHEN spend >= 500000 THEN RETURN 'Platinum';
        WHEN spend >= 200000 THEN RETURN 'Gold';
        WHEN spend >= 100000 THEN RETURN 'Silver';
        ELSE RETURN 'Bronze';
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate priority score for waitlist
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

    -- Lifetime spend scoring (€500K+=30, €200K+=20, €100K+=10)
    CASE
        WHEN client_record.lifetime_spend >= 500000 THEN spend_score := 30;
        WHEN client_record.lifetime_spend >= 200000 THEN spend_score := 20;
        WHEN client_record.lifetime_spend >= 100000 THEN spend_score := 10;
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

-- Function to update client VIP tier when lifetime spend changes
CREATE OR REPLACE FUNCTION update_client_vip_tier()
RETURNS TRIGGER AS $$
BEGIN
    NEW.vip_tier := calculate_vip_tier(NEW.lifetime_spend);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update waitlist priority scores
CREATE OR REPLACE FUNCTION update_waitlist_priority_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.priority_score := calculate_priority_score(NEW.client_id, NEW.brand, NEW.wait_start_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission rate based on watch category
CREATE OR REPLACE FUNCTION calculate_commission_rate(category TEXT)
RETURNS DECIMAL AS $$
BEGIN
    CASE LOWER(category)
        WHEN 'complicated' THEN RETURN 20.00;
        WHEN 'gold' THEN RETURN 15.00;
        WHEN 'steel' THEN RETURN 10.00;
        ELSE RETURN 10.00;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update client lifetime spend when purchase is made
CREATE OR REPLACE FUNCTION update_client_lifetime_spend()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE clients
        SET lifetime_spend = lifetime_spend + NEW.price
        WHERE id = NEW.client_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE clients
        SET lifetime_spend = lifetime_spend - OLD.price
        WHERE id = OLD.client_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get top waitlist candidates for a watch
CREATE OR REPLACE FUNCTION get_waitlist_candidates(
    brand_param TEXT,
    model_param TEXT,
    limit_param INTEGER DEFAULT 3
)
RETURNS TABLE (
    waitlist_id UUID,
    client_id UUID,
    client_name TEXT,
    vip_tier vip_tier,
    priority_score INTEGER,
    days_waiting INTEGER,
    lifetime_spend DECIMAL,
    wait_start_date DATE,
    reasoning TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id as waitlist_id,
        w.client_id,
        c.name as client_name,
        c.vip_tier,
        w.priority_score,
        (CURRENT_DATE - w.wait_start_date)::INTEGER as days_waiting,
        c.lifetime_spend,
        w.wait_start_date,
        CONCAT(
            'Priority Score: ', w.priority_score,
            ' (VIP: ', c.vip_tier,
            ', Spend: €', ROUND(c.lifetime_spend),
            ', Wait: ', (CURRENT_DATE - w.wait_start_date), ' days',
            CASE WHEN brand_param = ANY(c.preferred_brands) THEN ', Preferred Brand' ELSE '' END,
            ')'
        ) as reasoning
    FROM waitlist w
    JOIN clients c ON w.client_id = c.id
    WHERE w.brand = brand_param
        AND w.model = model_param
        AND w.is_active = true
    ORDER BY w.priority_score DESC, w.wait_start_date ASC
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Function to allocate watch to client
CREATE OR REPLACE FUNCTION allocate_watch(
    client_id_param UUID,
    watch_id_param UUID,
    allocated_by_param UUID
)
RETURNS UUID AS $$
DECLARE
    allocation_id UUID;
    watch_record RECORD;
    commission_rate_val DECIMAL;
    commission_amount_val DECIMAL;
BEGIN
    -- Get watch information
    SELECT price, category INTO watch_record
    FROM inventory
    WHERE id = watch_id_param AND is_available = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Watch not available for allocation';
    END IF;

    -- Calculate commission
    commission_rate_val := calculate_commission_rate(watch_record.category);
    commission_amount_val := watch_record.price * (commission_rate_val / 100);

    -- Create allocation
    INSERT INTO allocations (
        client_id,
        watch_id,
        commission_rate,
        commission_amount,
        allocated_by
    ) VALUES (
        client_id_param,
        watch_id_param,
        commission_rate_val,
        commission_amount_val,
        allocated_by_param
    ) RETURNING id INTO allocation_id;

    -- Mark watch as unavailable
    UPDATE inventory SET is_available = false WHERE id = watch_id_param;

    -- Deactivate waitlist entries for this client and watch
    UPDATE waitlist
    SET is_active = false
    WHERE client_id = client_id_param
        AND brand = (SELECT brand FROM inventory WHERE id = watch_id_param)
        AND model = (SELECT model FROM inventory WHERE id = watch_id_param);

    RETURN allocation_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_client_vip_tier
    BEFORE UPDATE OF lifetime_spend ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_client_vip_tier();

CREATE TRIGGER trigger_update_waitlist_priority_score
    BEFORE INSERT OR UPDATE ON waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_waitlist_priority_score();

CREATE TRIGGER trigger_update_client_lifetime_spend
    AFTER INSERT OR DELETE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_client_lifetime_spend();