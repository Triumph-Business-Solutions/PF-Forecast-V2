"use client";

import { useMemo, useState } from "react";

import type { ClientSummary } from "@/types/clients";
import type { FirmCompanyFormInput } from "@/types/firm";

interface FirmCompanyCreatorProps {
  firmName: string;
  existingCompanies: ClientSummary[];
  onCreate: (input: FirmCompanyFormInput) => Promise<void>;
}

interface FormState {
  name: string;
  description: string;
  activeSince: string;
}

function resolveDefaultDate() {
  return new Date().toISOString().slice(0, 10);
}

function createInitialState(): FormState {
  return {
    name: "",
    description: "",
    activeSince: resolveDefaultDate(),
  };
}

export function FirmCompanyCreator({ firmName, existingCompanies, onCreate }: FirmCompanyCreatorProps) {
  const [formState, setFormState] = useState<FormState>(() => createInitialState());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { realClientNames, realClientCount } = useMemo(() => {
    const realClients = existingCompanies.filter((company) => company.type === "client");
    return {
      realClientNames: realClients.map((company) => company.name).sort((a, b) => a.localeCompare(b)),
      realClientCount: realClients.length,
    };
  }, [existingCompanies]);

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const payload: FirmCompanyFormInput = {
        name: formState.name.trim(),
        description: formState.description.trim() ? formState.description.trim() : undefined,
        activeSince: formState.activeSince.trim() ? formState.activeSince.trim() : undefined,
      };

      if (!payload.name) {
        throw new Error("Company name is required.");
      }

      await onCreate(payload);
      setStatusMessage("Client workspace created.");
      setFormState(createInitialState());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create the client workspace.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex flex-col rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-900/10">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <h2 className="text-lg font-semibold text-slate-900">Add new client</h2>
        <p className="text-sm text-slate-500">
          Create an additional workspace for <span className="font-medium text-slate-700">{firmName}</span>.
        </p>
        {realClientCount > 0 ? (
          <p className="text-xs text-slate-400">
            Currently managing {realClientCount} active client{realClientCount === 1 ? "" : "s"}
            {realClientNames.length > 0 ? `: ${realClientNames.join(", ")}` : "."}
          </p>
        ) : (
          <p className="text-xs text-slate-400">No active clients are connected yet.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company name</span>
          <input
            type="text"
            value={formState.name}
            onChange={(event) => handleFieldChange("name", event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="New company"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active since</span>
          <input
            type="date"
            value={formState.activeSince}
            onChange={(event) => handleFieldChange("activeSince", event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
          <textarea
            value={formState.description}
            onChange={(event) => handleFieldChange("description", event.target.value)}
            className="mt-2 h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Brief summary of the company's focus"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
        ) : null}
        {statusMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{statusMessage}</div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? "Creating…" : "Create client workspace"}
        </button>
      </form>
    </section>
  );
}
