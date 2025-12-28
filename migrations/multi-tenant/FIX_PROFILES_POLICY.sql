-- EMERGENCY FIX: Simplify profiles SELECT policy to avoid recursion
-- The current policy causes issues because current_user_company_id() queries profiles
-- which triggers the policy again, creating a circular dependency

-- Drop ALL existing SELECT policies on profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_platform_admin" ON public.profiles;

-- Create a simple policy: users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Platform admins can read all profiles (using a direct role check, no function)
CREATE POLICY "profiles_select_platform_admin" ON public.profiles
FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'platform_admin'
);

-- Verify the policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' AND cmd = 'SELECT';
