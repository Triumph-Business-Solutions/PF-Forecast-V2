import { supabase } from "@/lib/supabase";
import type { PlatformRole } from "@/lib/auth/roles";
import type { CompanyMembership, FirmMembership, UserIdentity } from "@/types/auth";

export async function fetchUserIdentity(userId: string): Promise<UserIdentity | null> {
  const { data, error } = await supabase.from("users").select("id, email").eq("id", userId).single();

  if (error || !data) {
    console.error("Failed to fetch user identity", error);
    return null;
  }

  // Role resolution will be enhanced with RLS-protected functions in the authentication sprint.
  const { data: membership } = await supabase
    .from("company_members")
    .select("access_level")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    id: data.id,
    email: data.email,
    role: (membership?.access_level ?? "firm_owner") as PlatformRole,
  };
}

export async function fetchFirmMemberships(userId: string): Promise<FirmMembership[]> {
  const { data, error } = await supabase
    .from("firm_members")
    .select("firm_id, role, invited_at, accepted_at")
    .eq("user_id", userId);

  if (error || !data) {
    console.error("Failed to fetch firm memberships", error);
    return [];
  }

  return data.map((record) => ({
    firmId: record.firm_id,
    userId,
    role: record.role,
    invitedAt: record.invited_at,
    acceptedAt: record.accepted_at,
  }));
}

export async function fetchCompanyMemberships(userId: string): Promise<CompanyMembership[]> {
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id, access_level, invited_at, accepted_at")
    .eq("user_id", userId);

  if (error || !data) {
    console.error("Failed to fetch company memberships", error);
    return [];
  }

  return data.map((record) => ({
    companyId: record.company_id,
    userId,
    accessLevel: record.access_level,
    invitedAt: record.invited_at,
    acceptedAt: record.accepted_at,
  }));
}
