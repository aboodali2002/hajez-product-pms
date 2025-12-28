-- ALL-IN-ONE MULTI-TENANT MIGRATION
-- Purpose: Transform single-tenant system to multi-tenant SaaS
-- Run this ENTIRE script in Supabase SQL Editor
--
-- IMPORTANT: Backup your database before running!
-- This script combines all 6 migration files in the correct order

-- ============================================================================
-- MIGRATION 01: Create Companies Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  max_halls INTEGER DEFAULT 7,
  max_users INTEGER DEFAULT 12,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(subscription_status);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at 
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- MIGRATION 02: Add company_id to All Tables
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);

ALTER TABLE public.halls ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_halls_company ON public.halls(company_id);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_bookings_company ON public.bookings(company_id);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);

ALTER TABLE public.services_catalog ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.services_catalog DROP COLUMN IF EXISTS is_global;
CREATE INDEX IF NOT EXISTS idx_services_company ON public.services_catalog(company_id);

ALTER TABLE public.hall_services ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_hall_services_company ON public.hall_services(company_id);

-- Optional tables (conditional)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_templates') THEN
    ALTER TABLE public.pricing_templates ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_pricing_templates_company ON public.pricing_templates(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_days') THEN
    ALTER TABLE public.calendar_days ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_calendar_days_company ON public.calendar_days(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_payments_company ON public.payments(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_services') THEN
    ALTER TABLE public.booking_services ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_booking_services_company ON public.booking_services(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
    ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_packages_company ON public.packages(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_items') THEN
    ALTER TABLE public.package_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_package_items_company ON public.package_items(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rules') THEN
    ALTER TABLE public.pricing_rules ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_pricing_rules_company ON public.pricing_rules(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_overrides') THEN
    ALTER TABLE public.calendar_overrides ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_calendar_overrides_company ON public.calendar_overrides(company_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discounts') THEN
    ALTER TABLE public.discounts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_discounts_company ON public.discounts(company_id);
  END IF;
END $$;

-- ============================================================================
-- MIGRATION 03: Update Role Enum
-- ============================================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

UPDATE public.profiles 
SET role = CASE 
  WHEN role = 'super_admin' THEN 'company_owner'
  WHEN role = 'hall_admin' THEN 'hall_manager'
  ELSE role
END;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('platform_admin', 'company_owner', 'company_admin', 'hall_manager'));

-- ============================================================================
-- MIGRATION 04: Create Demo Company and Migrate Data
-- ============================================================================

DO $$
DECLARE
    v_demo_company_id UUID;
    v_owner_id UUID;
BEGIN
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'admin@mahdi.com' LIMIT 1;
    
    INSERT INTO public.companies (id, name, slug, owner_id, subscription_tier, subscription_status, max_halls, max_users)
    VALUES (gen_random_uuid(), 'Demo Company', 'demo-company', v_owner_id, 'free', 'active', 7, 12)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO v_demo_company_id;
    
    IF v_demo_company_id IS NULL THEN
        SELECT id INTO v_demo_company_id FROM public.companies WHERE slug = 'demo-company';
    END IF;
    
    UPDATE public.profiles SET company_id = v_demo_company_id WHERE company_id IS NULL;
    UPDATE public.halls SET company_id = v_demo_company_id WHERE company_id IS NULL;
    UPDATE public.bookings SET company_id = v_demo_company_id WHERE company_id IS NULL;
    UPDATE public.clients SET company_id = v_demo_company_id WHERE company_id IS NULL;
    UPDATE public.services_catalog SET company_id = v_demo_company_id WHERE company_id IS NULL;
    UPDATE public.hall_services SET company_id = v_demo_company_id WHERE company_id IS NULL;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_templates') THEN
        UPDATE public.pricing_templates SET company_id = v_demo_company_id WHERE company_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_days') THEN
        UPDATE public.calendar_days SET company_id = v_demo_company_id WHERE company_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        UPDATE public.payments SET company_id = v_demo_company_id WHERE company_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_services') THEN
        UPDATE public.booking_services SET company_id = v_demo_company_id WHERE company_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
        UPDATE public.packages SET company_id = v_demo_company_id WHERE company_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_items') THEN
        UPDATE public.package_items SET company_id = v_demo_company_id WHERE company_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rules') THEN
        UPDATE public.pricing_rules SET company_id = v_demo_company_id WHERE company_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_overrides') THEN
        UPDATE public.calendar_overrides SET company_id = v_demo_company_id WHERE company_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discounts') THEN
        UPDATE public.discounts SET company_id = v_demo_company_id WHERE company_id IS NULL;
    END IF;
END $$;

-- ============================================================================
-- MIGRATION 05: Create RLS Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'platform_admin' FROM public.profiles WHERE id = auth.uid() LIMIT 1), false);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_company_owner()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'company_owner' FROM public.profiles WHERE id = auth.uid() LIMIT 1), false);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
BEGIN
    slug := LOWER(input_text);
    slug := REPLACE(slug, ' ', '-');
    slug := REGEXP_REPLACE(slug, '[^a-z0-9-]', '', 'g');
    slug := REGEXP_REPLACE(slug, '-+', '-', 'g');
    slug := TRIM(BOTH '-' FROM slug);
    RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- MIGRATION 06: Update RLS Policies (Abbreviated - see full file for details)
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "authenticated_users_can_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_can_update_own_profile" ON public.profiles;

-- Create company-scoped policies
CREATE POLICY "company_select_policy" ON public.companies FOR SELECT USING (public.is_platform_admin() OR owner_id = auth.uid() OR id = public.current_user_company_id());
CREATE POLICY "company_insert_policy" ON public.companies FOR INSERT WITH CHECK (public.is_platform_admin());
CREATE POLICY "company_update_policy" ON public.companies FOR UPDATE USING (public.is_platform_admin() OR (owner_id = auth.uid() AND id = public.current_user_company_id()));
CREATE POLICY "company_delete_policy" ON public.companies FOR DELETE USING (public.is_platform_admin());

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (public.is_platform_admin() OR (id = auth.uid() AND company_id = public.current_user_company_id()));
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (public.is_platform_admin() OR id = auth.uid() OR (public.is_company_owner() AND company_id = public.current_user_company_id()));
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE USING (public.is_platform_admin() OR (public.is_company_owner() AND company_id = public.current_user_company_id()));

CREATE POLICY "halls_select_policy" ON public.halls FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "halls_insert_policy" ON public.halls FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "halls_update_policy" ON public.halls FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "halls_delete_policy" ON public.halls FOR DELETE USING (public.is_platform_admin() OR (public.is_company_owner() AND company_id = public.current_user_company_id()));

CREATE POLICY "bookings_select_policy" ON public.bookings FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "bookings_insert_policy" ON public.bookings FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "bookings_update_policy" ON public.bookings FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "bookings_delete_policy" ON public.bookings FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id());

CREATE POLICY "clients_select_policy" ON public.clients FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "clients_insert_policy" ON public.clients FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "clients_update_policy" ON public.clients FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "clients_delete_policy" ON public.clients FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id());

CREATE POLICY "services_select_policy" ON public.services_catalog FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "services_insert_policy" ON public.services_catalog FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "services_update_policy" ON public.services_catalog FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "services_delete_policy" ON public.services_catalog FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id());

CREATE POLICY "hall_services_select_policy" ON public.hall_services FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "hall_services_insert_policy" ON public.hall_services FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "hall_services_update_policy" ON public.hall_services FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id());
CREATE POLICY "hall_services_delete_policy" ON public.hall_services FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id());

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_services ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'companies' as table_name, COUNT(*) as row_count FROM public.companies
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles WHERE company_id IS NOT NULL
UNION ALL
SELECT 'halls', COUNT(*) FROM public.halls WHERE company_id IS NOT NULL
UNION ALL
SELECT 'bookings', COUNT(*) FROM public.bookings WHERE company_id IS NOT NULL;
