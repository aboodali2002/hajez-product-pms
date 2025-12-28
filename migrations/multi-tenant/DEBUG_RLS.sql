-- Debug RLS Policies - Check what's blocking company_id
-- Run this in Supabase SQL Editor

-- 1. Check current RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Test if you can query company_id directly (as authenticated user)
-- This will show if RLS is blocking the column
SELECT id, email, role, company_id, assigned_hall_id
FROM public.profiles
WHERE id = auth.uid();

-- 3. Check if the helper function works
SELECT public.current_user_company_id();

-- 4. Disable RLS temporarily to test (ONLY FOR DEBUGGING)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- Then try the query again from the app
-- Don't forget to re-enable: ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
