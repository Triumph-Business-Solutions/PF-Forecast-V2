import type { PostgrestError } from "@supabase/supabase-js";

import type { ClientSummary } from "@/types/clients";
import type { PlatformRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const COMPANY_FIELDS = "id, name, is_demo, active_since, description, firm_id";

type CompanyRow = {
  id: string;
  name: string;
  is_demo: boolean;
  active_since: string | null;
  description: string | null;
  firm_id: string | null;
};

type CompanyMembershipRow = {
  company_id: string;
  access_level: PlatformRole;
};

type FirmMembershipRow = {
  firm_id: string;
  role: PlatformRole;
};

export interface ClientWorkspaceResult {
  assigned: ClientSummary[];
  demos: ClientSummary[];
  errors: string[];
}

const unknownDateLabel = "—";

function formatActiveSince(value: string | null): string {
  if (!value) {
    return unknownDateLabel;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return unknownDateLabel;
  }

  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(parsedDate);
}

function createSummary(row: CompanyRow, accessLevel?: PlatformRole): ClientSummary {
  return {
    id: row.id,
    name: row.name,
    type: row.is_demo ? "demo" : "client",
    activeSince: formatActiveSince(row.active_since),
    description: row.description ?? undefined,
    accessLevel,
    firmId: row.firm_id ?? undefined,
  };
}

function upsertSummary(map: Map<string, ClientSummary>, summary: ClientSummary) {
  const existing = map.get(summary.id);

  if (!existing) {
    map.set(summary.id, summary);
    return;
  }

  const nextAccessLevel = summary.accessLevel ?? existing.accessLevel;
  map.set(summary.id, {
    ...existing,
    ...summary,
    accessLevel: nextAccessLevel,
  });
}

function recordError(errors: string[], message: string, error: PostgrestError | null) {
  console.error(message, error);
  errors.push(message);
}

export async function fetchClientWorkspaces(
  userId?: string | null,
  expectedRole?: PlatformRole | null,
): Promise<ClientWorkspaceResult> {
  const assignedMap = new Map<string, ClientSummary>();
  const demoMap = new Map<string, ClientSummary>();
  const membershipAccess = new Map<string, PlatformRole>();
  const firmAccess = new Map<string, PlatformRole>();
  const errors: string[] = [];
  let isCompanyOwnerOnly = expectedRole === "company_owner";
  const companyOwnerCompanyIds = new Set<string>();

  if (userId) {
    const { data: membershipRows, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id, access_level")
      .eq("user_id", userId);

    if (membershipError) {
      recordError(errors, "Unable to load company memberships.", membershipError);
    }

    const safeMembershipRows = (membershipRows ?? []) as CompanyMembershipRow[];
    const membershipCompanyIds = safeMembershipRows.map((row) => row.company_id);
    safeMembershipRows.forEach((row) => {
      membershipAccess.set(row.company_id, row.access_level);
      if (row.access_level === "company_owner") {
        companyOwnerCompanyIds.add(row.company_id);
      }
    });

    const membershipRoles = new Set<PlatformRole>(safeMembershipRows.map((row) => row.access_level));
    if (membershipRoles.size > 0) {
      isCompanyOwnerOnly =
        membershipRoles.size === 1 && membershipRoles.has("company_owner");
    }

    if (membershipCompanyIds.length > 0) {
      const { data: assignedCompanies, error: assignedError } = await supabase
        .from("companies")
        .select(COMPANY_FIELDS)
        .in("id", membershipCompanyIds);

      if (assignedError) {
        recordError(errors, "Unable to load assigned companies.", assignedError);
      }

      (assignedCompanies ?? []).forEach((company) => {
        const summary = createSummary(company as CompanyRow, membershipAccess.get(company.id));
        const targetMap = company.is_demo ? demoMap : assignedMap;
        upsertSummary(targetMap, summary);
      });
    }

    if (!isCompanyOwnerOnly) {
      const { data: firmMembershipRows, error: firmMembershipError } = await supabase
        .from("firm_members")
        .select("firm_id, role")
        .eq("user_id", userId);

      if (firmMembershipError) {
        recordError(errors, "Unable to load firm memberships.", firmMembershipError);
      }

      const safeFirmMembershipRows = (firmMembershipRows ?? []) as FirmMembershipRow[];
      safeFirmMembershipRows.forEach((row) => {
        firmAccess.set(row.firm_id, row.role);
      });

      const firmIds = Array.from(new Set(safeFirmMembershipRows.map((row) => row.firm_id)));

      if (firmIds.length > 0) {
        const { data: firmCompanies, error: firmCompaniesError } = await supabase
          .from("companies")
          .select(COMPANY_FIELDS)
          .in("firm_id", firmIds);

        if (firmCompaniesError) {
          recordError(errors, "Unable to load companies for your firm memberships.", firmCompaniesError);
        }

        (firmCompanies ?? []).forEach((company) => {
          const accessLevel = membershipAccess.get(company.id) ?? firmAccess.get((company as CompanyRow).firm_id ?? "");
          const summary = createSummary(company as CompanyRow, accessLevel);
          const targetMap = company.is_demo ? demoMap : assignedMap;
          upsertSummary(targetMap, summary);
        });
      }

      if (firmIds.length > 0) {
        isCompanyOwnerOnly = false;
      }
    }
  }

  if (!isCompanyOwnerOnly) {
    const { data: demoCompanies, error: demoError } = await supabase
      .from("companies")
      .select(COMPANY_FIELDS)
      .eq("is_demo", true);

    if (demoError) {
      recordError(errors, "Unable to load demo workspaces.", demoError);
    }

    (demoCompanies ?? []).forEach((company) => {
      const companyRow = company as CompanyRow;
      const accessLevel = membershipAccess.get(companyRow.id) ?? firmAccess.get(companyRow.firm_id ?? "");
      const summary = createSummary(companyRow, accessLevel);
      upsertSummary(demoMap, summary);
    });
  }

  if (isCompanyOwnerOnly && companyOwnerCompanyIds.size > 0) {
    const isAllowed = (id: string) => companyOwnerCompanyIds.has(id);

    for (const key of Array.from(assignedMap.keys())) {
      if (!isAllowed(key)) {
        assignedMap.delete(key);
      }
    }

    for (const key of Array.from(demoMap.keys())) {
      if (!isAllowed(key)) {
        demoMap.delete(key);
      }
    }
  }

  const assigned = Array.from(assignedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  const demos = Array.from(demoMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return { assigned, demos, errors };
}
