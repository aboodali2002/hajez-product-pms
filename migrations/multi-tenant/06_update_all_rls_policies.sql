-- Migration 06: Update ALL RLS Policies for Multi-Tenancy
-- Purpose: Enforce strict company isolation across all tables
-- Run Order: SIXTH (FINAL)

-- ============================================================================
-- PART 1: Drop ALL Existing Policies
-- ============================================================================

-- Drop policies on companies
DROP POLICY IF EXISTS "owners_read_own_company" ON public.companies;
DROP POLICY IF EXISTS "platform_admin_manage_companies" ON public.companies;

-- Drop policies on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_super_admin_select_all" ON public.profiles;
DROP POLICY IF EXISTS "allow_super_admin_update_all" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_can_read_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_users_can_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "company_users_read_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;

-- Drop policies on halls
DROP POLICY IF EXISTS "Halls are viewable by everyone." ON public.halls;
DROP POLICY IF EXISTS "Super Admins can insert halls." ON public.halls;
DROP POLICY IF EXISTS "Super Admins can update halls." ON public.halls;

-- Drop policies on services_catalog
DROP POLICY IF EXISTS "Services are viewable by everyone." ON public.services_catalog;
DROP POLICY IF EXISTS "Super Admins can manage services." ON public.services_catalog;

-- Drop policies on hall_services
DROP POLICY IF EXISTS "Hall Services are viewable by everyone." ON public.hall_services;
DROP POLICY IF EXISTS "Admins can manage hall services." ON public.hall_services;

-- Drop policies on pricing_templates (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_templates') THEN
        DROP POLICY IF EXISTS "Pricing Templates are viewable by everyone." ON public.pricing_templates;
        DROP POLICY IF EXISTS "Admins can manage pricing templates." ON public.pricing_templates;
    END IF;
END $$;

-- Drop policies on calendar_days (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_days') THEN
        DROP POLICY IF EXISTS "Public can view calendar days (stripped)." ON public.calendar_days;
        DROP POLICY IF EXISTS "Admins can view full calendar details." ON public.calendar_days;
        DROP POLICY IF EXISTS "Admins can manage calendar days." ON public.calendar_days;
    END IF;
END $$;

-- ============================================================================
-- PART 2: Create Company-Scoped RLS Policies
-- ============================================================================

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================

-- SELECT: Users can read their own company, platform admins see all
CREATE POLICY "company_select_policy" ON public.companies
FOR SELECT
USING (
    public.is_platform_admin()
    OR owner_id = auth.uid()
    OR id = public.current_user_company_id()
);

-- INSERT: Only platform admins (via server action during signup)
CREATE POLICY "company_insert_policy" ON public.companies
FOR INSERT
WITH CHECK (public.is_platform_admin());

-- UPDATE: Company owners and platform admins
CREATE POLICY "company_update_policy" ON public.companies
FOR UPDATE
USING (
    public.is_platform_admin()
    OR (owner_id = auth.uid() AND id = public.current_user_company_id())
);

-- DELETE: Only platform admins
CREATE POLICY "company_delete_policy" ON public.companies
FOR DELETE
USING (public.is_platform_admin());

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- SELECT: Users can read profiles in their company
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

-- INSERT: Users can insert their own profile, platform admins can insert any
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT
WITH CHECK (
    public.is_platform_admin()
    OR (id = auth.uid() AND company_id = public.current_user_company_id())
);

-- UPDATE: Users can update their own profile, company owners can update company users
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE
USING (
    public.is_platform_admin()
    OR id = auth.uid()
    OR (public.is_company_owner() AND company_id = public.current_user_company_id())
);

-- DELETE: Only platform admins and company owners
CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE
USING (
    public.is_platform_admin()
    OR (public.is_company_owner() AND company_id = public.current_user_company_id())
);

-- ============================================================================
-- HALLS TABLE
-- ============================================================================

-- SELECT: Company users can read their company's halls
CREATE POLICY "halls_select_policy" ON public.halls
FOR SELECT
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

-- INSERT: Company owners and admins can create halls
CREATE POLICY "halls_insert_policy" ON public.halls
FOR INSERT
WITH CHECK (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

-- UPDATE: Company owners and admins can update halls
CREATE POLICY "halls_update_policy" ON public.halls
FOR UPDATE
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

-- DELETE: Company owners and platform admins
CREATE POLICY "halls_delete_policy" ON public.halls
FOR DELETE
USING (
    public.is_platform_admin()
    OR (public.is_company_owner() AND company_id = public.current_user_company_id())
);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================

CREATE POLICY "bookings_select_policy" ON public.bookings
FOR SELECT
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "bookings_insert_policy" ON public.bookings
FOR INSERT
WITH CHECK (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "bookings_update_policy" ON public.bookings
FOR UPDATE
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "bookings_delete_policy" ON public.bookings
FOR DELETE
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================

CREATE POLICY "clients_select_policy" ON public.clients
FOR SELECT
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "clients_insert_policy" ON public.clients
FOR INSERT
WITH CHECK (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "clients_update_policy" ON public.clients
FOR UPDATE
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "clients_delete_policy" ON public.clients
FOR DELETE
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

-- ============================================================================
-- SERVICES_CATALOG TABLE (NOW COMPANY-SCOPED)
-- ============================================================================

CREATE POLICY "services_select_policy" ON public.services_catalog
FOR SELECT
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "services_insert_policy" ON public.services_catalog
FOR INSERT
WITH CHECK (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "services_update_policy" ON public.services_catalog
FOR UPDATE
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "services_delete_policy" ON public.services_catalog
FOR DELETE
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

-- ============================================================================
-- HALL_SERVICES TABLE
-- ============================================================================

CREATE POLICY "hall_services_select_policy" ON public.hall_services
FOR SELECT
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "hall_services_insert_policy" ON public.hall_services
FOR INSERT
WITH CHECK (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "hall_services_update_policy" ON public.hall_services
FOR UPDATE
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

CREATE POLICY "hall_services_delete_policy" ON public.hall_services
FOR DELETE
USING (
    public.is_platform_admin()
    OR company_id = public.current_user_company_id()
);

-- ============================================================================
-- PART 3: Optional Tables (Conditional RLS)
-- ============================================================================

-- PRICING_TEMPLATES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_templates') THEN
        EXECUTE 'CREATE POLICY "pricing_templates_select_policy" ON public.pricing_templates FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "pricing_templates_insert_policy" ON public.pricing_templates FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "pricing_templates_update_policy" ON public.pricing_templates FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "pricing_templates_delete_policy" ON public.pricing_templates FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
    END IF;
END $$;

-- CALENDAR_DAYS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_days') THEN
        EXECUTE 'CREATE POLICY "calendar_days_select_policy" ON public.calendar_days FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "calendar_days_insert_policy" ON public.calendar_days FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "calendar_days_update_policy" ON public.calendar_days FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "calendar_days_delete_policy" ON public.calendar_days FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
    END IF;
END $$;

-- PAYMENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        EXECUTE 'CREATE POLICY "payments_select_policy" ON public.payments FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "payments_insert_policy" ON public.payments FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "payments_update_policy" ON public.payments FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "payments_delete_policy" ON public.payments FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
    END IF;
END $$;

-- BOOKING_SERVICES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_services') THEN
        EXECUTE 'CREATE POLICY "booking_services_select_policy" ON public.booking_services FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "booking_services_insert_policy" ON public.booking_services FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "booking_services_update_policy" ON public.booking_services FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "booking_services_delete_policy" ON public.booking_services FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
    END IF;
END $$;

-- PACKAGES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
        EXECUTE 'CREATE POLICY "packages_select_policy" ON public.packages FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "packages_insert_policy" ON public.packages FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "packages_update_policy" ON public.packages FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "packages_delete_policy" ON public.packages FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
    END IF;
END $$;

-- PACKAGE_ITEMS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_items') THEN
        EXECUTE 'CREATE POLICY "package_items_select_policy" ON public.package_items FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "package_items_insert_policy" ON public.package_items FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "package_items_update_policy" ON public.package_items FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "package_items_delete_policy" ON public.package_items FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
    END IF;
END $$;

-- PRICING_RULES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rules') THEN
        EXECUTE 'CREATE POLICY "pricing_rules_select_policy" ON public.pricing_rules FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "pricing_rules_insert_policy" ON public.pricing_rules FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "pricing_rules_update_policy" ON public.pricing_rules FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "pricing_rules_delete_policy" ON public.pricing_rules FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
    END IF;
END $$;

-- CALENDAR_OVERRIDES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_overrides') THEN
        EXECUTE 'CREATE POLICY "calendar_overrides_select_policy" ON public.calendar_overrides FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "calendar_overrides_insert_policy" ON public.calendar_overrides FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "calendar_overrides_update_policy" ON public.calendar_overrides FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "calendar_overrides_delete_policy" ON public.calendar_overrides FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
    END IF;
END $$;

-- DISCOUNTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discounts') THEN
        EXECUTE 'CREATE POLICY "discounts_select_policy" ON public.discounts FOR SELECT USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "discounts_insert_policy" ON public.discounts FOR INSERT WITH CHECK (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "discounts_update_policy" ON public.discounts FOR UPDATE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
        EXECUTE 'CREATE POLICY "discounts_delete_policy" ON public.discounts FOR DELETE USING (public.is_platform_admin() OR company_id = public.current_user_company_id())';
    END IF;
END $$;

-- ============================================================================
-- PART 4: Ensure RLS is Enabled on All Tables
-- ============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_services ENABLE ROW LEVEL SECURITY;

-- Enable RLS on optional tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_templates') THEN
        ALTER TABLE public.pricing_templates ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_days') THEN
        ALTER TABLE public.calendar_days ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_services') THEN
        ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
        ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_items') THEN
        ALTER TABLE public.package_items ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rules') THEN
        ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_overrides') THEN
        ALTER TABLE public.calendar_overrides ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discounts') THEN
        ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
