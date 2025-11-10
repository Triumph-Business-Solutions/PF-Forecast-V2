-- Profit First account structure for client forecasting.

create type public.account_group as enum ('income', 'direct_cost', 'main');

create type public.account_type as enum (
  'income',
  'profit',
  'owners_pay',
  'tax',
  'operating_expenses',
  'materials',
  'payroll',
  'custom'
);

create table if not exists public.profit_first_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  account_type public.account_type not null,
  account_group public.account_group not null,
  name text not null,
  allocation_percent numeric(5, 2) not null default 0 check (allocation_percent >= 0 and allocation_percent <= 100),
  is_active boolean not null default true,
  custom_position smallint,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (account_type = 'custom' and custom_position between 1 and 10)
    or (account_type <> 'custom' and custom_position is null)
  ),
  check (
    case account_type
      when 'income' then account_group = 'income'
      when 'materials' then account_group = 'direct_cost'
      when 'payroll' then account_group = 'direct_cost'
      else account_group = 'main'
    end
  )
);

create index if not exists profit_first_accounts_company_idx on public.profit_first_accounts (company_id);

create unique index if not exists profit_first_accounts_unique_type on public.profit_first_accounts (company_id, account_type)
  where account_type <> 'custom';

create unique index if not exists profit_first_accounts_unique_custom_position on public.profit_first_accounts (company_id, custom_position)
  where custom_position is not null;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp
before update on public.profit_first_accounts
for each row
execute procedure public.update_updated_at_column();
