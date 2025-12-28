-- Migration 02: Add company_id to All Tables
-- Purpose: Enable row-level isolation for multi-tenancy
-- Run Order: SECOND (after companies table exists)

-- Add company_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);

-- Add company_id to halls
ALTER TABLE public.halls 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_halls_company ON public.halls(company_id);

-- Add company_id to bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bookings_company ON public.bookings(company_id);

-- Add company_id to clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);

-- Add company_id to services_catalog (CRITICAL: was global, now company-scoped)
ALTER TABLE public.services_catalog 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Remove is_global column (no longer needed)
ALTER TABLE public.services_catalog 
DROP COLUMN IF EXISTS is_global;

CREATE INDEX IF NOT EXISTS idx_services_company ON public.services_catalog(company_id);

-- Add company_id to hall_services
ALTER TABLE public.hall_services 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_hall_services_company ON public.hall_services(company_id);

-- Add company_id to pricing_templates (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_templates') THEN
    ALTER TABLE public.pricing_templates 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_pricing_templates_company ON public.pricing_templates(company_id);
  END IF;
END $$;

-- Add company_id to calendar_days (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_days') THEN
    ALTER TABLE public.calendar_days 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_calendar_days_company ON public.calendar_days(company_id);
  END IF;
END $$;

-- Add company_id to payments (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    ALTER TABLE public.payments 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_payments_company ON public.payments(company_id);
  END IF;
END $$;

-- Add company_id to booking_services (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_services') THEN
    ALTER TABLE public.booking_services 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_booking_services_company ON public.booking_services(company_id);
  END IF;
END $$;

-- Add company_id to packages (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
    ALTER TABLE public.packages 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_packages_company ON public.packages(company_id);
  END IF;
END $$;

-- Add company_id to package_items (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_items') THEN
    ALTER TABLE public.package_items 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_package_items_company ON public.package_items(company_id);
  END IF;
END $$;

-- Add company_id to pricing_rules (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rules') THEN
    ALTER TABLE public.pricing_rules 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_pricing_rules_company ON public.pricing_rules(company_id);
  END IF;
END $$;

-- Add company_id to calendar_overrides (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_overrides') THEN
    ALTER TABLE public.calendar_overrides 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_calendar_overrides_company ON public.calendar_overrides(company_id);
  END IF;
END $$;

-- Add company_id to discounts (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discounts') THEN
    ALTER TABLE public.discounts 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_discounts_company ON public.discounts(company_id);
  END IF;
END $$;

-- Verify columns were added
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND column_name = 'company_id'
ORDER BY table_name;
