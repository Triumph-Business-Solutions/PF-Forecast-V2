-- Schema to support firm, company, and owner/employee relationships.
-- This structure maps directly to ROLE_DEFINITIONS in src/lib/auth/roles.ts.

create table if not exists public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.users (
  id uuid primary key,
  email text unique not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.firm_members (
  firm_id uuid not null references public.firms (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('firm_owner', 'firm_employee')),
  invited_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  primary key (firm_id, user_id)
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  access_level text not null check (access_level in ('firm_owner', 'firm_employee', 'company_owner')),
  invited_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  primary key (company_id, user_id)
);

create or replace view public.company_access_matrix as
select
  c.id as company_id,
  cm.user_id,
  cm.access_level,
  f.id as firm_id
from public.company_members cm
join public.companies c on c.id = cm.company_id
join public.firms f on f.id = c.firm_id;

-- RLS policies will be attached in a future authentication sprint.
