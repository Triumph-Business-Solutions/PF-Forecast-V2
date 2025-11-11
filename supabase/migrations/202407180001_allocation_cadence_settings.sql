-- Allocation cadence configuration for Profit First automation schedules.

create type public.allocation_cadence_type as enum ('weekly', 'twice_monthly', 'monthly');

create table if not exists public.allocation_cadence_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  cadence public.allocation_cadence_type not null default 'monthly',
  weekly_day_of_week smallint,
  twice_monthly_first_day smallint,
  twice_monthly_second_day smallint,
  monthly_day smallint,
  next_allocation_date date not null default timezone('utc', now())::date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id),
  check (
    weekly_day_of_week is null or (weekly_day_of_week between 0 and 6)
  ),
  check (
    twice_monthly_first_day is null or (twice_monthly_first_day between 1 and 31)
  ),
  check (
    twice_monthly_second_day is null or (twice_monthly_second_day between 1 and 31)
  ),
  check (
    twice_monthly_first_day is null or twice_monthly_second_day is null or twice_monthly_first_day < twice_monthly_second_day
  ),
  check (
    monthly_day is null or (monthly_day between 1 and 31)
  ),
  check (
    case cadence
      when 'weekly' then weekly_day_of_week is not null
        and twice_monthly_first_day is null
        and twice_monthly_second_day is null
        and monthly_day is null
      when 'twice_monthly' then weekly_day_of_week is null
        and twice_monthly_first_day is not null
        and twice_monthly_second_day is not null
        and monthly_day is null
      when 'monthly' then weekly_day_of_week is null
        and twice_monthly_first_day is null
        and twice_monthly_second_day is null
        and monthly_day is not null
    end
  )
);

create index if not exists allocation_cadence_company_idx on public.allocation_cadence_settings (company_id);

create trigger set_timestamp_allocation_cadence
before update on public.allocation_cadence_settings
for each row
execute procedure public.update_updated_at_column();

create or replace function public.ensure_allocation_cadence_settings(company uuid)
returns void
language plpgsql
as $$
begin
  insert into public.allocation_cadence_settings (
    company_id,
    cadence,
    monthly_day,
    next_allocation_date
  )
  values (
    company,
    'monthly',
    15,
    timezone('utc', now())::date
  )
  on conflict (company_id) do nothing;
end;
$$;

create or replace function public.create_default_allocation_cadence_settings()
returns trigger
language plpgsql
as $$
begin
  perform public.ensure_allocation_cadence_settings(new.id);
  return new;
end;
$$;

drop trigger if exists create_default_allocation_cadence_settings on public.companies;

create trigger create_default_allocation_cadence_settings
after insert on public.companies
for each row
execute procedure public.create_default_allocation_cadence_settings();

do $$
declare
  company_record record;
begin
  for company_record in
    select id from public.companies
  loop
    perform public.ensure_allocation_cadence_settings(company_record.id);
  end loop;
end;
$$;

update public.allocation_cadence_settings
set
  cadence = 'weekly',
  weekly_day_of_week = 3,
  monthly_day = null,
  next_allocation_date = date '2025-10-01'
where company_id = '00000000-0000-0000-0000-00000000d101';

update public.allocation_cadence_settings
set
  cadence = 'twice_monthly',
  weekly_day_of_week = null,
  twice_monthly_first_day = 10,
  twice_monthly_second_day = 25,
  monthly_day = null,
  next_allocation_date = date '2025-09-15'
where company_id = '00000000-0000-0000-0000-00000000d102';
