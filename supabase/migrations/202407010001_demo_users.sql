-- Seed demo users for testing firm and company roles.
-- Stable UUIDs ensure deterministic references across environments.

insert into public.users (id, email)
values
  ('00000000-0000-0000-0000-00000000d201', 'demo-firm-owner@example.com'),
  ('00000000-0000-0000-0000-00000000d202', 'demo-firm-employee@example.com'),
  ('00000000-0000-0000-0000-00000000d203', 'demo-triumph-owner@example.com'),
  ('00000000-0000-0000-0000-00000000d204', 'demo-acme-owner@example.com')
on conflict (id) do update
set email = excluded.email;

insert into public.firm_members (firm_id, user_id, role, invited_at, accepted_at)
values
  (
    '00000000-0000-0000-0000-00000000d001',
    '00000000-0000-0000-0000-00000000d201',
    'firm_owner',
    timestamptz '2024-01-01 00:00:00+00',
    timestamptz '2024-01-01 00:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-00000000d001',
    '00000000-0000-0000-0000-00000000d202',
    'firm_employee',
    timestamptz '2024-01-01 00:00:00+00',
    timestamptz '2024-01-01 00:00:00+00'
  )
on conflict (firm_id, user_id) do update
set
  role = excluded.role,
  invited_at = excluded.invited_at,
  accepted_at = excluded.accepted_at;

insert into public.company_members (company_id, user_id, access_level, invited_at, accepted_at)
values
  (
    '00000000-0000-0000-0000-00000000d101',
    '00000000-0000-0000-0000-00000000d201',
    'firm_owner',
    timestamptz '2024-01-01 00:00:00+00',
    timestamptz '2024-01-01 00:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-00000000d101',
    '00000000-0000-0000-0000-00000000d202',
    'firm_employee',
    timestamptz '2024-01-01 00:00:00+00',
    timestamptz '2024-01-01 00:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-00000000d101',
    '00000000-0000-0000-0000-00000000d203',
    'company_owner',
    timestamptz '2024-01-01 00:00:00+00',
    timestamptz '2024-01-01 00:00:00+00'
  ),
  (
    '00000000-0000-0000-0000-00000000d102',
    '00000000-0000-0000-0000-00000000d204',
    'company_owner',
    timestamptz '2024-01-01 00:00:00+00',
    timestamptz '2024-01-01 00:00:00+00'
  )
on conflict (company_id, user_id) do update
set
  access_level = excluded.access_level,
  invited_at = excluded.invited_at,
  accepted_at = excluded.accepted_at;
