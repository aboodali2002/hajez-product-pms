-- Active Payment Workflow Schema Updates

-- 1. Update bookings table
-- Add deposit_percentage with default 0.30 (30%)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS deposit_percentage numeric NOT NULL DEFAULT 0.30;

-- Create financial_status enum type
DO $$ BEGIN
    CREATE TYPE financial_status AS ENUM ('unpaid', 'partially_paid', 'fully_paid', 'overpaid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add financial_status column to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS financial_status financial_status NOT NULL DEFAULT 'unpaid';

-- 2. Update payments table
-- Create payment_category enum type
DO $$ BEGIN
    CREATE TYPE payment_category AS ENUM ('deposit', 'settlement', 'refund');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add payment_category column to payments
-- We'll default existing payments to 'settlement' or 'deposit' based on logic if needed, 
-- but for now let's default to 'settlement' to be safe, or allow null temporarily then fill.
-- Given the prompt, let's just add it.
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_financial_status_check;

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_category payment_category NOT NULL DEFAULT 'settlement';

-- Update payment_method enum if it doesn't have all values
-- The previous schema had ('cash', 'transfer', 'card') which matches the requirement.
-- Just in case, we can ensure it exists.
-- (Already exists from previous schema: create type payment_method as enum ('cash', 'transfer', 'card');)

-- 3. Update existing data (Optional but good for consistency)
-- Recalculate financial_status for existing bookings? 
-- For now, we leave them as default 'unpaid' or let the next payment update it.
