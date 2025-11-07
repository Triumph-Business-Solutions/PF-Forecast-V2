export type PlatformRole = "firm_owner" | "firm_employee" | "company_owner";

export interface RoleDefinition {
  id: PlatformRole;
  title: string;
  summary: string;
  badge: string;
  permissions: string[];
  defaultScope: "firm" | "company";
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: "firm_owner",
    title: "Firm Owner",
    summary:
      "Leads the accounting or bookkeeping practice and oversees every client workspace connected to their firm.",
    permissions: [
      "Create and manage all company profiles within the firm",
      "Grant or revoke access for firm employees",
      "Invite company owners to review their forecasts",
    ],
    badge: "Full access",
    defaultScope: "firm",
  },
  {
    id: "firm_employee",
    title: "Firm Employee",
    summary:
      "Collaborates on client forecasts with permissions tailored to the companies they support.",
    permissions: [
      "Assigned to specific companies by the firm owner",
      "Review and update cash flow forecasts for their clients",
      "Work alongside firm owners with scoped access",
    ],
    badge: "Scoped access",
    defaultScope: "company",
  },
  {
    id: "company_owner",
    title: "Company Owner",
    summary:
      "Business stakeholder invited to monitor the health of their Profit First forecast without altering firm data.",
    permissions: [
      "Read-only insight into their company forecast",
      "Stay informed on projected cash flow and allocations",
      "Collaborate with their firm without risking edits",
    ],
    badge: "Read only",
    defaultScope: "company",
  },
];
