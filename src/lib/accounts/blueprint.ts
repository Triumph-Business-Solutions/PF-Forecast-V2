import { type ProfitFirstAccountTemplate } from '@/types/accounts';

export const PROFIT_FIRST_ACCOUNT_BLUEPRINT: ProfitFirstAccountTemplate[] = [
  {
    type: 'income',
    group: 'income',
    label: 'Income',
    description: 'Primary account capturing all deposits before allocations occur.',
  },
  {
    type: 'materials',
    group: 'direct_cost',
    label: 'Materials',
    description:
      'Optional direct cost bucket for physical goods, funded before main allocations.',
    optional: true,
  },
  {
    type: 'payroll',
    group: 'direct_cost',
    label: 'Payroll',
    description:
      'Optional direct cost bucket for labor tied to fulfilling sales, funded before main allocations.',
    optional: true,
  },
  {
    type: 'profit',
    group: 'main',
    label: 'Profit',
    description: 'Core Profit First account receiving owner distributions each quarter.',
  },
  {
    type: 'owners_pay',
    group: 'main',
    label: "Owner's Pay",
    description: 'Covers the owner salary allocation to keep personal income predictable.',
  },
  {
    type: 'tax',
    group: 'main',
    label: 'Tax',
    description: 'Reserves funds for tax liabilities so quarterly payments are stress-free.',
  },
  {
    type: 'operating_expenses',
    group: 'main',
    label: 'Operating Expenses',
    description: 'Supports the remaining operating expenses needed to run the business.',
  },
];
