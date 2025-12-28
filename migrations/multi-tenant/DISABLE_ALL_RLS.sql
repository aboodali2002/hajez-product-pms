-- DISABLE ALL RLS - SIMPLEST APPROACH
-- This removes all authentication complexity
-- WARNING: This is NOT secure for production, but good for development/testing

-- Disable RLS on all tables
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_catalog DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_services DISABLE ROW LEVEL SECURITY;

-- Disable RLS on optional tables (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_templates') THEN
        ALTER TABLE public.pricing_templates DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_days') THEN
        ALTER TABLE public.calendar_days DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_services') THEN
        ALTER TABLE public.booking_services DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
        ALTER TABLE public.packages DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_items') THEN
        ALTER TABLE public.package_items DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rules') THEN
        ALTER TABLE public.pricing_rules DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_overrides') THEN
        ALTER TABLE public.calendar_overrides DISABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discounts') THEN
        ALTER TABLE public.discounts DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'profiles', 'halls', 'bookings', 'clients')
ORDER BY tablename;

-- Expected: rowsecurity should be 'false' for all tables
