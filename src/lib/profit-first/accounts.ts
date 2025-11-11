import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { AccountGroup, AccountType, ProfitFirstAccountRecord } from "@/types/accounts";

type ProfitFirstAccountRow = {
  id: string;
  company_id: string;
  account_type: AccountType;
  account_group: AccountGroup;
  name: string;
  allocation_percent: number;
  is_active: boolean;
  custom_position: number | null;
};

export type ProfitFirstAccountUpsertInput = {
  id?: string | null;
  type: AccountType;
  group: AccountGroup;
  name: string;
  allocationPercent: number;
  customPosition: number | null;
  isActive?: boolean;
};

const SELECT_FIELDS =
  "id, company_id, account_type, account_group, name, allocation_percent, is_active, custom_position" as const;

function mapRowToRecord(row: ProfitFirstAccountRow): ProfitFirstAccountRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    type: row.account_type,
    group: row.account_group,
    name: row.name,
    allocationPercent: Number(row.allocation_percent ?? 0),
    isActive: row.is_active,
    customPosition: row.custom_position,
  };
}

export async function fetchProfitFirstAccounts(
  companyId: string,
): Promise<{ data: ProfitFirstAccountRecord[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("profit_first_accounts")
    .select(SELECT_FIELDS)
    .eq("company_id", companyId)
    .order("account_group", { ascending: true })
    .order("custom_position", { ascending: true, nullsFirst: true });

  if (error) {
    return { data: [], error };
  }

  return {
    data: (data ?? []).map((row) => mapRowToRecord(row as ProfitFirstAccountRow)),
    error: null,
  };
}

export async function saveProfitFirstAccounts(
  companyId: string,
  accounts: ProfitFirstAccountUpsertInput[],
  deactivateAccountIds: string[] = [],
): Promise<{ error: PostgrestError | null }> {
  if (accounts.length > 0) {
    const payload = accounts.map((account) => ({
      id: account.id ?? undefined,
      company_id: companyId,
      account_type: account.type,
      account_group: account.group,
      name: account.name,
      allocation_percent: account.allocationPercent,
      custom_position: account.customPosition,
      is_active: account.isActive ?? true,
    }));

    const { error } = await supabase
      .from("profit_first_accounts")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      return { error };
    }
  }

  if (deactivateAccountIds.length > 0) {
    const { error } = await supabase
      .from("profit_first_accounts")
      .update({ is_active: false, allocation_percent: 0 })
      .eq("company_id", companyId)
      .in("id", deactivateAccountIds);

    if (error) {
      return { error };
    }
  }

  return { error: null };
}
