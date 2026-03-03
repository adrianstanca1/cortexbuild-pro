-- Domain tables required by V3 dashboards (permissive RLS for development)

-- Team members
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  email text,
  phone text,
  project_id uuid references public.projects(id) on delete set null,
  performance numeric,
  hours_this_week numeric,
  tasks_completed integer default 0,
  certifications text[],
  skills text[],
  status text default 'active',
  created_at timestamptz default now()
);

-- Budgets per project
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  total_budget numeric not null,
  total_spent numeric not null default 0,
  forecast numeric,
  period text default 'month',
  updated_at timestamptz default now()
);

-- Change orders
create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  status text check (status in ('pending','approved','rejected')) default 'pending',
  cost_impact numeric default 0,
  time_impact_days integer default 0,
  created_at timestamptz default now()
);

-- Resources (equipment/materials/labor)
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text check (type in ('equipment','material','labor')) not null,
  status text default 'available',
  location text,
  utilization numeric default 0,
  daily_cost numeric default 0,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz default now()
);

-- Safety incidents
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  severity text check (severity in ('low','medium','high','critical')) not null,
  description text,
  occurred_at timestamptz not null default now(),
  resolved boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.team_members enable row level security;
alter table public.budgets enable row level security;
alter table public.change_orders enable row level security;
alter table public.resources enable row level security;
alter table public.incidents enable row level security;

-- Dev policies (authenticated can do all)
create policy if not exists "team_members dev" on public.team_members for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy if not exists "budgets dev" on public.budgets for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy if not exists "change_orders dev" on public.change_orders for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy if not exists "resources dev" on public.resources for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy if not exists "incidents dev" on public.incidents for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');


