-- Migration 04: Create Demo Company and Migrate Existing Data
-- Purpose: Move all existing data into a "Demo Company"
-- Run Order: FOURTH

-- Step 1: Create Demo Company
DO $$
DECLARE
    v_demo_company_id UUID;
    v_owner_id UUID;
BEGIN
    -- Get the first existing user (or create one if none exists)
    SELECT id INTO v_owner_id 
    FROM auth.users 
    WHERE email = 'admin@mahdi.com' 
    LIMIT 1;
    
    -- If no user exists, we'll create the company without an owner for now
    -- The owner will be set when the first user logs in
    
    -- Create Demo Company
    INSERT INTO public.companies (
        id,
        name,
        slug,
        owner_id,
        subscription_tier,
        subscription_status,
        max_halls,
        max_users
    ) VALUES (
        gen_random_uuid(),
        'Demo Company',
        'demo-company',
        v_owner_id,
        'free',
        'active',
        7,
        12
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO v_demo_company_id;
    
    -- If company already exists, get its ID
    IF v_demo_company_id IS NULL THEN
        SELECT id INTO v_demo_company_id 
        FROM public.companies 
        WHERE slug = 'demo-company';
    END IF;
    
    RAISE NOTICE 'Demo Company ID: %', v_demo_company_id;
    
    -- Step 2: Migrate all existing profiles
    UPDATE public.profiles 
    SET company_id = v_demo_company_id
    WHERE company_id IS NULL;
    
    RAISE NOTICE 'Migrated % profiles', (SELECT COUNT(*) FROM public.profiles WHERE company_id = v_demo_company_id);
    
    -- Step 3: Migrate all existing halls
    UPDATE public.halls 
    SET company_id = v_demo_company_id
    WHERE company_id IS NULL;
    
    RAISE NOTICE 'Migrated % halls', (SELECT COUNT(*) FROM public.halls WHERE company_id = v_demo_company_id);
    
    -- Step 4: Migrate all existing bookings
    UPDATE public.bookings 
    SET company_id = v_demo_company_id
    WHERE company_id IS NULL;
    
    RAISE NOTICE 'Migrated % bookings', (SELECT COUNT(*) FROM public.bookings WHERE company_id = v_demo_company_id);
    
    -- Step 5: Migrate all existing clients
    UPDATE public.clients 
    SET company_id = v_demo_company_id
    WHERE company_id IS NULL;
    
    RAISE NOTICE 'Migrated % clients', (SELECT COUNT(*) FROM public.clients WHERE company_id = v_demo_company_id);
    
    -- Step 6: Migrate all existing services
    UPDATE public.services_catalog 
    SET company_id = v_demo_company_id
    WHERE company_id IS NULL;
    
    RAISE NOTICE 'Migrated % services', (SELECT COUNT(*) FROM public.services_catalog WHERE company_id = v_demo_company_id);
    
    -- Step 7: Migrate all existing hall_services
    UPDATE public.hall_services 
    SET company_id = v_demo_company_id
    WHERE company_id IS NULL;
    
    -- Step 8: Migrate optional tables (if they exist)
    
    -- pricing_templates
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_templates') THEN
        UPDATE public.pricing_templates 
        SET company_id = v_demo_company_id
        WHERE company_id IS NULL;
    END IF;
    
    -- calendar_days
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_days') THEN
        UPDATE public.calendar_days 
        SET company_id = v_demo_company_id
        WHERE company_id IS NULL;
    END IF;
    
    -- payments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        UPDATE public.payments 
        SET company_id = v_demo_company_id
        WHERE company_id IS NULL;
    END IF;
    
    -- booking_services
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_services') THEN
        UPDATE public.booking_services 
        SET company_id = v_demo_company_id
        WHERE company_id IS NULL;
    END IF;
    
    -- packages
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
        UPDATE public.packages 
        SET company_id = v_demo_company_id
        WHERE company_id IS NULL;
    END IF;
    
    -- package_items
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_items') THEN
        UPDATE public.package_items 
        SET company_id = v_demo_company_id
        WHERE company_id IS NULL;
    END IF;
    
    -- pricing_rules
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rules') THEN
        UPDATE public.pricing_rules 
        SET company_id = v_demo_company_id
        WHERE company_id IS NULL;
    END IF;
    
    -- calendar_overrides
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_overrides') THEN
        UPDATE public.calendar_overrides 
        SET company_id = v_demo_company_id
        WHERE company_id IS NULL;
    END IF;
    
    -- discounts
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discounts') THEN
        UPDATE public.discounts 
        SET company_id = v_demo_company_id
        WHERE company_id IS NULL;
    END IF;
    
    RAISE NOTICE '✅ Demo Company migration complete!';
END $$;

-- Verify migration
SELECT 
    'companies' as table_name,
    COUNT(*) as row_count
FROM public.companies
UNION ALL
SELECT 
    'profiles',
    COUNT(*)
FROM public.profiles
WHERE company_id = (SELECT id FROM public.companies WHERE slug = 'demo-company')
UNION ALL
SELECT 
    'halls',
    COUNT(*)
FROM public.halls
WHERE company_id = (SELECT id FROM public.companies WHERE slug = 'demo-company')
UNION ALL
SELECT 
    'bookings',
    COUNT(*)
FROM public.bookings
WHERE company_id = (SELECT id FROM public.companies WHERE slug = 'demo-company');
