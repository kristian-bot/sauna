-- Family cabin booking system

-- Cabins table
create table if not exists cabins (
  id serial primary key,
  name text not null,
  description text,
  image_url text,
  color text not null default '#888888',
  created_at timestamptz not null default now()
);

-- Family members table (id matches auth.users.id)
create table if not exists family_members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Cabin bookings table
create table if not exists cabin_bookings (
  id serial primary key,
  cabin_id integer not null references cabins(id) on delete cascade,
  member_id uuid not null references family_members(id) on delete cascade,
  check_in date not null,
  check_out date not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),
  note text,
  created_at timestamptz not null default now(),
  constraint check_dates check (check_out > check_in)
);

-- Indexes
create index if not exists idx_cabin_bookings_cabin on cabin_bookings(cabin_id);
create index if not exists idx_cabin_bookings_member on cabin_bookings(member_id);
create index if not exists idx_cabin_bookings_dates on cabin_bookings(check_in, check_out);

-- Seed cabins
insert into cabins (name, description, color) values
  ('Arendal', 'Hytte i Arendal', '#D1643B'),
  ('Ølen', 'Hytte i Ølen', '#A5C9CA'),
  ('Cannes', 'Hytte i Cannes', '#E8B931');
