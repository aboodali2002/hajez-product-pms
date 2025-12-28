-- Add base_price to halls
ALTER TABLE halls ADD COLUMN IF NOT EXISTS base_price numeric DEFAULT 0;

-- PRICING RULES
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hall_id uuid REFERENCES halls(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  rule_level int NOT NULL CHECK (rule_level IN (1, 2, 3)), -- 1=DayOfWeek, 2=Season, 3=Special
  start_date date, -- Nullable for Level 1 (DayOfWeek)
  end_date date,   -- Nullable for Level 1
  days_of_week int[], -- Array of integers 0-6
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('fixed', 'flat', 'percent')),
  adjustment_value numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- CALENDAR OVERRIDES (Manual single-day prices)
CREATE TABLE IF NOT EXISTS calendar_overrides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hall_id uuid REFERENCES halls(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(hall_id, date)
);

-- DISCOUNTS
CREATE TABLE IF NOT EXISTS discounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hall_id uuid REFERENCES halls(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('percent', 'flat')),
  value numeric NOT NULL,
  min_advance_booking_days int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS POLICIES

-- Enable RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Policies for pricing_rules
CREATE POLICY "Pricing rules are viewable by everyone." ON pricing_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage pricing rules." ON pricing_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'super_admin' OR assigned_hall_id = pricing_rules.hall_id)
    )
  );

-- Policies for calendar_overrides
CREATE POLICY "Calendar overrides are viewable by everyone." ON calendar_overrides
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage calendar overrides." ON calendar_overrides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'super_admin' OR assigned_hall_id = calendar_overrides.hall_id)
    )
  );

-- Policies for discounts
CREATE POLICY "Discounts are viewable by everyone." ON discounts
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage discounts." ON discounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'super_admin' OR assigned_hall_id = discounts.hall_id)
    )
  );
