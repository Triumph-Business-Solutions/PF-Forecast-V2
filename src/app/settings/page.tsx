"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

const sections: SectionDefinition[] = [
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
    description: "Configure allocations, cadence, and tax plans in one place. Expand to preview the upcoming modules.",
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
        description: "Firm owners can manage staff assignments across every connected client organization.",
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
];

const statusCopy: Record<NonNullable<SectionItem["status"]>, string> = {
  available: "Available",
  upcoming: "Coming soon",
};

const initialSectionKey = sections[0]?.key ?? "";

export default function SettingsPage() {
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>(initialSectionKey);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const selectionMemory = useRef<Record<string, string | null>>({});
  const isFirmOwner = false;

  const selectedSection = useMemo(
    () => sections.find((section) => section.key === selectedSectionKey) ?? sections[0],
    [selectedSectionKey],
  );

  const visibleSelectedItems = useMemo(
    () =>
      selectedSection?.items?.filter((item) => (item.requiresFirmOwner ? isFirmOwner : true)) ?? [],
    [selectedSection, isFirmOwner],
  );

  const hasSelectedItems = Boolean(selectedSection?.items?.length);
  const hasVisibleItems = visibleSelectedItems.length > 0;
  const hiddenFirmOwnerItems = selectedSection?.items?.some((item) => item.requiresFirmOwner) && !isFirmOwner;

  const getItemIdentifier = (sectionKey: string, item: SectionItem) => `${sectionKey}:${item.title}`;

  useEffect(() => {
    if (!selectedSection) {
      return;
    }

    if (!hasVisibleItems) {
      if (selectionMemory.current[selectedSection.key]) {
        selectionMemory.current[selectedSection.key] = null;
      }

      if (selectedItemKey !== null) {
        setSelectedItemKey(null);
      }

      return;
    }

    const storedSelection = selectionMemory.current[selectedSection.key];
    const hasStoredSelection = storedSelection
      ? visibleSelectedItems.some((item) => getItemIdentifier(selectedSection.key, item) === storedSelection)
      : false;

    if (hasStoredSelection) {
      if (storedSelection !== selectedItemKey) {
        setSelectedItemKey(storedSelection);
      }
      return;
    }

    const fallbackIdentifier = getItemIdentifier(selectedSection.key, visibleSelectedItems[0]);
    selectionMemory.current[selectedSection.key] = fallbackIdentifier;

    if (fallbackIdentifier !== selectedItemKey) {
      setSelectedItemKey(fallbackIdentifier);
    }
  }, [hasVisibleItems, selectedItemKey, selectedSection, visibleSelectedItems]);

  const handleSectionSelect = (section: SectionDefinition) => {
    setSelectedSectionKey(section.key);

    if (!section.items?.length) {
      selectionMemory.current[section.key] = null;
      setSelectedItemKey(null);
      return;
    }

    const existingSelection = selectionMemory.current[section.key];
    const firstAccessibleItem = section.items.find((item) => (item.requiresFirmOwner ? isFirmOwner : true));
    const nextSelection = existingSelection ?? (firstAccessibleItem ? getItemIdentifier(section.key, firstAccessibleItem) : null);

    selectionMemory.current[section.key] = nextSelection;
    setSelectedItemKey(nextSelection);
  };

  const handleItemSelect = (sectionKey: string, item: SectionItem) => {
    const identifier = getItemIdentifier(sectionKey, item);
    selectionMemory.current[sectionKey] = identifier;
    setSelectedItemKey(identifier);
  };

  const selectedItem = useMemo(
    () =>
      visibleSelectedItems.find((item) => getItemIdentifier(selectedSection.key, item) === selectedItemKey) ?? null,
    [selectedItemKey, selectedSection.key, visibleSelectedItems],
  );

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
                    onClick={() => handleSectionSelect(section)}
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

          <div className="flex flex-1 flex-col gap-6 lg:flex-row">
            {hasVisibleItems && visibleSelectedItems && (
              <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:w-72 lg:shrink-0">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Available modules</p>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedSection.title}</h3>
                  <p className="text-sm text-slate-600">Choose a workflow to view details.</p>
                </div>

                <ul className="mt-4 space-y-2">
                  {visibleSelectedItems.map((item) => {
                    const itemIdentifier = getItemIdentifier(selectedSection.key, item);
                    const isActive = selectedItemKey === itemIdentifier;

                    return (
                      <li key={itemIdentifier}>
                        <button
                          type="button"
                          onClick={() => handleItemSelect(selectedSection.key, item)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                            isActive
                              ? "border-brand-300 bg-brand-50 text-brand-900 shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{item.title}</span>
                            {item.status && (
                              <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                                {statusCopy[item.status]}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            )}

            <article className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <header className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Selected module</p>
                <h2 className="text-2xl font-semibold text-slate-900">{selectedSection.title}</h2>
                <p className="text-sm text-slate-600">{selectedSection.description}</p>
              </header>

              {selectedItem && (
                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Workflow focus</p>
                        <h3 className="text-xl font-semibold text-slate-900">{selectedItem.title}</h3>
                      </div>
                      {selectedItem.status && (
                        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                          {statusCopy[selectedItem.status]}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{selectedItem.description}</p>
                  </div>
                </div>
              )}

              {hasSelectedItems && !hasVisibleItems && (
                <p className="mt-6 text-xs text-slate-500">
                  Modules that require firm owner access will appear here automatically when available.
                </p>
              )}

              {!hasSelectedItems && (
                <span className="mt-6 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Placeholder
                </span>
              )}

              {hasSelectedItems && hiddenFirmOwnerItems && !isFirmOwner && (
                <p className="mt-6 text-xs text-amber-600">
                  Firm-only controls are hidden here and will display automatically when a firm owner is signed in.
                </p>
              )}
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

