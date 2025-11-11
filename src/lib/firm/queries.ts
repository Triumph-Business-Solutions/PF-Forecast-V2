import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type {
  FirmCompanyFormInput,
  FirmEmployeeFormInput,
  FirmEmployeeSummary,
  FirmMembershipSummary,
} from "@/types/firm";
import type { PlatformRole } from "@/lib/auth/roles";

type FirmMembershipRow = {
  firm_id: string;
  role: PlatformRole;
  firms: { name: string | null }[] | { name: string | null } | null;
};

type RawEmployeeRow = {
  user_id: string;
  users: {
    display_name: string | null;
    email: string | null;
    phone_number: string | null;
  }[] | {
    display_name: string | null;
    email: string | null;
    phone_number: string | null;
  } | null;
};

type EmployeeRow = {
  user_id: string;
  users: {
    display_name: string | null;
    email: string | null;
    phone_number: string | null;
  } | null;
};

type RawAssignmentRow = {
  user_id: string;
  company_id: string;
  companies: {
    id: string;
    name: string | null;
    firm_id: string | null;
  }[] | {
    id: string;
    name: string | null;
    firm_id: string | null;
  } | null;
};

type AssignmentRow = {
  user_id: string;
  company_id: string;
  companies: {
    id: string;
    name: string | null;
    firm_id: string | null;
  } | null;
};

function formatSupabaseError(action: string, error: PostgrestError): Error {
  const message = error.message ?? "Unknown error";
  return new Error(`${action}: ${message}`);
}

export async function fetchFirmMemberships(userId: string): Promise<FirmMembershipSummary[]> {
  const { data, error } = await supabase
    .from("firm_members")
    .select("firm_id, role, firms:firms(name)")
    .eq("user_id", userId);

  if (error) {
    throw formatSupabaseError("Unable to load firm memberships", error);
  }

  return (data ?? []).map((row) => {
    const membership = row as FirmMembershipRow;
    const firmDetails = Array.isArray(membership.firms)
      ? membership.firms[0]
      : membership.firms;

    return {
      firmId: membership.firm_id,
      role: membership.role,
      firmName: firmDetails?.name ?? "Untitled firm",
    } satisfies FirmMembershipSummary;
  });
}

export async function fetchFirmEmployees(firmId: string): Promise<FirmEmployeeSummary[]> {
  const { data: employeeRows, error: employeesError } = await supabase
    .from("firm_members")
    .select("user_id, users:users(display_name, email, phone_number)")
    .eq("firm_id", firmId)
    .eq("role", "firm_employee");

  if (employeesError) {
    throw formatSupabaseError("Unable to load firm employees", employeesError);
  }

  const resolvedEmployeeRows: EmployeeRow[] = (employeeRows ?? []).map((row) => {
    const normalizedRow = row as RawEmployeeRow;
    const userDetails = Array.isArray(normalizedRow.users)
      ? normalizedRow.users[0] ?? null
      : normalizedRow.users;

    return {
      user_id: normalizedRow.user_id,
      users: userDetails,
    } satisfies EmployeeRow;
  });

  if (resolvedEmployeeRows.length === 0) {
    return [];
  }

  const employeeIds = resolvedEmployeeRows.map((row) => row.user_id);

  const { data: assignmentRows, error: assignmentsError } = await supabase
    .from("company_members")
    .select("company_id, user_id, companies:companies(id, name, firm_id)")
    .in("user_id", employeeIds)
    .eq("access_level", "firm_employee");

  if (assignmentsError) {
    throw formatSupabaseError("Unable to load employee company assignments", assignmentsError);
  }

  const assignmentsByUser = new Map<string, { ids: string[]; names: string[] }>();

  (assignmentRows ?? []).forEach((rawRow) => {
    const row = rawRow as RawAssignmentRow;
    const companyDetails = Array.isArray(row.companies)
      ? row.companies[0] ?? null
      : row.companies;

    if (!companyDetails || companyDetails.firm_id !== firmId) {
      return;
    }

    const entry = assignmentsByUser.get(row.user_id) ?? { ids: [], names: [] };
    entry.ids.push(row.company_id);
    entry.names.push(companyDetails.name ?? "Untitled client");
    assignmentsByUser.set(row.user_id, entry);
  });

  return resolvedEmployeeRows.map((row) => {
    const contact = row.users;
    const assignments = assignmentsByUser.get(row.user_id) ?? { ids: [], names: [] };

    return {
      userId: row.user_id,
      displayName: contact?.display_name ?? "Unnamed teammate",
      email: contact?.email ?? "—",
      phoneNumber: contact?.phone_number ?? undefined,
      companyIds: assignments.ids,
      companyNames: assignments.names,
    } satisfies FirmEmployeeSummary;
  });
}

function resolveRandomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const random = Math.random().toString(16).slice(2);
  const random2 = Math.random().toString(16).slice(2);
  return `${random}${random2}`.slice(0, 32);
}

export interface CreateFirmEmployeePayload extends FirmEmployeeFormInput {
  firmId: string;
}

export async function createFirmEmployee({
  firmId,
  displayName,
  email,
  phoneNumber,
  companyIds,
}: CreateFirmEmployeePayload): Promise<string> {
  const { data: existingUser, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    throw formatSupabaseError("Unable to check for existing user", existingError);
  }

  if (existingUser) {
    throw new Error("A user with this email address already exists.");
  }

  const userId = resolveRandomId();
  const timestamp = new Date().toISOString();

  const { error: userInsertError } = await supabase.from("users").insert({
    id: userId,
    email,
    display_name: displayName,
    phone_number: phoneNumber ?? null,
  });

  if (userInsertError) {
    throw formatSupabaseError("Unable to create the employee profile", userInsertError);
  }

  const { error: membershipError } = await supabase.from("firm_members").insert({
    firm_id: firmId,
    user_id: userId,
    role: "firm_employee",
    invited_at: timestamp,
    accepted_at: timestamp,
  });

  if (membershipError) {
    throw formatSupabaseError("Unable to link the employee to the firm", membershipError);
  }

  const uniqueCompanyIds = Array.from(new Set(companyIds));

  if (uniqueCompanyIds.length > 0) {
    const assignmentRows = uniqueCompanyIds.map((companyId) => ({
      company_id: companyId,
      user_id: userId,
      access_level: "firm_employee",
      invited_at: timestamp,
      accepted_at: timestamp,
    }));

    const { error: assignmentError } = await supabase
      .from("company_members")
      .upsert(assignmentRows, { onConflict: "company_id,user_id" });

    if (assignmentError) {
      throw formatSupabaseError("Unable to assign the employee to selected companies", assignmentError);
    }
  }

  return userId;
}

export interface UpdateFirmEmployeePayload {
  firmId: string;
  userId: string;
  updates: Omit<FirmEmployeeFormInput, "email">;
}

export interface CreateFirmCompanyPayload extends FirmCompanyFormInput {
  firmId: string;
  ownerUserId: string;
}

export async function createFirmCompany({
  firmId,
  ownerUserId,
  name,
  description,
  activeSince,
}: CreateFirmCompanyPayload): Promise<string> {
  const companyId = resolveRandomId();
  const today = new Date();
  const defaultActiveSince = today.toISOString().slice(0, 10);
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("Company name is required.");
  }

  const { error: companyError } = await supabase.from("companies").insert({
    id: companyId,
    firm_id: firmId,
    name: normalizedName,
    description: description?.trim() ? description.trim() : null,
    is_demo: false,
    active_since: (activeSince && activeSince.trim()) || defaultActiveSince,
  });

  if (companyError) {
    throw formatSupabaseError("Unable to create the client workspace", companyError);
  }

  const timestamp = today.toISOString();

  const { error: ownerAssignmentError } = await supabase
    .from("company_members")
    .upsert(
      {
        company_id: companyId,
        user_id: ownerUserId,
        access_level: "firm_owner",
        invited_at: timestamp,
        accepted_at: timestamp,
      },
      { onConflict: "company_id,user_id" },
    );

  if (ownerAssignmentError) {
    throw formatSupabaseError("Unable to link the workspace to the firm owner", ownerAssignmentError);
  }

  return companyId;
}

export async function updateFirmEmployee({
  firmId,
  userId,
  updates,
}: UpdateFirmEmployeePayload): Promise<void> {
  const { error: userUpdateError } = await supabase
    .from("users")
    .update({
      display_name: updates.displayName,
      phone_number: updates.phoneNumber ?? null,
    })
    .eq("id", userId);

  if (userUpdateError) {
    throw formatSupabaseError("Unable to update the employee profile", userUpdateError);
  }

  const { data: existingAssignments, error: existingAssignmentsError } = await supabase
    .from("company_members")
    .select("company_id, user_id, companies:companies(id, name, firm_id)")
    .eq("user_id", userId)
    .eq("access_level", "firm_employee");

  if (existingAssignmentsError) {
    throw formatSupabaseError("Unable to verify current company assignments", existingAssignmentsError);
  }

  const resolvedExistingAssignments: AssignmentRow[] = (existingAssignments ?? []).map((rawRow) => {
    const row = rawRow as RawAssignmentRow;
    const companyDetails = Array.isArray(row.companies)
      ? row.companies[0] ?? null
      : row.companies;

    return {
      user_id: row.user_id,
      company_id: row.company_id,
      companies: companyDetails,
    } satisfies AssignmentRow;
  });

  const scopedExistingIds = resolvedExistingAssignments
    .filter((row) => row.companies?.firm_id === firmId)
    .map((row) => row.company_id);

  const desiredIds = Array.from(new Set(updates.companyIds));
  const idsToAdd = desiredIds.filter((id) => !scopedExistingIds.includes(id));
  const idsToRemove = scopedExistingIds.filter((id) => !desiredIds.includes(id));

  if (idsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("company_members")
      .delete()
      .eq("user_id", userId)
      .eq("access_level", "firm_employee")
      .in("company_id", idsToRemove);

    if (deleteError) {
      throw formatSupabaseError("Unable to remove outdated company assignments", deleteError);
    }
  }

  if (idsToAdd.length > 0) {
    const timestamp = new Date().toISOString();

    const assignmentRows = idsToAdd.map((companyId) => ({
      company_id: companyId,
      user_id: userId,
      access_level: "firm_employee",
      invited_at: timestamp,
      accepted_at: timestamp,
    }));

    const { error: addError } = await supabase
      .from("company_members")
      .upsert(assignmentRows, { onConflict: "company_id,user_id" });

    if (addError) {
      throw formatSupabaseError("Unable to apply updated company assignments", addError);
    }
  }
}
