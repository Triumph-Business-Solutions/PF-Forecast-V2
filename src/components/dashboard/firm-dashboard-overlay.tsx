"use client";

import { useEffect, useMemo } from "react";

import type { ClientSummary } from "@/types/clients";
import type {
  FirmCompanyFormInput,
  FirmEmployeeSummary,
  FirmMembershipSummary,
  FirmEmployeeFormInput,
} from "@/types/firm";

import { FirmEmployeeManager } from "@/components/dashboard/firm-employee-manager";
import { FirmCompanyCreator } from "@/components/dashboard/firm-company-creator";

interface FirmDashboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeClientId: string | null;
  assignedClients: ClientSummary[];
  demoClients: ClientSummary[];
  onSelectClient: (clientId: string) => void;
  isLoadingClients: boolean;
  clientFetchError?: string | null;
  ownerFirm?: FirmMembershipSummary | null;
  ownerFirmEmployees: FirmEmployeeSummary[];
  ownerFirmCompanies: ClientSummary[];
  isLoadingFirmData: boolean;
  firmDataError?: string | null;
  onCreateEmployee: (input: FirmEmployeeFormInput) => Promise<void>;
  onUpdateEmployee: (userId: string, updates: Omit<FirmEmployeeFormInput, "email">) => Promise<void>;
  onCreateCompany: (input: FirmCompanyFormInput) => Promise<void>;
}

type StatusDefinition = {
  label: string;
  className: string;
};

const STATUS_OPTIONS: StatusDefinition[] = [
  { label: "Healthy", className: "bg-emerald-100 text-emerald-700" },
  { label: "Watch", className: "bg-amber-100 text-amber-700" },
  { label: "At risk", className: "bg-rose-100 text-rose-700" },
  { label: "Baseline", className: "bg-slate-200 text-slate-700" },
];

function resolveStatus(index: number, type: ClientSummary["type"]): StatusDefinition {
  if (type === "demo") {
    return { label: "Demo", className: "bg-sky-100 text-sky-700" };
  }

  return STATUS_OPTIONS[index % STATUS_OPTIONS.length];
}

function resolveAccessLabel(accessLevel?: ClientSummary["accessLevel"]): string {
  switch (accessLevel) {
    case "firm_owner":
      return "Firm owner";
    case "firm_employee":
      return "Firm employee";
    case "company_owner":
      return "Company owner";
    default:
      return "Unassigned";
  }
}

function ClientList({
  clients,
  activeClientId,
  onSelectClient,
  onClose,
  isLoading,
  errorMessage,
}: {
  clients: ClientSummary[];
  activeClientId: string | null;
  onSelectClient: (clientId: string) => void;
  onClose: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}) {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
        Loading clients…
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
        No client workspaces are connected yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Client overview</h3>
            <p className="text-sm text-slate-500">Monitor every workspace connected to your firm.</p>
          </div>
        </div>
        {errorMessage ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{errorMessage}</p>
        ) : null}
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Active since</th>
              <th className="px-4 py-3 font-semibold">Access</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {clients.map((client, index) => {
              const status = resolveStatus(index, client.type);
              const isActive = client.id === activeClientId;
              return (
                <tr key={client.id} className={isActive ? "bg-sky-50" : undefined}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{client.name}</span>
                      <span className="text-xs text-slate-500">{client.description ?? "Workspace"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{client.activeSince}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{resolveAccessLabel(client.accessLevel)}</td>
                  <td className="px-4 py-4 text-sm capitalize text-slate-600">{client.type}</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectClient(client.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      {isActive ? "Viewing" : "Open workspace"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FirmDashboardOverlay({
  isOpen,
  onClose,
  activeClientId,
  assignedClients,
  demoClients,
  onSelectClient,
  isLoadingClients,
  clientFetchError,
  ownerFirm,
  ownerFirmEmployees,
  ownerFirmCompanies,
  isLoadingFirmData,
  firmDataError,
  onCreateEmployee,
  onUpdateEmployee,
  onCreateCompany,
}: FirmDashboardOverlayProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const clients = useMemo(() => {
    const combined = [...assignedClients.filter((client) => client.type === "client"), ...demoClients];
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [assignedClients, demoClients]);

  const realClientCount = useMemo(
    () => assignedClients.filter((client) => client.type === "client").length,
    [assignedClients],
  );
  const demoCount = demoClients.length;
  const totalClientCount = clients.length;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex min-h-screen items-center justify-center overflow-y-auto bg-slate-950 px-4 py-12 sm:px-6">
      <div
        className="absolute inset-0"
        role="presentation"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-6xl">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white shadow-[0_40px_80px_-40px_rgba(15,23,42,0.45)]">
          <header className="bg-slate-900 px-10 py-10 text-white">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">Firm dashboard</span>
                <h1 className="text-3xl font-semibold tracking-tight">Client portfolio overview</h1>
                <p className="max-w-2xl text-sm text-slate-200/80">
                  Review client assignments for your team and quickly open any workspace. Use the team manager to invite
                  additional employees as your firm grows.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20"
              >
                Close dashboard
              </button>
            </div>
            <dl className="mt-10 grid gap-6 text-left text-sm text-slate-100 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 px-6 py-5 shadow-inner shadow-slate-900/30">
                <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/80">Active clients</dt>
                <dd className="mt-2 text-3xl font-semibold text-white">{realClientCount}</dd>
                <span className="text-xs text-slate-200/70">Connected to your firm</span>
              </div>
              <div className="rounded-2xl bg-white/10 px-6 py-5 shadow-inner shadow-slate-900/30">
                <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/80">Demo workspaces</dt>
                <dd className="mt-2 text-3xl font-semibold text-white">{demoCount}</dd>
                <span className="text-xs text-slate-200/70">For onboarding and previews</span>
              </div>
              <div className="rounded-2xl bg-white/10 px-6 py-5 shadow-inner shadow-slate-900/30">
                <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-200/80">Total available</dt>
                <dd className="mt-2 text-3xl font-semibold text-white">{totalClientCount}</dd>
                <span className="text-xs text-slate-200/70">Ready to open instantly</span>
              </div>
            </dl>
          </header>

          <main className="bg-gradient-to-b from-white via-white to-slate-100 px-10 py-10">
            <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
              <div className="space-y-8">
                <ClientList
                  clients={clients}
                  activeClientId={activeClientId}
                  onSelectClient={onSelectClient}
                  onClose={onClose}
                  isLoading={isLoadingClients}
                  errorMessage={clientFetchError}
                />
              </div>

              {ownerFirm ? (
                <div className="flex flex-col gap-8">
                  <FirmCompanyCreator
                    firmName={ownerFirm.firmName}
                    existingCompanies={ownerFirmCompanies}
                    onCreate={onCreateCompany}
                  />
                  <FirmEmployeeManager
                    firmName={ownerFirm.firmName}
                    employees={ownerFirmEmployees}
                    companies={ownerFirmCompanies}
                    isLoading={isLoadingFirmData}
                    errorMessage={firmDataError}
                    onCreate={onCreateEmployee}
                    onUpdate={onUpdateEmployee}
                  />
                </div>
              ) : (
                <section className="rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center shadow-xl shadow-slate-900/10">
                  <h2 className="text-lg font-semibold text-slate-900">Scoped access</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Only firm owners can invite new employees or create client workspaces. Reach out to your practice lead if
                    you need additional access.
                  </p>
                </section>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
