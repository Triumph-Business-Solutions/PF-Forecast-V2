export type AllocationCadenceType = "weekly" | "twice_monthly" | "monthly";

export interface AllocationCadenceSettings {
  companyId: string;
  cadence: AllocationCadenceType;
  weeklyDayOfWeek: number | null;
  twiceMonthlyFirstDay: number | null;
  twiceMonthlySecondDay: number | null;
  monthlyDay: number | null;
  nextAllocationDate: string;
}

export interface AllocationCadenceUpdateInput {
  cadence: AllocationCadenceType;
  weeklyDayOfWeek: number | null;
  twiceMonthlyFirstDay: number | null;
  twiceMonthlySecondDay: number | null;
  monthlyDay: number | null;
  nextAllocationDate: string;
}
