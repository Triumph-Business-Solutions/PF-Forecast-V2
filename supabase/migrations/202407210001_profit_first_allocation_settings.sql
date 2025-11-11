-- Expand custom Profit First account capacity and support direct cost custom accounts.

alter table public.profit_first_accounts
drop constraint if exists profit_first_accounts_custom_position_check;

alter table public.profit_first_accounts
drop constraint if exists profit_first_accounts_account_type_check;

drop index if exists profit_first_accounts_unique_custom_position;

alter table public.profit_first_accounts
  add constraint profit_first_accounts_custom_position_check
    check (
      (account_type = 'custom' and custom_position between 1 and 15)
      or (account_type <> 'custom' and custom_position is null)
    );

alter table public.profit_first_accounts
  add constraint profit_first_accounts_group_type_check
    check (
      case account_type
        when 'income' then account_group = 'income'
        when 'materials' then account_group = 'direct_cost'
        when 'payroll' then account_group = 'direct_cost'
        when 'custom' then account_group in ('direct_cost', 'main')
        else account_group = 'main'
      end
    );

create unique index if not exists profit_first_accounts_unique_custom_position
  on public.profit_first_accounts (company_id, account_group, custom_position)
  where custom_position is not null;

