-- Ensure demo company owners are restricted to their assigned workspace.

delete from public.company_members
where user_id = '00000000-0000-0000-0000-00000000d203'
  and company_id <> '00000000-0000-0000-0000-00000000d101';

delete from public.company_members
where user_id = '00000000-0000-0000-0000-00000000d204'
  and company_id <> '00000000-0000-0000-0000-00000000d102';

insert into public.company_members (company_id, user_id, access_level, invited_at, accepted_at)
values
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
  ),
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
  )
on conflict (company_id, user_id) do update
set
  access_level = excluded.access_level,
  invited_at = excluded.invited_at,
  accepted_at = excluded.accepted_at;
