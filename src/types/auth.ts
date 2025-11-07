import type { PlatformRole } from "@/lib/auth/roles";

export interface UserIdentity {
  id: string;
  email: string;
  role: PlatformRole;
}

export interface FirmMembership {
  firmId: string;
  userId: string;
  role: Extract<PlatformRole, "firm_owner" | "firm_employee">;
  invitedAt: string;
  acceptedAt: string | null;
}

export interface CompanyMembership {
  companyId: string;
  userId: string;
  accessLevel: PlatformRole;
  invitedAt: string;
  acceptedAt: string | null;
}
