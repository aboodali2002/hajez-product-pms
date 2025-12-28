-- Enable btree_gist extension for UUID exclusion constraints
create extension if not exists btree_gist;

-- 1. CLIENTS TABLE (CRM Core)
create table clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text unique not null,
  email text,
  national_id text, -- Useful for contracts
  notes text,
  created_at timestamptz default now()
);

alter table clients enable row level security;

create policy "Admins can manage clients" on clients
  for all using (
    exists (select 1 from profiles where id = auth.uid() and (role = 'super_admin' or role = 'hall_admin'))
  );

-- 2. BOOKINGS TABLE (The Source of Truth)
-- Replaces the simple 'status' flag in calendar_days for bookings.
create type booking_status as enum ('tentative', 'confirmed', 'cancelled', 'completed');

create table bookings (
  id uuid default gen_random_uuid() primary key,
  hall_id uuid references halls(id) not null,
  client_id uuid references clients(id) not null,
  event_date date not null,
  
  -- Financials
  total_price numeric not null default 0,
  
  -- Status & Meta
  status booking_status not null default 'tentative',
  notes text,
  cancellation_reason text,
  
  -- Audit
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Constraint: Prevent double booking on the same date for the same hall (unless cancelled)
  -- This ensures data integrity at the database level.
  exclude using gist (hall_id with =, event_date with =) where (status != 'cancelled')
);

alter table bookings enable row level security;

create policy "Admins can manage bookings" on bookings
  for all using (
    exists (select 1 from profiles where id = auth.uid() and (role = 'super_admin' or assigned_hall_id = bookings.hall_id))
  );

-- 3. PAYMENTS TABLE (Finance)
create type payment_type as enum ('deposit', 'full_payment', 'remaining', 'refund');
create type payment_method as enum ('cash', 'transfer', 'card');

create table payments (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  
  amount numeric not null,
  payment_date timestamptz default now(),
  payment_method payment_method not null,
  payment_type payment_type not null,
  
  reference_no text, -- For bank transfer IDs or receipt numbers
  notes text,
  
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table payments enable row level security;

create policy "Admins can manage payments" on payments
  for all using (
    exists (
      select 1 from profiles 
      join bookings on bookings.id = payments.booking_id
      where profiles.id = auth.uid() 
      and (profiles.role = 'super_admin' or profiles.assigned_hall_id = bookings.hall_id)
    )
  );

-- 4. BOOKING SERVICES (Itemized Bill)
-- Tracks exactly what services/packages were included in this booking
create table booking_services (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references bookings(id) on delete cascade not null,
  service_name text not null, -- Snapshot of the name at time of booking
  price numeric not null, -- Snapshot of the price at time of booking
  quantity int default 1,
  created_at timestamptz default now()
);

alter table booking_services enable row level security;

create policy "Admins can manage booking services" on booking_services
  for all using (
    exists (
      select 1 from profiles 
      join bookings on bookings.id = booking_services.booking_id
      where profiles.id = auth.uid() 
      and (profiles.role = 'super_admin' or profiles.assigned_hall_id = bookings.hall_id)
    )
  );
