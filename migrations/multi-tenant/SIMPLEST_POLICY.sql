-- SIMPLEST POSSIBLE FIX: Remove platform admin policy entirely for now
-- Just allow users to read their own profile, nothing else

-- Drop ALL SELECT policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_platform_admin" ON public.profiles;

-- Create ONLY the simple self-read policy
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Verify
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT';
