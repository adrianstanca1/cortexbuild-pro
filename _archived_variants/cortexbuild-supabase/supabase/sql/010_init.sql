-- CortexBuild minimal schema for Supabase
-- Creates tables referenced by the app and permissive RLS for development

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  created_at timestamptz default now()
);

create table if not exists public.users (
  id uuid primary key, -- should match auth.users.id
  email text unique,
  name text,
  role text check (role in ('super_admin','company_admin','developer')) default 'company_admin',
  avatar text,
  company_id uuid,
  created_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text default 'todo',
  weather_sensitive boolean default false,
  schedule_status text,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text,
  message text,
  applied boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.projects enable row level security;
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;

-- Permissive RLS for development (allow all authenticated access)
create policy if not exists "projects dev access" on public.projects
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy if not exists "users dev access" on public.users
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy if not exists "tasks dev access" on public.tasks
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy if not exists "notifications dev access" on public.notifications
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Realtime is managed by Supabase; ensure tables are included via Dashboard → Realtime


