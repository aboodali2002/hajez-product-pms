-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- PROFILES (Admins)
create table profiles (
  id uuid references auth.users not null primary key,
  role text check (role in ('super_admin', 'hall_admin')) not null,
  assigned_hall_id uuid, -- Null for Super Admin
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- HALLS
create table halls (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  theme_color text default 'blue',
  created_at timestamptz default now()
);

alter table halls enable row level security;

create policy "Halls are viewable by everyone." on halls
  for select using (true);

create policy "Super Admins can insert halls." on halls
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
  );

create policy "Super Admins can update halls." on halls
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
  );

-- SERVICES CATALOG (Global)
create table services_catalog (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  is_global boolean default false,
  created_at timestamptz default now()
);

alter table services_catalog enable row level security;

create policy "Services are viewable by everyone." on services_catalog
  for select using (true);

create policy "Super Admins can manage services." on services_catalog
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'super_admin')
  );

-- HALL SERVICES (Local Pricing)
create table hall_services (
  id uuid default gen_random_uuid() primary key,
  hall_id uuid references halls(id) on delete cascade not null,
  service_id uuid references services_catalog(id) on delete cascade not null,
  price numeric not null,
  created_at timestamptz default now(),
  unique(hall_id, service_id)
);

alter table hall_services enable row level security;

create policy "Hall Services are viewable by everyone." on hall_services
  for select using (true);

create policy "Admins can manage hall services." on hall_services
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and (role = 'super_admin' or assigned_hall_id = hall_services.hall_id)
    )
  );

-- PRICING TEMPLATES
create table pricing_templates (
  id uuid default gen_random_uuid() primary key,
  hall_id uuid references halls(id) on delete cascade not null,
  day_of_week int check (day_of_week between 0 and 6) not null, -- 0=Sunday, 6=Saturday
  price numeric not null,
  created_at timestamptz default now(),
  unique(hall_id, day_of_week)
);

alter table pricing_templates enable row level security;

create policy "Pricing Templates are viewable by everyone." on pricing_templates
  for select using (true);

create policy "Admins can manage pricing templates." on pricing_templates
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and (role = 'super_admin' or assigned_hall_id = pricing_templates.hall_id)
    )
  );

-- CALENDAR DAYS
create table calendar_days (
  id uuid default gen_random_uuid() primary key,
  hall_id uuid references halls(id) on delete cascade not null,
  date date not null,
  status text check (status in ('available', 'booked', 'maintenance')) not null,
  manual_price numeric, -- Overrides template if not null
  client_name text, -- RLS Protected
  notes text, -- RLS Protected
  created_at timestamptz default now(),
  unique(hall_id, date)
);

alter table calendar_days enable row level security;

-- Public can view calendar days, but NOT client_name or notes
create policy "Public can view calendar days (stripped)." on calendar_days
  for select using (true);

-- Admins can view everything
create policy "Admins can view full calendar details." on calendar_days
  for select using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and (role = 'super_admin' or assigned_hall_id = calendar_days.hall_id)
    )
  );

create policy "Admins can manage calendar days." on calendar_days
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and (role = 'super_admin' or assigned_hall_id = calendar_days.hall_id)
    )
  );
