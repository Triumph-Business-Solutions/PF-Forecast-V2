-- Align demo user workspace access with the expected firm and company relationships.

-- Firm owner and firm employee should have deterministic firm memberships.
delete from public.firm_members
where user_id in (
  '00000000-0000-0000-0000-00000000d201',
  '00000000-0000-0000-0000-00000000d202',
  '00000000-0000-0000-0000-00000000d203',
  '00000000-0000-0000-0000-00000000d204'
);

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

-- Company memberships are scoped per workspace. Company owners must only see their company,
-- while the firm owner retains visibility across all clients.
delete from public.company_members
where user_id in (
  '00000000-0000-0000-0000-00000000d201',
  '00000000-0000-0000-0000-00000000d202',
  '00000000-0000-0000-0000-00000000d203',
  '00000000-0000-0000-0000-00000000d204'
);

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
    '00000000-0000-0000-0000-00000000d102',
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
