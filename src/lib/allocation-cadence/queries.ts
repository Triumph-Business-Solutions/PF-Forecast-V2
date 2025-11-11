import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type {
  AllocationCadenceSettings,
  AllocationCadenceUpdateInput,
  AllocationCadenceType,
} from "@/types/allocation-cadence";

type AllocationCadenceRow = {
  company_id: string;
  cadence: AllocationCadenceType;
  weekly_day_of_week: number | null;
  twice_monthly_first_day: number | null;
  twice_monthly_second_day: number | null;
  monthly_day: number | null;
  next_allocation_date: string;
};

const SELECT_FIELDS =
  "company_id, cadence, weekly_day_of_week, twice_monthly_first_day, twice_monthly_second_day, monthly_day, next_allocation_date" as const;

function mapRowToSettings(row: AllocationCadenceRow): AllocationCadenceSettings {
  return {
    companyId: row.company_id,
    cadence: row.cadence,
    weeklyDayOfWeek: row.weekly_day_of_week,
    twiceMonthlyFirstDay: row.twice_monthly_first_day,
    twiceMonthlySecondDay: row.twice_monthly_second_day,
    monthlyDay: row.monthly_day,
    nextAllocationDate: row.next_allocation_date,
  };
}

export async function fetchAllocationCadenceSettings(
  companyId: string,
): Promise<{ data: AllocationCadenceSettings | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from("allocation_cadence_settings")
    .select(SELECT_FIELDS)
    .eq("company_id", companyId)
    .maybeSingle<AllocationCadenceRow>();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: null };
  }

  return { data: mapRowToSettings(data), error: null };
}

export async function upsertAllocationCadenceSettings(
  companyId: string,
  input: AllocationCadenceUpdateInput,
): Promise<{ data: AllocationCadenceSettings | null; error: PostgrestError | null }> {
  const payload = {
    company_id: companyId,
    cadence: input.cadence,
    weekly_day_of_week: input.weeklyDayOfWeek,
    twice_monthly_first_day: input.twiceMonthlyFirstDay,
    twice_monthly_second_day: input.twiceMonthlySecondDay,
    monthly_day: input.monthlyDay,
    next_allocation_date: input.nextAllocationDate,
  } satisfies AllocationCadenceRow;

  const { data, error } = await supabase
    .from("allocation_cadence_settings")
    .upsert(payload, { onConflict: "company_id" })
    .select(SELECT_FIELDS)
    .single<AllocationCadenceRow>();

  if (error) {
    return { data: null, error };
  }

  return { data: mapRowToSettings(data), error: null };
}
