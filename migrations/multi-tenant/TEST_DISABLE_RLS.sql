-- ULTRA-SIMPLE FIX: Temporarily disable RLS to test
-- This will help us confirm if RLS is the issue

-- Temporarily disable RLS on profiles (FOR TESTING ONLY)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Test query (should work now)
SELECT id, email, role, company_id FROM public.profiles LIMIT 5;

-- After confirming it works in the app, re-enable RLS:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
