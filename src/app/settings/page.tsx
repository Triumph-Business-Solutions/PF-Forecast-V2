"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HeroBackdrop } from "@/components/hero-backdrop";
import { AllocationCadenceForm } from "@/components/settings/allocation-cadence-form";
import { supabase } from "@/lib/supabase";
import { useDemoAuth } from "@/components/demo-auth-provider";
import { fetchClientWorkspaces } from "@/lib/clients/queries";
import type { ClientSummary } from "@/types/clients";
import {
  loadActiveCompany,
  saveActiveCompany,
  subscribeToActiveCompanyChanges,
} from "@/lib/active-company-storage";

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
        status: "available",
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
const DEFAULT_COMPANY_NAME = "None selected";

export default function SettingsPage() {
  const { user: demoUser, isLoading: isLoadingDemoUser } = useDemoAuth();
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>(initialSectionKey);
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const selectionMemory = useRef<Record<string, string | null>>({});
  const isFirmOwner = false;
  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return loadActiveCompany()?.id ?? "";
  });
  const [displayCompanyName, setDisplayCompanyName] = useState<string>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_COMPANY_NAME;
    }

    return loadActiveCompany()?.name ?? DEFAULT_COMPANY_NAME;
  });
  const [availableCompanies, setAvailableCompanies] = useState<ClientSummary[]>([]);
  const [isLoadingCompany, setIsLoadingCompany] = useState<boolean>(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [hasResolvedCompanies, setHasResolvedCompanies] = useState(false);

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

  const activeCompany = useMemo(
    () => availableCompanies.find((company) => company.id === activeCompanyId) ?? null,
    [activeCompanyId, availableCompanies],
  );

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
      setExpandedSections((previous) => ({
        ...previous,
        [section.key]: false,
      }));
      return;
    }

    setExpandedSections((previous) => ({
      ...previous,
      [section.key]: previous[section.key] ?? false,
    }));

    const existingSelection = selectionMemory.current[section.key];
    const firstAccessibleItem = section.items.find((item) => (item.requiresFirmOwner ? isFirmOwner : true));
    const nextSelection = existingSelection ?? (firstAccessibleItem ? getItemIdentifier(section.key, firstAccessibleItem) : null);

    selectionMemory.current[section.key] = nextSelection;
    setSelectedItemKey(nextSelection);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateFromStorage = () => {
      const stored = loadActiveCompany();
      setActiveCompanyId(stored?.id ?? "");
      setDisplayCompanyName(stored?.name ?? DEFAULT_COMPANY_NAME);
    };

    const unsubscribe = subscribeToActiveCompanyChanges(updateFromStorage);
    updateFromStorage();

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoadingDemoUser) {
      return;
    }

    let isMounted = true;

    const resolveCompanies = async () => {
      setIsLoadingCompany(true);
      setCompanyError(null);

      try {
        let userId: string | null = null;

        if (demoUser) {
          userId = demoUser.id;
        } else {
          const { data: userData, error: userError } = await supabase.auth.getUser();

          if (userError) {
            throw userError;
          }

          userId = userData.user?.id ?? null;
        }

        const result = await fetchClientWorkspaces(userId);

        if (!isMounted) {
          return;
        }

        const combined: ClientSummary[] = [...result.assigned, ...result.demos];
        setAvailableCompanies(combined);

        const stored = typeof window !== "undefined" ? loadActiveCompany() : null;
        const storedMatch = stored ? combined.find((company) => company.id === stored.id) : null;
        const fallback = storedMatch ?? combined[0] ?? null;

        if (fallback) {
          setActiveCompanyId(fallback.id);
          setDisplayCompanyName(fallback.name);
        } else {
          setActiveCompanyId("");
          setDisplayCompanyName(DEFAULT_COMPANY_NAME);
        }

        if (result.errors.length > 0) {
          setCompanyError("Some company records could not be loaded. Demo workspaces remain available.");
        } else {
          setCompanyError(null);
        }

        setHasResolvedCompanies(true);
      } catch (error) {
        console.error("Unable to load companies for settings", error);

        if (!isMounted) {
          return;
        }

        setAvailableCompanies([]);
        setActiveCompanyId("");
        setDisplayCompanyName(DEFAULT_COMPANY_NAME);
        setCompanyError("We couldn’t load company access for your account. Try again in a moment.");
        setHasResolvedCompanies(true);
      } finally {
        if (isMounted) {
          setIsLoadingCompany(false);
        }
      }
    };

    void resolveCompanies();

    return () => {
      isMounted = false;
    };
  }, [demoUser, isLoadingDemoUser]);

  useEffect(() => {
    if (!hasResolvedCompanies) {
      return;
    }

    if (!activeCompany) {
      saveActiveCompany(null);
      return;
    }

    saveActiveCompany({ id: activeCompany.id, name: activeCompany.name });
  }, [activeCompany, hasResolvedCompanies]);

  useEffect(() => {
    if (activeCompany) {
      setDisplayCompanyName(activeCompany.name);
    } else if (!isLoadingCompany && hasResolvedCompanies) {
      setDisplayCompanyName(DEFAULT_COMPANY_NAME);
    }
  }, [activeCompany, hasResolvedCompanies, isLoadingCompany]);

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

  const shouldShowSelectedItems = expandedSections[selectedSection.key] ?? false;

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((previous) => ({
      ...previous,
      [sectionKey]: !previous[sectionKey],
    }));
  };

  const shouldRenderAllocationCadence =
    selectedSection.key === "profit_first_setup" && selectedItem?.title === "Allocation cadence";
  const resolvedCompanyName = activeCompany?.name ?? displayCompanyName;
  const canRenderCadenceForm =
    shouldRenderAllocationCadence && Boolean(activeCompanyId) && (!hasResolvedCompanies || Boolean(activeCompany));
  const shouldShowCadenceSkeleton = shouldRenderAllocationCadence && isLoadingCompany && !activeCompanyId;
  const shouldShowCadenceUnavailable =
    shouldRenderAllocationCadence && hasResolvedCompanies && !isLoadingCompany && !activeCompanyId;

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
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200/80">
                  <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-1 font-semibold uppercase tracking-[0.35em] text-sky-100">
                    Active company · {resolvedCompanyName}
                  </span>
                  {isLoadingCompany ? (
                    <span className="text-[0.7rem] text-slate-200/70">Loading company access…</span>
                  ) : null}
                </div>
              </div>
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
                        onClick={() => handleSectionSelect(section)}
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Available modules</p>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedSection.title}</h3>
                  <p className="text-sm text-slate-600">Choose a workflow to view details.</p>
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

            {hasSelectedItems && shouldShowSelectedItems && visibleSelectedItems.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleSelectedItems.map((item) => {
                    const identifier = getItemIdentifier(selectedSection.key, item);
                    const isActive = identifier === selectedItemKey;

                    return (
                      <button
                        key={identifier}
                        type="button"
                        onClick={() => handleItemSelect(selectedSection.key, item)}
                        className={`rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                          isActive
                            ? "border-brand-200 bg-brand-50/80 text-slate-900 shadow"
                            : "border-slate-200/80 bg-white/80 text-slate-700 hover:border-slate-300 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Workflow focus</p>
                            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                          </div>
                          {item.status && (
                            <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                              {statusCopy[item.status]}
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-slate-700">{item.description}</p>
                      </button>
                    );
                  })}
                </div>

                {selectedItem && (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-inner shadow-white">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Selected workflow</p>
                        <h3 className="text-xl font-semibold text-slate-900">{selectedItem.title}</h3>
                      </div>
                      {selectedItem.status && (
                        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                          {statusCopy[selectedItem.status]}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{selectedItem.description}</p>
                    {canRenderCadenceForm ? (
                      <AllocationCadenceForm
                        companyId={activeCompanyId}
                        companyName={resolvedCompanyName}
                        key={activeCompanyId}
                      />
                    ) : null}
                    {shouldShowCadenceSkeleton ? (
                      <div className="mt-6 space-y-2 text-sm text-slate-500">
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                        <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
                      </div>
                    ) : null}
                    {shouldShowCadenceUnavailable ? (
                      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        Select an active company from the dashboard to configure allocation cadence for its forecast.
                      </div>
                    ) : null}
                    {companyError ? (
                      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {companyError}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {hasSelectedItems && !shouldShowSelectedItems && (
              <p className="mt-6 text-xs text-slate-500">
                Expand to preview the focused modules that will live inside this area.
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
        </section>
      </div>
    </main>
  );
}

