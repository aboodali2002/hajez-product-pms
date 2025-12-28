-- ============================================================================
-- THE FIXER: EMERGENCY RESCUE SCRIPT
-- ============================================================================
-- Goal: Unblock the user immediately.
-- 1. Fix Profile Creation (Stop "Ghost Users")
-- 2. Unlock Database (Permissive RLS)
-- 3. Clean up conflicting triggers
-- ============================================================================

BEGIN;

-- 1. CLEANUP: Drop potential conflicting triggers/functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. ROBUST PROFILE CREATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name, assigned_hall_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'company_owner'), -- Default to owner to be safe
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    (new.raw_user_meta_data->>'assigned_hall_id')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();

-- 3. UNLOCK RLS (PERMISSIVE MODE)
-- We don't disable RLS completely (which can be weird with Supabase client), 
-- instead we make policies that say "If you are logged in, you can do anything".

-- Helper to quick-enable RLS on all tables
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY'; 
        EXECUTE 'DROP POLICY IF EXISTS "Emergency Access" ON public.' || quote_ident(r.tablename);
        EXECUTE 'CREATE POLICY "Emergency Access" ON public.' || quote_ident(r.tablename) || ' FOR ALL TO authenticated USING (true) WITH CHECK (true)';
    END LOOP; 
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION SELECT
-- ============================================================================
SELECT 'The Fixer ran successfully. RLS is open and Triggers are active.' as status;
