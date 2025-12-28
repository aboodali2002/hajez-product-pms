-- Migration: Add missing columns to profiles table
-- Purpose: Fix schema drift between TypeScript types and database schema
-- Run this in Supabase SQL Editor

-- Step 1: Add missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Step 2: Backfill email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;

-- Step 3: Backfill full_name from auth.users metadata
UPDATE public.profiles p
SET full_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE p.id = u.id
  AND p.full_name IS NULL;

-- Step 4: Verify the migration
SELECT 
    id,
    email,
    full_name,
    role,
    assigned_hall_id,
    created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- Expected: All rows should now have email populated, full_name may be null if not set
