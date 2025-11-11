export type AccountGroup = 'income' | 'direct_cost' | 'main';

export type AccountType =
  | 'income'
  | 'profit'
  | 'owners_pay'
  | 'tax'
  | 'operating_expenses'
  | 'materials'
  | 'payroll'
  | 'custom';

export interface ProfitFirstAccount {
  type: AccountType;
  group: AccountGroup;
  label: string;
  description: string;
  optional?: boolean;
  customPosition?: number;
}

export interface ProfitFirstAccountTemplate extends ProfitFirstAccount {
  readonly type: Exclude<AccountType, 'custom'>;
}

export interface CustomAccountDefinition extends ProfitFirstAccount {
  readonly type: 'custom';
  customPosition: number;
}

export interface ProfitFirstAccountRecord {
  id: string;
  companyId: string;
  type: AccountType;
  group: AccountGroup;
  name: string;
  allocationPercent: number;
  isActive: boolean;
  customPosition: number | null;
}
