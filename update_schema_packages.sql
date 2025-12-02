-- Update Schema for Service Packages

-- 1. Create table for items within a service package
create table service_package_items (
  id uuid default gen_random_uuid() primary key,
  service_id uuid references services_catalog(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- Enable RLS for items
alter table service_package_items enable row level security;

create policy "Service items are viewable by everyone." on service_package_items
  for select using (true);

create policy "Super Admins can manage service items." on service_package_items
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
  );

-- 2. Add is_active column to hall_services to allow toggling
alter table hall_services 
add column if not exists is_active boolean default false;

-- 3. Seed some initial items for existing packages (Optional/Example)
-- Assuming we have a 'Standard Wedding Package' from seed.sql, let's add items if it exists
DO $$
DECLARE
  pkg_id uuid;
BEGIN
  SELECT id INTO pkg_id FROM services_catalog WHERE name = 'Standard Wedding Package' LIMIT 1;
  
  IF pkg_id IS NOT NULL THEN
    INSERT INTO service_package_items (service_id, name) VALUES
    (pkg_id, 'Welcome Drinks'),
    (pkg_id, 'Basic Sound System');
  END IF;
END $$;
