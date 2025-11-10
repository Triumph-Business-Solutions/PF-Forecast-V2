"use client";

import { useMemo, useState } from "react";

type SectionItem = {
  title: string;
  description: string;
  status?: "available" | "upcoming";
  requiresFirmOwner?: boolean;
};

type SectionDefinition = {
  key: string;
  title: string;
  description: string;
  items?: SectionItem[];
};

const statusCopy: Record<NonNullable<SectionItem["status"]>, string> = {
  available: "Available",
  upcoming: "Coming soon",
};

export default function SettingsPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>("onboarding");
  const isFirmOwner = false;

  const sections = useMemo<SectionDefinition[]>(
    () => [
      {
        key: "onboarding",
        title: "Onboarding walkthrough",
        description:
          "Guide clients through the essential configuration steps with a structured checklist experience.",
      },
      {
        key: "historical-data-import",
        title: "Historical data import",
        description:
          "Upload CSV actuals that will seed forecasting models and inform allocation recommendations.",
      },
      {
        key: "bank-accounts",
        title: "Bank accounts",
        description:
          "Capture opening balances for every active and custom account to establish an accurate cash baseline.",
      },
      {
        key: "profit-first-setup",
        title: "Profit First setup",
        description:
          "Configure allocations, cadence, and tax plans in one place. Expand to preview the upcoming modules.",
        items: [
          {
            title: "Allocation cadence",
            description: "Schedule how frequently the system should run profit allocations for this company.",
            status: "upcoming",
          },
          {
            title: "Profit distribution",
            description: "Define owner payout targets and the workflow for releasing distributions.",
            status: "upcoming",
          },
          {
            title: "Tax strategy",
            description: "Plan quarterly set-asides with templates tailored to the company’s tax posture.",
            status: "upcoming",
          },
        ],
      },
      {
        key: "other",
        title: "Other tools",
        description:
          "Administrative utilities that keep teams aligned, maintain visibility, and gather product feedback.",
        items: [
          {
            title: "Manage company users",
            description: "Invite collaborators and manage access for the current company workspace.",
            status: "available",
          },
          {
            title: "Manage firm users",
            description:
              "Firm owners can manage staff assignments across every connected client organization.",
            requiresFirmOwner: true,
            status: "available",
          },
          {
            title: "Audit report",
            description: "Review a chronological log of configuration changes and the team members behind them.",
            status: "upcoming",
          },
          {
            title: "Share feedback",
            description: "Submit product ideas, bug reports, or workflow requests directly to the platform team.",
            status: "available",
          },
        ],
      },
    ],
    [],
  );

  const toggleSection = (key: string) => {
    setExpandedSections((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const selectedSection = sections.find((section) => section.key === selectedSectionKey) ?? sections[0];
  const hasSelectedItems = Boolean(selectedSection?.items?.length);
  const visibleSelectedItems = selectedSection?.items?.filter((item) =>
    item.requiresFirmOwner ? isFirmOwner : true,
  );
  const shouldShowSelectedItems = hasSelectedItems && (expandedSections[selectedSection.key] ?? false);
  const hiddenFirmOwnerItems = selectedSection?.items?.some((item) => item.requiresFirmOwner) && !isFirmOwner;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="space-y-4 text-center">
          <span className="inline-flex items-center rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold text-brand-700">
            Settings overview
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Configure the Profit First Forecasting workspace
          </h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600 sm:text-lg">
            Centralize onboarding tasks, connect bank accounts, and prepare allocation rules. Each module below will guide users
            through focused configuration flows as functionality rolls out.
          </p>
        </header>

        <section className="flex flex-col gap-8 lg:flex-row">
          <nav className="-mx-4 flex snap-x overflow-x-auto pb-2 lg:mx-0 lg:block lg:w-80 lg:shrink-0 lg:pb-0">
            <ul className="flex min-w-full snap-x gap-3 px-4 lg:flex-col lg:gap-2 lg:px-0">
              {sections.map((section) => (
                <li key={section.key} className="snap-start lg:snap-none">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSectionKey(section.key);
                      if (section.items?.length) {
                        setExpandedSections((previous) => ({
                          ...previous,
                          [section.key]: previous[section.key] ?? false,
                        }));
                      }
                    }}
                    className={`w-full rounded-xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 lg:px-4 lg:py-3 ${
                      selectedSectionKey === section.key
                        ? "border-brand-300 bg-brand-50 text-brand-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                    }`}
                    aria-current={selectedSectionKey === section.key ? "page" : undefined}
                  >
                    <p className="text-sm font-semibold">{section.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{section.description}</p>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <article className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <header className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Selected module</p>
                  <h2 className="text-2xl font-semibold text-slate-900">{selectedSection.title}</h2>
                </div>
                {hasSelectedItems ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(selectedSection.key)}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    aria-expanded={expandedSections[selectedSection.key] ?? false}
                  >
                    {expandedSections[selectedSection.key] ? "Collapse" : "Expand"}
                    <span
                      className={`inline-block h-4 w-4 transition-transform ${
                        expandedSections[selectedSection.key] ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    >
                      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M4 6l4 4 4-4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Placeholder
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">{selectedSection.description}</p>
            </header>

            {hasSelectedItems && shouldShowSelectedItems && visibleSelectedItems && (
              <div className="mt-6 space-y-4">
                {visibleSelectedItems.map((item) => (
                  <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                      {item.status && (
                        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-700">
                          {statusCopy[item.status]}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            )}

            {hasSelectedItems && !shouldShowSelectedItems && (
              <p className="mt-6 text-xs text-slate-500">Expand to preview the focused modules that will live inside this area.</p>
            )}

            {hasSelectedItems && hiddenFirmOwnerItems && !isFirmOwner && (
              <p className="mt-6 text-xs text-amber-600">
                Firm-only controls are hidden here and will display automatically when a firm owner is signed in.
              </p>
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

