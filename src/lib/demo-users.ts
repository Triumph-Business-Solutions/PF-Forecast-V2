export type DemoUserDefinition = {
  id: string;
  email: string;
  displayName: string;
  role: "firm_owner" | "firm_employee" | "company_owner";
  description: string;
};

export const DEMO_USERS: DemoUserDefinition[] = [
  {
    id: "00000000-0000-0000-0000-00000000d201",
    email: "demo-firm-owner@example.com",
    displayName: "Demo Firm Owner",
    role: "firm_owner",
    description: "Full access across the firm and all connected clients.",
  },
  {
    id: "00000000-0000-0000-0000-00000000d202",
    email: "demo-firm-employee@example.com",
    displayName: "Demo Firm Employee",
    role: "firm_employee",
    description: "Team-level access for collaborating on assigned clients.",
  },
  {
    id: "00000000-0000-0000-0000-00000000d203",
    email: "demo-company-owner@example.com",
    displayName: "Demo Company Owner",
    role: "company_owner",
    description: "Company owner view focused on Profit First allocations.",
  },
];

export const demoUserMap = new Map(DEMO_USERS.map((user) => [user.id, user]));
