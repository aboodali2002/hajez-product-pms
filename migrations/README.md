# Database Migration Guide

## 🚨 CRITICAL: Read Before Running

This migration fixes the authentication infrastructure by:
1. Adding missing `email` and `full_name` columns to the `profiles` table
2. Fixing overly permissive RLS policies
3. Updating the auto-profile-creation trigger

## Prerequisites

- [ ] **Backup your database** via Supabase Dashboard → Database → Backups
- [ ] Ensure you have access to Supabase SQL Editor
- [ ] No users should be actively signing up during migration (low risk, but best practice)

## Migration Steps

### Option 1: All-in-One (Recommended)

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `migrations/RUN_THIS_MIGRATION.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify the output shows all ✅ checkmarks

### Option 2: Step-by-Step

If you prefer to run migrations individually:

1. Run `migrations/01_add_profile_columns.sql`
2. Run `migrations/02_fix_rls_policies.sql`
3. Run `migrations/03_ensure_profile_trigger.sql`

## Verification

After running the migration, verify:

```sql
-- Check columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';
-- Should show: id, role, assigned_hall_id, created_at, email, full_name

-- Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
-- Should show 5 policies (not "Public profiles are viewable by everyone")

-- Check trigger
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';
-- Should show: on_auth_user_created
```

## Post-Migration

1. Restart your Next.js dev server: `npm run dev`
2. Test login flow
3. Create a new test user to verify trigger works
4. Check browser console for "Auth Step" logs

## Rollback (If Needed)

If something goes wrong:

```sql
-- Restore from backup via Supabase Dashboard
-- OR manually rollback:

-- Remove new columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;

-- Restore old policies (not recommended - they were insecure)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
```

## Support

If you encounter errors:
- Check Supabase logs: Dashboard → Logs → Postgres Logs
- Verify environment variables in `.env`
- Check browser console for detailed error messages
