import type { ClientSummary } from "@/types/clients";

export const DEMO_FIRM_ID = "00000000-0000-0000-0000-00000000d001";

export const DEMO_CLIENTS: ClientSummary[] = [
  {
    id: "00000000-0000-0000-0000-00000000d101",
    name: "Triumph Demo",
    activeSince: "January 2023",
    type: "demo",
    description: "Fully populated workspace ideal for guided onboarding walkthroughs.",
  },
  {
    id: "00000000-0000-0000-0000-00000000d102",
    name: "Acme Plumbing",
    activeSince: "March 2023",
    type: "demo",
    description: "Service-based scenario to test allocations and cash flow experiments.",
  },
];
