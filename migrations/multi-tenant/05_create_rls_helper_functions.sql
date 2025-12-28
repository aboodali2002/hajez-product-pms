-- Migration 05: Create RLS Helper Functions (FIXED - No auth schema access)
-- Purpose: Provide safe, non-recursive functions for RLS policies
-- Run Order: FIFTH

-- IMPORTANT: We create these in the PUBLIC schema, not AUTH schema
-- This avoids permission issues with Supabase's auth schema

-- Function 1: Get current user's company_id
-- Uses SECURITY DEFINER to safely query profiles table
CREATE OR REPLACE FUNCTION public.current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id 
  FROM public.profiles 
  WHERE id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function 2: Check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'platform_admin' 
     FROM public.profiles 
     WHERE id = auth.uid() 
     LIMIT 1),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function 3: Check if user is company owner
CREATE OR REPLACE FUNCTION public.is_company_owner()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'company_owner' 
     FROM public.profiles 
     WHERE id = auth.uid() 
     LIMIT 1),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function 4: Check if user belongs to a specific company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(target_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT company_id = target_company_id 
     FROM public.profiles 
     WHERE id = auth.uid() 
     LIMIT 1),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function 5: Generate slug from text
CREATE OR REPLACE FUNCTION public.generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
BEGIN
    -- Convert to lowercase
    slug := LOWER(input_text);
    
    -- Replace spaces with hyphens
    slug := REPLACE(slug, ' ', '-');
    
    -- Remove special characters (keep only alphanumeric and hyphens)
    slug := REGEXP_REPLACE(slug, '[^a-z0-9-]', '', 'g');
    
    -- Remove consecutive hyphens
    slug := REGEXP_REPLACE(slug, '-+', '-', 'g');
    
    -- Trim hyphens from start and end
    slug := TRIM(BOTH '-' FROM slug);
    
    RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.current_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_company(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_slug(TEXT) TO authenticated;

-- Verify functions were created
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('current_user_company_id', 'is_platform_admin', 'is_company_owner', 'user_belongs_to_company', 'generate_slug')
ORDER BY routine_name;
