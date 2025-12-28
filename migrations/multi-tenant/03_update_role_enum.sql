-- Migration 03: Update Role Enum
-- Purpose: Rename super_admin → company_owner, add platform_admin
-- Run Order: THIRD

-- Step 1: Drop existing role constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Update existing role values
UPDATE public.profiles 
SET role = CASE 
  WHEN role = 'super_admin' THEN 'company_owner'
  WHEN role = 'hall_admin' THEN 'hall_manager'
  ELSE role
END;

-- Step 3: Add new role constraint with updated values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('platform_admin', 'company_owner', 'company_admin', 'hall_manager'));

-- Step 4: Verify role migration
SELECT 
    role,
    COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;
