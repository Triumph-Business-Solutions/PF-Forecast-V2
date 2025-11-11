import type { PlatformRole } from "@/lib/auth/roles";
import type { ClientSummary } from "@/types/clients";

export interface FirmMembershipSummary {
  firmId: string;
  firmName: string;
  role: PlatformRole;
}

export interface FirmEmployeeSummary {
  userId: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  companyIds: string[];
  companyNames: string[];
}

export interface FirmEmployeeFormInput {
  displayName: string;
  email: string;
  phoneNumber?: string;
  companyIds: string[];
}

export type FirmCompanyMap = Record<string, ClientSummary[]>;
export type FirmEmployeeMap = Record<string, FirmEmployeeSummary[]>;

export interface FirmCompanyFormInput {
  name: string;
  description?: string;
  activeSince?: string;
}
