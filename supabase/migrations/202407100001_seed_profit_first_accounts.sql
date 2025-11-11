-- Ensure every company starts with the standard Profit First account blueprint.

create or replace function public.ensure_profit_first_accounts(company uuid)
returns void
language plpgsql
as $$
begin
  insert into public.profit_first_accounts (company_id, account_type, account_group, name)
  select company,
         blueprint.account_type,
         blueprint.account_group,
         blueprint.name
  from (values
    ('income'::public.account_type, 'income'::public.account_group, 'Income'),
    ('materials'::public.account_type, 'direct_cost'::public.account_group, 'Materials'),
    ('payroll'::public.account_type, 'direct_cost'::public.account_group, 'Payroll'),
    ('profit'::public.account_type, 'main'::public.account_group, 'Profit'),
    ('owners_pay'::public.account_type, 'main'::public.account_group, 'Owner''s Pay'),
    ('tax'::public.account_type, 'main'::public.account_group, 'Tax'),
    ('operating_expenses'::public.account_type, 'main'::public.account_group, 'Operating Expenses')
  ) as blueprint(account_type, account_group, name)
  where not exists (
    select 1
    from public.profit_first_accounts existing
    where existing.company_id = company
      and existing.account_type = blueprint.account_type
  );
end;
$$;

create or replace function public.create_default_profit_first_accounts()
returns trigger
language plpgsql
as $$
begin
  perform public.ensure_profit_first_accounts(new.id);
  return new;
end;
$$;

drop trigger if exists create_default_profit_first_accounts on public.companies;

create trigger create_default_profit_first_accounts
after insert on public.companies
for each row
execute procedure public.create_default_profit_first_accounts();

-- Backfill demo and existing companies with the default accounts.
do $$
declare
  company_record record;
begin
  for company_record in
    select id from public.companies
  loop
    perform public.ensure_profit_first_accounts(company_record.id);
  end loop;
end;
$$;
