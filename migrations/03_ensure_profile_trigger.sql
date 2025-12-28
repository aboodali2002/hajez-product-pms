-- Migration: Ensure profile auto-creation trigger includes new columns
-- Purpose: Prevent "ghost users" by auto-creating profiles with all required fields
-- Run this in Supabase SQL Editor AFTER 02_fix_rls_policies.sql

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create updated function with new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name, assigned_hall_id)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'hall_admin'),
    new.email,
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'assigned_hall_id')::uuid
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();

-- Step 4: Verify trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

-- Expected: Should show one row with the trigger details
