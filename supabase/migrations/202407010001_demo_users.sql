
-- Ensure optional profile fields exist before inserting demo data.
alter table public.users
  add column if not exists display_name text,
  add column if not exists phone_number text;

insert into public.users (id, email, display_name, phone_number)
values
  (
    '00000000-0000-0000-0000-00000000d201',
    'demo-firm-owner@example.com',
    'Demo Firm Owner',
    '+1 (555) 010-1001'
  ),
  (
    '00000000-0000-0000-0000-00000000d202',
    'demo-firm-employee@example.com',
    'Demo Firm Employee',
    '+1 (555) 010-2002'
  ),
  (
    '00000000-0000-0000-0000-00000000d203',
    'demo-company-owner@example.com',
    'Demo Company Owner',
    '+1 (555) 010-3003'
  )
on conflict (id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  phone_number = excluded.phone_number;

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
    '00000000-0000-0000-0000-00000000d102',
    '00000000-0000-0000-0000-00000000d203',
    'company_owner',
    timestamptz '2024-01-01 00:00:00+00',
    timestamptz '2024-01-01 00:00:00+00'
  )
on conflict (company_id, user_id) do update
set
  access_level = excluded.access_level,
  invited_at = excluded.invited_at,
  accepted_at = excluded.accepted_at;
