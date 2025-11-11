"use client";

import { HeroBackdrop } from "@/components/hero-backdrop";
import { fetchClientWorkspaces } from "@/lib/clients/queries";
import { ROLE_DEFINITIONS } from "@/lib/auth/roles";
import { supabase } from "@/lib/supabase";
import type { ClientSummary } from "@/types/clients";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useDemoAuth } from "@/components/demo-auth-provider";

type TrendPoint = {
  label: string;
  value: number;
};

type TrendSeries = {
  name: string;
  color: string;
  points: TrendPoint[];
};

type Cadence = "Monthly" | "Weekly";
type TrendView = "Total" | "Accounts";

type TableRowDefinition = {
  label: string;
  sublabel?: string;
  monthly: string[];
  weekly: string[];
};

type TableRow = {
  label: string;
  sublabel?: string;
  values: string[];
};

const VIEW_OPTIONS = ["3 months", "6 months", "12 months", "18 months", "Custom"] as const;

type ViewOption = (typeof VIEW_OPTIONS)[number];

const MONTH_LABELS = [
  "Jan '23",
  "Feb '23",
  "Mar '23",
  "Apr '23",
  "May '23",
  "Jun '23",
  "Jul '23",
  "Aug '23",
  "Sep '23",
  "Oct '23",
  "Nov '23",
  "Dec '23",
  "Jan '24",
  "Feb '24",
  "Mar '24",
  "Apr '24",
  "May '24",
  "Jun '24"
];

const WEEK_HEADERS = [
  "Week 1",
  "Week 2",
  "Week 3",
  "Week 4",
  "Week 5",
  "Week 6",
  "Week 7",
  "Week 8"
];

const TREND_POINTS: TrendPoint[] = MONTH_LABELS.map((label, index) => ({
  label,
  value: 50 + index * 12 - (index % 4 === 0 ? 20 : 0)
}));

const TREND_ACCOUNT_SERIES: TrendSeries[] = [
  {
    name: "Income",
    color: "#38bdf8",
    points: TREND_POINTS.map((point, index) => ({ ...point, value: point.value + 30 - (index % 5) * 8 }))
  },
  {
    name: "Profit",
    color: "#22d3ee",
    points: TREND_POINTS.map((point, index) => ({ ...point, value: point.value - 25 + (index % 4) * 6 }))
  },
  {
    name: "Operating",
    color: "#0ea5e9",
    points: TREND_POINTS.map((point, index) => ({ ...point, value: point.value - 60 + (index % 3) * 9 }))
  }
];

const WEEK_TREND_POINTS: TrendPoint[] = WEEK_HEADERS.map((label, index) => ({
  label,
  value: 40 + index * 6 - (index % 2 === 0 ? 3 : 0)
}));

const WEEK_TREND_ACCOUNT_SERIES: TrendSeries[] = [
  {
    name: "Income",
    color: "#38bdf8",
    points: WEEK_TREND_POINTS.map((point, index) => ({ ...point, value: point.value + 8 - (index % 3) * 2 }))
  },
  {
    name: "Profit",
    color: "#22d3ee",
    points: WEEK_TREND_POINTS.map((point, index) => ({ ...point, value: point.value - 4 + (index % 4) * 3 }))
  },
  {
    name: "Operating",
    color: "#0ea5e9",
    points: WEEK_TREND_POINTS.map((point, index) => ({ ...point, value: point.value - 15 + (index % 2) * 4 }))
  }
];

const MONTH_HEADERS = MONTH_LABELS;

const VIEW_MONTH_COUNTS: Record<ViewOption, number | null> = {
  "3 months": 3,
  "6 months": 6,
  "12 months": 12,
  "18 months": 18,
  Custom: null
};

const createPlaceholderValues = (length: number) => Array.from({ length }, () => "—");

const ENDING_BALANCE_ROWS: TableRowDefinition[] = [
  { label: "Income", sublabel: "Core Account", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) },
  { label: "Profit", sublabel: "Profit First", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) },
  { label: "Owner's Pay", sublabel: "Profit First", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) },
  { label: "Tax", sublabel: "Profit First", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) },
  { label: "OpEx", sublabel: "Operating", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) },
  { label: "Vault", sublabel: "Reserve", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) }
];

const NET_ACTIVITY_ROWS: TableRowDefinition[] = [
  { label: "Income", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) },
  { label: "Profit", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) },
  { label: "Owner's Pay", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) },
  { label: "Tax", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) },
  { label: "OpEx", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) },
  { label: "Vault", monthly: createPlaceholderValues(MONTH_HEADERS.length), weekly: createPlaceholderValues(WEEK_HEADERS.length) }
];

const SUMMARY_METRICS = [
  {
    title: "Current balance",
    value: "$0.00"
  },
  {
    title: "Total inflow",
    value: "$0.00"
  },
  {
    title: "Total outflow",
    value: "$0.00"
  },
  {
    title: "Net activity",
    value: "$0.00"
  }
];

const UPCOMING_MILESTONES = [
  {
    label: "Next allocation",
    value: "—"
  },
  {
    label: "Next profit distribution",
    value: "—"
  },
  {
    label: "Next tax payment",
    value: "—"
  }
];

function TrendChart({ series }: { series: TrendSeries[] }) {
  const width = 720;
  const height = 260;
  const paddingX = 32;
  const paddingY = 36;

  const allPoints = series.flatMap((item) => item.points);
  const values = allPoints.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const coordinateSeries = series.map((item) =>
    item.points.map((point, index) => {
      const x = paddingX + (index / Math.max(item.points.length - 1, 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((point.value - minValue) / range) * (height - paddingY * 2);
      return { x, y, label: point.label };
    })
  );

  const primarySeries = coordinateSeries[0] ?? [];
  const linePath = primarySeries
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(2)},${coord.y.toFixed(2)}`)
    .join(" ");

  const areaPath = primarySeries.length
    ? `${linePath} L${primarySeries[primarySeries.length - 1]?.x.toFixed(2) ?? 0},${height - paddingY} L${
        primarySeries[0]?.x.toFixed(2) ?? 0
      },${height - paddingY} Z`
    : "";

  const ySteps = 4;
  const yAxis = Array.from({ length: ySteps + 1 }, (_, index) => {
    const value = minValue + (range / ySteps) * index;
    const position = height - paddingY - ((value - minValue) / range) * (height - paddingY * 2);
    return { value, position };
  });

  const labels = primarySeries.map((coord) => coord.label);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full text-sky-500">
      <defs>
        <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} rx={24} fill="#ffffff" />
      {areaPath && <path d={areaPath} fill="url(#trend-fill)" stroke="none" />}
      {coordinateSeries.map((coords, seriesIndex) => {
        const color = series[seriesIndex]?.color ?? "currentColor";
        const path = coords
          .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(2)},${coord.y.toFixed(2)}`)
          .join(" ");
        return (
          <g key={series[seriesIndex]?.name ?? seriesIndex}>
            <path d={path} fill="none" stroke={color} strokeWidth={seriesIndex === 0 ? 3 : 2} strokeLinecap="round" />
            {coords.map((coord) => (
              <circle
                key={`${seriesIndex}-${coord.label}`}
                cx={coord.x}
                cy={coord.y}
                r={seriesIndex === 0 ? 4.5 : 3.5}
                className="fill-white"
                stroke={color}
                strokeWidth={2}
              />
            ))}
          </g>
        );
      })}
      {yAxis.map((tick) => (
        <g key={tick.value}>
          <line x1={paddingX} x2={width - paddingX} y1={tick.position} y2={tick.position} stroke="#e2e8f0" strokeDasharray="4 6" />
          <text x={paddingX - 10} y={tick.position + 4} textAnchor="end" className="fill-slate-400 text-xs">
            {Math.round(tick.value)}
          </text>
        </g>
      ))}
      {primarySeries.map((coord, index) => (
        <text key={`label-${labels[index]}`} x={coord.x} y={height - paddingY + 24} textAnchor="middle" className="fill-slate-400 text-xs">
          {labels[index]}
        </text>
      ))}
    </svg>
  );
}

function DataTable({
  headers,
  rows
}: {
  headers: string[];
  rows: TableRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-6 py-3 font-semibold">Account</th>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.label} className="bg-white hover:bg-slate-50">
              <td className="whitespace-nowrap px-6 py-3">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-700">{row.label}</span>
                  {row.sublabel && <span className="text-xs text-slate-400">{row.sublabel}</span>}
                </div>
              </td>
              {row.values.map((value, index) => (
                <td key={`${row.label}-${index}`} className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HomePage() {
  const [selectedView, setSelectedView] = useState<ViewOption>("6 months");
  const [startMonth, setStartMonth] = useState(() => {
    const iso = new Date().toISOString().slice(0, 7);
    return iso;
  });
  const [customRange, setCustomRange] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return { start: today, end: today };
  });
  const [cadence, setCadence] = useState<Cadence>("Monthly");
  const [trendView, setTrendView] = useState<TrendView>("Total");
  const roleTitleMap = useMemo(() => new Map(ROLE_DEFINITIONS.map((role) => [role.id, role.title])), []);
  const router = useRouter();
  const { user: demoUser, isLoading: isLoadingDemoUser } = useDemoAuth();
  const [hasSupabaseSession, setHasSupabaseSession] = useState<boolean | null>(null);
  const [assignedClients, setAssignedClients] = useState<ClientSummary[]>([]);
  const [demoClients, setDemoClients] = useState<ClientSummary[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientFetchError, setClientFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoadingDemoUser) {
      return;
    }

    let isMounted = true;

    const loadClients = async () => {
      setIsLoadingClients(true);
      setClientFetchError(null);

      try {
        let userId: string | null = null;

        if (demoUser) {
          userId = demoUser.id;
          setHasSupabaseSession(false);
        } else {
          const { data: userData, error: userError } = await supabase.auth.getUser();

          if (userError) {
            throw userError;
          }

          userId = userData.user?.id ?? null;
          setHasSupabaseSession(Boolean(userId));
        }

        const result = await fetchClientWorkspaces(userId, demoUser?.role ?? null);

        if (!isMounted) {
          return;
        }

        const nextAssigned = result.assigned;
        const nextDemos = result.demos;

        setAssignedClients(nextAssigned);
        setDemoClients(nextDemos);

        if (result.errors.length > 0) {
          const hasAssigned = result.assigned.length > 0;
          setClientFetchError(
            hasAssigned
              ? "Some client records could not be loaded. Demo workspaces remain available."
              : "We couldn't load your assigned clients. Demo workspaces are still available.",
          );
        } else if (!userId) {
          setClientFetchError(
            "Select a demo user to view assigned clients. Demo workspaces are available to explore.",
          );
        } else {
          setClientFetchError(null);
        }
      } catch (error) {
        console.error("Failed to resolve client workspaces for the current user.", error);

        if (!isMounted) {
          return;
        }

        try {
          const demosOnly = await fetchClientWorkspaces(null);

          if (isMounted) {
            setAssignedClients([]);
            setDemoClients(demosOnly.demos);
          }
        } catch (fallbackError) {
          console.error("Failed to load demo workspaces.", fallbackError);

          if (isMounted) {
            setAssignedClients([]);
            setDemoClients([]);
          }
        }

        setClientFetchError("We couldn't verify your account. Demo workspaces are available while we investigate.");
        if (isMounted) {
          setHasSupabaseSession(false);
        }
      } finally {
        if (isMounted) {
          setIsLoadingClients(false);
        }
      }
    };

    void loadClients();

    return () => {
      isMounted = false;
    };
  }, [demoUser, isLoadingDemoUser]);

  useEffect(() => {
    if (isLoadingDemoUser) {
      return;
    }

    if (!demoUser && hasSupabaseSession === false) {
      router.replace("/login");
    }
  }, [demoUser, hasSupabaseSession, isLoadingDemoUser, router]);

  const trendSeries = useMemo(() => {
    const sourceSeries = cadence === "Monthly" ? (trendView === "Total" ? [{
          name: "Total balance",
          color: "#38bdf8",
          points: TREND_POINTS
        }] : TREND_ACCOUNT_SERIES) : trendView === "Total"
        ? [
            {
              name: "Total balance",
              color: "#38bdf8",
              points: WEEK_TREND_POINTS
            }
          ]
        : WEEK_TREND_ACCOUNT_SERIES;

    const monthCount = VIEW_MONTH_COUNTS[selectedView];
    if (cadence === "Weekly" || !monthCount) {
      return sourceSeries.map((series) => ({
        ...series,
        points: series.points
      }));
    }

    return sourceSeries.map((series) => ({
      ...series,
      points: series.points.slice(-monthCount)
    }));
  }, [cadence, selectedView, trendView]);

  const monthlyHeaders = useMemo(() => {
    const monthCount = VIEW_MONTH_COUNTS[selectedView];
    if (!monthCount) {
      return MONTH_HEADERS;
    }

    return MONTH_HEADERS.slice(-monthCount);
  }, [selectedView]);

  const balanceHeaders = cadence === "Monthly" ? monthlyHeaders : WEEK_HEADERS;
  const balanceRows = useMemo<TableRow[]>(
    () =>
      ENDING_BALANCE_ROWS.map((row) => ({
        label: row.label,
        sublabel: row.sublabel,
        values: cadence === "Monthly" ? row.monthly.slice(-monthlyHeaders.length) : row.weekly
      })),
    [cadence, monthlyHeaders.length]
  );

  const activityHeaders = cadence === "Monthly" ? monthlyHeaders : WEEK_HEADERS;
  const activityRows = useMemo<TableRow[]>(
    () =>
      NET_ACTIVITY_ROWS.map((row) => ({
        label: row.label,
        sublabel: row.sublabel,
        values: cadence === "Monthly" ? row.monthly.slice(-monthlyHeaders.length) : row.weekly
      })),
    [cadence, monthlyHeaders.length]
  );

  const availableClients = useMemo<ClientSummary[]>(() => {
    const roster = new Map<string, ClientSummary>();

    assignedClients.forEach((client) => {
      roster.set(client.id, client);
    });

    demoClients.forEach((client) => {
      roster.set(client.id, client);
    });

    return Array.from(roster.values());
  }, [assignedClients, demoClients]);

  const [activeClientId, setActiveClientId] = useState<string>("");
  const [isClientMenuOpen, setIsClientMenuOpen] = useState(false);
  const clientMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const clientMenuPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeClientId && availableClients.length > 0) {
      setActiveClientId(availableClients[0].id);
      return;
    }

    const stillVisible = availableClients.some((client) => client.id === activeClientId);
    if (!stillVisible) {
      setActiveClientId(availableClients[0]?.id ?? "");
    }
  }, [activeClientId, availableClients]);

  const canSwitchClients = availableClients.length > 1;

  useEffect(() => {
    if (!canSwitchClients && isClientMenuOpen) {
      setIsClientMenuOpen(false);
    }
  }, [canSwitchClients, isClientMenuOpen]);

  useEffect(() => {
    if (!isClientMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !clientMenuPanelRef.current?.contains(target) &&
        !clientMenuButtonRef.current?.contains(target)
      ) {
        setIsClientMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsClientMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isClientMenuOpen]);

  const activeClient = availableClients.find((client) => client.id === activeClientId) ?? null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200 pb-16">
      <header className="relative overflow-hidden bg-slate-900 text-white shadow-2xl shadow-slate-900/30">
        <HeroBackdrop />
        <div className="relative mx-auto flex w-full flex-col gap-10 px-4 py-12 sm:px-[5vw]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-200/80">Client dashboard</p>
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight">Profit First forecast</h1>
                <p className="text-base text-slate-200/80">
                  Review allocations and metrics for {activeClient ? activeClient.name : "your selected client"}. Demo workspaces
                  are available so every user can explore the experience without risking production data.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200/80">
              <div className="relative">
                {canSwitchClients ? (
                  <button
                    ref={clientMenuButtonRef}
                    type="button"
                    onClick={() => setIsClientMenuOpen((previous) => !previous)}
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-100 transition hover:border-white/40 hover:text-white"
                    aria-haspopup="listbox"
                    aria-expanded={isClientMenuOpen}
                    aria-controls="client-selector-menu"
                  >
                    <span>Active client · {activeClient ? activeClient.name : "None available"}</span>
                    <span aria-hidden className={`transition ${isClientMenuOpen ? "rotate-180" : ""}`}>
                      <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-200">
                    <span>Active client · {activeClient ? activeClient.name : "None available"}</span>
                  </div>
                )}
                {canSwitchClients && isClientMenuOpen ? (
                  <div
                    ref={clientMenuPanelRef}
                    id="client-selector-menu"
                    role="listbox"
                    aria-label="Select active client"
                    className="absolute right-0 z-20 mt-3 w-72 rounded-2xl border border-white/10 bg-white/95 p-2 text-left text-slate-800 shadow-xl shadow-slate-900/40 backdrop-blur"
                  >
                    {isLoadingClients ? (
                      <div className="px-3 py-4 text-sm text-slate-500">Loading clients…</div>
                    ) : (
                      <>
                        {assignedClients.length > 0 ? (
                          <div>
                            <p className="px-2 pb-1 text-[0.6rem] font-semibold uppercase tracking-wide text-slate-500">Your clients</p>
                            <ul className="space-y-1">
                              {assignedClients.map((client) => {
                                const isSelected = client.id === activeClient?.id;
                                const roleLabel = client.accessLevel
                                  ? roleTitleMap.get(client.accessLevel) ?? client.accessLevel
                                  : null;

                                return (
                                  <li key={client.id}>
                                    <button
                                      type="button"
                                      role="option"
                                      aria-selected={isSelected}
                                      onClick={() => {
                                        setActiveClientId(client.id);
                                        setIsClientMenuOpen(false);
                                      }}
                                      className={`w-full rounded-xl px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                                        isSelected
                                          ? "bg-slate-900/5 text-slate-900"
                                          : "text-slate-700 hover:bg-slate-900/5 hover:text-slate-900"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold">{client.name}</span>
                                        {roleLabel ? (
                                          <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-slate-600">
                                            {roleLabel}
                                          </span>
                                        ) : null}
                                      </div>
                                      <p className="text-xs text-slate-500">Active since {client.activeSince}</p>
                                      {client.description ? (
                                        <p className="mt-1 text-[0.65rem] text-slate-500">{client.description}</p>
                                      ) : null}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}
                        {demoClients.length > 0 ? (
                          <div
                            className={`${
                              assignedClients.length > 0 ? "mt-2 border-t border-slate-200/60 pt-2" : ""
                            }`}
                          >
                            <p className="px-2 pb-1 text-[0.6rem] font-semibold uppercase tracking-wide text-slate-500">Demo workspaces</p>
                            <ul className="space-y-1">
                              {demoClients.map((client) => {
                                const isSelected = client.id === activeClient?.id;
                                const roleLabel = client.accessLevel
                                  ? roleTitleMap.get(client.accessLevel) ?? client.accessLevel
                                  : null;

                                return (
                                  <li key={client.id}>
                                    <button
                                      type="button"
                                      role="option"
                                      aria-selected={isSelected}
                                      onClick={() => {
                                        setActiveClientId(client.id);
                                        setIsClientMenuOpen(false);
                                      }}
                                      className={`w-full rounded-xl px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                                        isSelected
                                          ? "bg-sky-100 text-slate-900"
                                          : "text-slate-700 hover:bg-sky-100/70 hover:text-slate-900"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold">{client.name}</span>
                                        <div className="flex items-center gap-1">
                                          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-sky-600">
                                            Demo
                                          </span>
                                          {roleLabel ? (
                                            <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-slate-600">
                                              {roleLabel}
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                      <p className="text-xs text-slate-500">Active since {client.activeSince}</p>
                                      {client.description ? (
                                        <p className="mt-1 text-[0.65rem] text-slate-500">{client.description}</p>
                                      ) : null}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}
                        {assignedClients.length === 0 && demoClients.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-slate-500">No clients available yet.</div>
                        ) : null}
                      </>
                    )}
                    {clientFetchError ? (
                      <p className="px-3 pt-3 text-[0.65rem] font-medium text-amber-600">{clientFetchError}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {activeClient ? (
                <span className="rounded-full border border-white/20 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-200/80">
                  Active since {activeClient.activeSince}
                </span>
              ) : (
                <span className="rounded-full border border-white/20 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-200/80">
                  No active clients available
                </span>
              )}
              <button
                type="button"
                className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[0.7rem] font-semibold text-white/80 transition hover:bg-white/20"
              >
                Manage client access
              </button>
              {clientFetchError ? (
                <p className="text-xs font-medium text-amber-200/90">{clientFetchError}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
            <label className="flex flex-col gap-2 text-sm font-medium lg:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">Starting month</span>
              <input
                type="month"
                value={startMonth}
                onChange={(event) => setStartMonth(event.target.value)}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white shadow-inner shadow-white/10 transition focus:border-sky-300 focus:outline-none"
              />
            </label>
            <div className="flex flex-col gap-2 text-sm font-medium lg:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">Cadence</span>
              <div className="relative flex h-12 items-center rounded-full bg-white/10 p-1 shadow-inner shadow-slate-900/40">
                {["Monthly", "Weekly"].map((option) => {
                  const isActive = cadence === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCadence(option as Cadence)}
                      className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                        isActive ? "bg-white text-slate-900 shadow-lg shadow-slate-900/20" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm font-medium lg:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">View</span>
              <div className="relative flex h-12 items-center rounded-full bg-white/10 p-1 shadow-inner shadow-slate-900/40">
                {["Total", "Accounts"].map((option) => {
                  const isActive = trendView === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTrendView(option as TrendView)}
                      className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                        isActive ? "bg-white text-slate-900 shadow-lg shadow-slate-900/20" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium lg:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-200/80">Horizon</span>
              <select
                value={selectedView}
                onChange={(event) => setSelectedView(event.target.value as ViewOption)}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-white shadow-inner shadow-white/10 transition focus:border-sky-300 focus:outline-none"
              >
                {VIEW_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-slate-900 text-white">
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedView === "Custom" && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200/80">
                <span>Start date</span>
                <input
                  type="date"
                  value={customRange.start}
                  onChange={(event) => setCustomRange((prev) => ({ ...prev, start: event.target.value }))}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white shadow-inner shadow-white/10 transition focus:border-sky-300 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-200/80">
                <span>End date</span>
                <input
                  type="date"
                  value={customRange.end}
                  onChange={(event) => setCustomRange((prev) => ({ ...prev, end: event.target.value }))}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white shadow-inner shadow-white/10 transition focus:border-sky-300 focus:outline-none"
                />
              </label>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full flex-col gap-12 px-4 py-12 sm:px-[5vw]">
        <section className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
          <aside className="lg:col-span-4 xl:col-span-3">
            <article className="flex h-full flex-col justify-between gap-8 rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/15 backdrop-blur">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cash snapshot</p>
                <h2 className="text-2xl font-semibold text-slate-900">Summary</h2>
              </div>
              <dl className="flex flex-col divide-y divide-slate-200/80 border-y border-slate-200/80">
                {SUMMARY_METRICS.map((metric) => (
                  <div key={metric.title} className="flex items-center justify-between gap-4 py-4">
                    <dt className="text-sm font-medium text-slate-500">{metric.title}</dt>
                    <dd className="text-2xl font-semibold text-slate-900">{metric.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming milestones</p>
                <ul className="space-y-2">
                  {UPCOMING_MILESTONES.map((milestone) => (
                    <li
                      key={milestone.label}
                      className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-inner shadow-white"
                    >
                      <span className="text-slate-500">{milestone.label}</span>
                      <span className="text-base font-semibold text-slate-900">{milestone.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9">
            <div className="flex h-full flex-col rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl shadow-slate-900/15 backdrop-blur">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trend overview</p>
                  <h2 className="text-2xl font-semibold text-slate-900">Projected cash balance</h2>
                  <p className="text-sm text-slate-500">
                    Placeholder visualization for the Profit First forecast. Toggle cadence and view modes to preview alternate layouts.
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center shadow-inner shadow-white">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cadence</dt>
                    <dd className="mt-1 font-medium text-slate-700">{cadence}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center shadow-inner shadow-white">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">View</dt>
                    <dd className="mt-1 font-medium text-slate-700">{trendView}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center shadow-inner shadow-white">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Starting month</dt>
                    <dd className="mt-1 font-medium text-slate-700">{startMonth || "—"}</dd>
                  </div>
                </dl>
              </div>
              <div className="mt-8 flex flex-1 flex-col space-y-6">
                <div className="grow overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50">
                  <TrendChart series={trendSeries} />
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  {trendSeries.map((seriesItem) => (
                    <span
                      key={seriesItem.name}
                      className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1.5 shadow-sm"
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seriesItem.color }} />
                      {seriesItem.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-10">
          <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">Ending balances ({cadence.toLowerCase()})</h2>
                <p className="text-sm text-slate-500">
                  Placeholder balances for each Profit First account. Values stay empty until data wiring.
                </p>
              </div>
              <span className="rounded-full border border-slate-200/80 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Summary + table preview
              </span>
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/10">
              <DataTable headers={balanceHeaders} rows={balanceRows} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">Net activity ({cadence.toLowerCase()})</h2>
                <p className="text-sm text-slate-500">Offsets inflows and outflows per account to mirror the legacy net activity view.</p>
              </div>
              <span className="rounded-full border border-slate-200/80 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Summary + table preview
              </span>
            </div>
            <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-900/10">
              <DataTable headers={activityHeaders} rows={activityRows} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
