"use client";

import { useMemo, useState } from "react";

import type { FirmEmployeeFormInput, FirmEmployeeSummary } from "@/types/firm";
import type { ClientSummary } from "@/types/clients";

interface FirmEmployeeManagerProps {
  firmName: string;
  employees: FirmEmployeeSummary[];
  companies: ClientSummary[];
  isLoading: boolean;
  errorMessage?: string | null;
  onCreate: (input: FirmEmployeeFormInput) => Promise<void>;
  onUpdate: (userId: string, updates: Omit<FirmEmployeeFormInput, "email">) => Promise<void>;
}

type FormState = {
  displayName: string;
  email: string;
  phoneNumber: string;
  companyIds: string[];
};

const emptyState: FormState = {
  displayName: "",
  email: "",
  phoneNumber: "",
  companyIds: [],
};

function normalizeCompanySelection(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function FirmEmployeeManager({
  firmName,
  employees,
  companies,
  isLoading,
  errorMessage,
  onCreate,
  onUpdate,
}: FirmEmployeeManagerProps) {
  const [formState, setFormState] = useState<FormState>(emptyState);
  const [mode, setMode] = useState<"idle" | "create" | { type: "edit"; userId: string }>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = mode !== "idle" && mode !== "create";

  const availableCompanies = useMemo(
    () =>
      companies.map((company) => ({
        id: company.id,
        name: company.name,
        type: company.type,
      })),
    [companies],
  );

  const exitForm = () => {
    setFormState(emptyState);
    setMode("idle");
    setFormError(null);
    setIsSubmitting(false);
  };

  const handleStartCreate = () => {
    setFormState(emptyState);
    setMode("create");
    setFormError(null);
    setStatusMessage(null);
  };

  const handleStartEdit = (employee: FirmEmployeeSummary) => {
    setFormState({
      displayName: employee.displayName,
      email: employee.email,
      phoneNumber: employee.phoneNumber ?? "",
      companyIds: employee.companyIds,
    });
    setMode({ type: "edit", userId: employee.userId });
    setFormError(null);
    setStatusMessage(null);
  };

  const handleCancel = () => {
    exitForm();
  };

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const handleCompanyToggle = (companyId: string) => {
    setFormState((previous) => {
      const nextSelection = previous.companyIds.includes(companyId)
        ? previous.companyIds.filter((id) => id !== companyId)
        : [...previous.companyIds, companyId];

      return { ...previous, companyIds: normalizeCompanySelection(nextSelection) };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setStatusMessage(null);

    try {
      if (mode === "create") {
        if (!formState.email.trim()) {
          throw new Error("Email address is required.");
        }

        await onCreate({
          displayName: formState.displayName.trim() || "New teammate",
          email: formState.email.trim(),
          phoneNumber: formState.phoneNumber.trim() || undefined,
          companyIds: formState.companyIds,
        });
        setStatusMessage("Employee created successfully.");
        exitForm();
      } else if (mode !== "idle") {
        await onUpdate(mode.userId, {
          displayName: formState.displayName.trim() || "Team member",
          phoneNumber: formState.phoneNumber.trim() || undefined,
          companyIds: formState.companyIds,
        });
        setStatusMessage("Employee access updated.");
        exitForm();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save employee details.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-900/10">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">Manage team</h2>
        <p className="text-sm text-slate-500">
          Invite and scope firm employees for <span className="font-medium text-slate-700">{firmName}</span>.
        </p>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-4 flex-1 space-y-4 overflow-auto">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Loading employees…
          </div>
        ) : employees.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No firm employees have been added yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {employees.map((employee) => (
              <li
                key={employee.userId}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 shadow-sm shadow-slate-900/5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{employee.displayName}</p>
                    <p className="text-xs text-slate-500">{employee.email}</p>
                    {employee.phoneNumber ? (
                      <p className="text-xs text-slate-500">{employee.phoneNumber}</p>
                    ) : null}
                    {employee.companyNames.length > 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Assigned to {employee.companyNames.join(", ")}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-amber-600">No company access assigned yet.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(employee)}
                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                  >
                    Edit access
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {statusMessage ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      <div className="mt-4 border-t border-slate-200 pt-4">
        {mode === "idle" ? (
          <button
            type="button"
            onClick={handleStartCreate}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
                <path d="M8 3.5v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            Add team member
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employee name</span>
                <input
                  type="text"
                  value={formState.displayName}
                  onChange={(event) => handleFieldChange("displayName", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Jordan Lee"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100"
                  placeholder="teammate@example.com"
                  disabled={isEditing}
                />
              </label>
              <label className="sm:col-span-2 text-sm font-medium text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</span>
                <input
                  type="tel"
                  value={formState.phoneNumber}
                  onChange={(event) => handleFieldChange("phoneNumber", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="+1 (555) 000-0000"
                />
              </label>
            </div>

            <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company access</legend>
              {availableCompanies.length === 0 ? (
                <p className="text-xs text-slate-500">No companies are available yet for this firm.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableCompanies.map((company) => {
                    const isSelected = formState.companyIds.includes(company.id);
                    return (
                      <label
                        key={company.id}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                          isSelected
                            ? "border-sky-400 bg-white text-sky-700"
                            : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCompanyToggle(company.id)}
                          className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-300"
                        />
                        <span className="font-medium">{company.name}</span>
                        {company.type === "demo" ? (
                          <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-sky-600">
                            Demo
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>

            {formError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Invite teammate"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
