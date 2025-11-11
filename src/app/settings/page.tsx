"use client";

import { HeroBackdrop } from "@/components/hero-backdrop";
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

  const moduleStats = useMemo(() => {
    const items = sections.flatMap((section) => section.items ?? []);
    return {
      availableTools: items.filter((item) => item.status === "available").length,
      upcomingTools: items.filter((item) => item.status === "upcoming").length,
      firmRestrictedTools: items.filter((item) => item.requiresFirmOwner).length,
    };
  }, [sections]);

  const { availableTools, upcomingTools, firmRestrictedTools } = moduleStats;

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
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200 pb-16">
      <header className="relative overflow-hidden bg-slate-900 text-white shadow-2xl shadow-slate-900/30">
        <HeroBackdrop />
        <div className="relative mx-auto flex w-full flex-col gap-8 px-4 py-12 sm:px-[5vw]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/80">
                Settings overview
              </span>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Configure the Profit First Forecasting workspace
                </h1>
                <p className="text-base text-slate-200/80 sm:text-lg">
                  Centralize onboarding tasks, connect bank accounts, and prepare allocation rules. Each module below guides
                  teams through focused configuration flows as functionality rolls out.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-slate-200/80">
              <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2">
                {sections.length} primary modules
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2">
                {availableTools} tools available
              </span>
              <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2">
                {upcomingTools} coming soon
              </span>
              {firmRestrictedTools ? (
                <span className="rounded-full border border-white/20 bg-white/5 px-4 py-2">
                  {firmRestrictedTools} firm-owner only
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full flex-col gap-12 px-4 py-12 sm:px-[5vw]">
        <section className="flex flex-col gap-8 lg:flex-row">
          <aside className="lg:w-80 lg:shrink-0">
            <div className="rounded-3xl border border-white/70 bg-white/95 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur">
              <div className="flex snap-x overflow-x-auto pb-2 lg:block lg:pb-0">
                <ul className="flex min-w-full snap-x gap-3 lg:flex-col lg:gap-2">
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
                        className={`w-full rounded-xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                          selectedSectionKey === section.key
                            ? "border-brand-200 bg-brand-50/80 text-slate-900 shadow"
                            : "border-slate-200/80 bg-white/80 text-slate-700 hover:border-slate-300 hover:text-slate-900"
                        }`}
                        aria-current={selectedSectionKey === section.key ? "page" : undefined}
                      >
                        <p className="text-sm font-semibold">{section.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{section.description}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          <article className="flex-1 rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur">
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
                    className="flex shrink-0 items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
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
                  <span className="rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Placeholder
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">{selectedSection.description}</p>
            </header>

            {hasSelectedItems && shouldShowSelectedItems && visibleSelectedItems && (
              <div className="mt-6 space-y-4">
                {visibleSelectedItems.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-inner shadow-white">
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
              <p className="mt-6 text-xs text-slate-500">
                Expand to preview the focused modules that will live inside this area.
              </p>
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

