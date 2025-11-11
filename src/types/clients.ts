export type ClientWorkspaceType = "client" | "demo";

export interface ClientSummary {
  id: string;
  name: string;
  activeSince: string;
  type: ClientWorkspaceType;
  description?: string;
}
