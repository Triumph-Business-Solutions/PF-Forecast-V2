-- Demo workspace metadata is stored in the database so every environment shares the same seed data.

alter table public.companies
  add column if not exists is_demo boolean not null default false;

alter table public.companies
  add column if not exists active_since date;

alter table public.companies
  add column if not exists description text;

-- Stable UUIDs allow the application layer to reference demo resources consistently across environments.
insert into public.firms (id, name)
values ('00000000-0000-0000-0000-00000000d001', 'Demo Workspaces')
on conflict (id) do update set name = excluded.name;

insert into public.companies (id, firm_id, name, is_demo, active_since, description)
values
  (
    '00000000-0000-0000-0000-00000000d101',
    '00000000-0000-0000-0000-00000000d001',
    'Triumph Demo',
    true,
    date '2023-01-01',
    'Fully populated workspace ideal for guided onboarding walkthroughs.'
  ),
  (
    '00000000-0000-0000-0000-00000000d102',
    '00000000-0000-0000-0000-00000000d001',
    'Acme Plumbing',
    true,
    date '2023-03-01',
    'Service-based scenario to test allocations and cash flow experiments.'
)
on conflict (id) do update
set
  firm_id = excluded.firm_id,
  name = excluded.name,
  is_demo = excluded.is_demo,
  active_since = excluded.active_since,
  description = excluded.description;
