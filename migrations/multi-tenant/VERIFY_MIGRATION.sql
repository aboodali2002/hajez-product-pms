-- Quick verification query
-- Run this in Supabase SQL Editor to check if company_id exists

-- Check if company_id column exists in profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check actual profile data
SELECT id, email, role, company_id, assigned_hall_id
FROM public.profiles
LIMIT 5;

-- Check if Demo Company exists
SELECT * FROM public.companies WHERE slug = 'demo-company';
