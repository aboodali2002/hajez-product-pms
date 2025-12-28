# Multi-Tenant Migration Guide

## 🚀 Quick Start

### Option 1: All-in-One (Recommended)
1. **Backup your database** via Supabase Dashboard → Database → Backups
2. Open Supabase SQL Editor
3. Copy/paste `RUN_ALL_MIGRATIONS.sql`
4. Click "Run"
5. Verify output shows successful migration

### Option 2: Step-by-Step
Run files in this exact order:
1. `01_create_companies_table.sql`
2. `02_add_company_id_to_tables.sql`
3. `03_update_role_enum.sql`
4. `04_create_demo_company.sql`
5. `05_create_rls_helper_functions.sql`
6. `06_update_all_rls_policies.sql`

---

## 📋 What This Migration Does

### 1. Creates Companies Table
- Stores company information
- Includes subscription tier and limits
- Supports branding (logo, colors)

### 2. Adds company_id to All Tables
- `profiles`, `halls`, `bookings`, `clients`
- `services_catalog` (now company-scoped, not global)
- All other tables (payments, packages, etc.)

### 3. Updates Roles
- `super_admin` → `company_owner`
- `hall_admin` → `hall_manager`
- Adds new `platform_admin` role (for you)

### 4. Migrates Existing Data
- Creates "Demo Company"
- Moves all existing data to Demo Company
- Preserves all relationships

### 5. Creates Helper Functions
- `auth.user_company_id()` - Get user's company
- `auth.is_platform_admin()` - Check if platform admin
- `auth.is_company_owner()` - Check if company owner
- `public.generate_slug()` - Generate URL-safe slugs

### 6. Updates RLS Policies
- Enforces strict company isolation
- Platform admins can access all data
- Company users can only access their company's data

---

## ✅ Verification Steps

### After Migration, Run These Queries:

#### 1. Check Companies Table
```sql
SELECT * FROM public.companies;
-- Should show "Demo Company"
```

#### 2. Check Data Migration
```sql
SELECT 
    'profiles' as table_name,
    COUNT(*) as migrated_count
FROM public.profiles
WHERE company_id = (SELECT id FROM public.companies WHERE slug = 'demo-company')
UNION ALL
SELECT 'halls', COUNT(*) FROM public.halls WHERE company_id = (SELECT id FROM public.companies WHERE slug = 'demo-company')
UNION ALL
SELECT 'bookings', COUNT(*) FROM public.bookings WHERE company_id = (SELECT id FROM public.companies WHERE slug = 'demo-company');
-- All counts should match your existing data
```

#### 3. Check Roles
```sql
SELECT role, COUNT(*) FROM public.profiles GROUP BY role;
-- Should show: company_owner, hall_manager (no super_admin or hall_admin)
```

#### 4. Check RLS Policies
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
-- Each table should have 4 policies (SELECT, INSERT, UPDATE, DELETE)
```

#### 5. Check Helper Functions
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_name IN ('user_company_id', 'is_platform_admin', 'is_company_owner');
-- Should show all 3 functions
```

---

## 🔧 Post-Migration Steps

### 1. Update Your Profile to Platform Admin (Optional)
If you want to be the platform admin:

```sql
UPDATE public.profiles
SET role = 'platform_admin',
    company_id = NULL  -- Platform admins don't belong to a company
WHERE email = 'your-email@example.com';
```

### 2. Test Company Isolation
```sql
-- Login as a company_owner user
-- Try to query another company's data
SELECT * FROM public.halls WHERE company_id != auth.user_company_id();
-- Should return empty (RLS blocks it)
```

### 3. Test Platform Admin Access
```sql
-- Login as platform_admin
-- Should be able to see all companies' data
SELECT * FROM public.companies;
SELECT * FROM public.halls;  -- All halls from all companies
```

---

## 🚨 Troubleshooting

### Error: "column company_id does not exist"
- Migration 02 didn't run properly
- Re-run `02_add_company_id_to_tables.sql`

### Error: "infinite recursion detected"
- Old RLS policies still exist
- Run Migration 06 again to replace them

### Error: "null value in column company_id violates not-null constraint"
- Migration 04 didn't migrate all data
- Check which table has NULL company_id:
  ```sql
  SELECT 'profiles' as table_name, COUNT(*) FROM profiles WHERE company_id IS NULL
  UNION ALL
  SELECT 'halls', COUNT(*) FROM halls WHERE company_id IS NULL;
  ```
- Manually update those rows to Demo Company ID

### Data Not Showing After Migration
- Check if RLS is blocking you
- Verify your profile has a company_id:
  ```sql
  SELECT id, email, role, company_id FROM profiles WHERE id = auth.uid();
  ```
- If company_id is NULL, update it:
  ```sql
  UPDATE profiles 
  SET company_id = (SELECT id FROM companies WHERE slug = 'demo-company')
  WHERE id = auth.uid();
  ```

---

## 📊 Migration Impact

### Before:
- Single-tenant system
- All users share data
- Roles: super_admin, hall_admin

### After:
- Multi-tenant SaaS
- Companies have isolated data
- Roles: platform_admin, company_owner, company_admin, hall_manager
- Services are company-scoped (not global)

---

## 🔄 Rollback (If Needed)

**WARNING: This will delete all multi-tenant changes!**

```sql
-- Drop companies table
DROP TABLE IF EXISTS public.companies CASCADE;

-- Remove company_id from all tables
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.halls DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS company_id;
-- ... repeat for all tables

-- Restore old roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
UPDATE public.profiles SET role = CASE 
  WHEN role = 'company_owner' THEN 'super_admin'
  WHEN role = 'hall_manager' THEN 'hall_admin'
  ELSE role
END;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'hall_admin'));

-- Drop helper functions
DROP FUNCTION IF EXISTS auth.user_company_id();
DROP FUNCTION IF EXISTS auth.is_platform_admin();
DROP FUNCTION IF EXISTS auth.is_company_owner();
DROP FUNCTION IF EXISTS public.generate_slug(TEXT);
```

---

## 📞 Support

If you encounter issues:
1. Check Supabase Dashboard → Logs → Postgres Logs
2. Verify all 6 migrations ran successfully
3. Check the verification queries above
4. Review the troubleshooting section

---

## ✅ Success Checklist

- [ ] Database backed up
- [ ] All 6 migrations ran without errors
- [ ] Demo Company created
- [ ] All existing data migrated
- [ ] Roles updated (no super_admin or hall_admin)
- [ ] RLS policies created
- [ ] Helper functions created
- [ ] Verification queries passed
- [ ] Can login and see Demo Company data

**Once all checkboxes are complete, proceed to Phase 2: Code Updates!**
