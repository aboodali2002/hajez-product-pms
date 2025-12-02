-- Update Schema for Local Package Items

-- 1. Create table for local package items (overrides)
create table hall_package_items (
  id uuid default gen_random_uuid() primary key,
  hall_id uuid references halls(id) on delete cascade not null,
  service_id uuid references services_catalog(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table hall_package_items enable row level security;

create policy "Hall items are viewable by everyone." on hall_package_items
  for select using (true);

create policy "Admins can manage hall items." on hall_package_items
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and (role = 'super_admin' or assigned_hall_id = hall_package_items.hall_id)
    )
  );

-- 2. Add flag to hall_services to indicate if using custom items
alter table hall_services 
add column if not exists has_custom_items boolean default false;
