"use client";

import { useMemo, useState } from "react";

type TrendPoint = {
  label: string;
  value: number;
};

type Cadence = "Monthly" | "Weekly";

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
  value: 50 + index * 10 - (index % 3 === 0 ? 15 : 0)
}));

const MONTH_HEADERS = MONTH_LABELS.slice(-12);

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

const SUMMARY_TILES = [
  {
    title: "Current balance",
    value: "$0.00",
    description: "Ending balance across all accounts for the selected period."
  },
  {
    title: "Total inflow",
    value: "$0.00",
    description: "Deposits and transfers received during the chosen timeframe."
  },
  {
    title: "Total outflow",
    value: "$0.00",
    description: "Withdrawals and allocations distributed during the chosen timeframe."
  },
  {
    title: "Net activity",
    value: "$0.00",
    description: "Difference between inflow and outflow across the horizon."
  }
] as const;

function SummaryTile({
  title,
  value,
  description
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  const width = 720;
  const height = 260;
  const paddingX = 32;
  const paddingY = 36;

  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const coordinates = points.map((point, index) => {
    const x = paddingX + (index / Math.max(points.length - 1, 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((point.value - minValue) / range) * (height - paddingY * 2);
    return { x, y };
  });

  const linePath = coordinates
    .map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(2)},${coord.y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L${coordinates[coordinates.length - 1]?.x.toFixed(2) ?? 0},${height - paddingY} L${coordinates[0]?.x.toFixed(
    2
  ) ?? 0},${height - paddingY} Z`;

  const ySteps = 4;
  const yAxis = Array.from({ length: ySteps + 1 }, (_, index) => {
    const value = minValue + (range / ySteps) * index;
    const position = height - paddingY - ((value - minValue) / range) * (height - paddingY * 2);
    return { value, position };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full text-sky-500">
      <defs>
        <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} rx={24} fill="#ffffff" />
      <path d={areaPath} fill="url(#trend-fill)" stroke="none" />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      {coordinates.map((coord, index) => (
        <circle key={points[index].label} cx={coord.x} cy={coord.y} r={4.5} className="fill-white" stroke="currentColor" strokeWidth={2} />
      ))}
      {yAxis.map((tick) => (
        <g key={tick.value}>
          <line x1={paddingX} x2={width - paddingX} y1={tick.position} y2={tick.position} stroke="#e2e8f0" strokeDasharray="4 6" />
          <text x={paddingX - 10} y={tick.position + 4} textAnchor="end" className="fill-slate-400 text-xs">
            {Math.round(tick.value)}
          </text>
        </g>
      ))}
      {coordinates.map((coord, index) => (
        <text key={`label-${points[index].label}`} x={coord.x} y={height - paddingY + 24} textAnchor="middle" className="fill-slate-400 text-xs">
          {points[index].label}
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
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
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
  const [customRange, setCustomRange] = useState({ start: "2023-01-01", end: "2023-06-30" });
  const [balanceCadence, setBalanceCadence] = useState<Cadence>("Monthly");
  const [activityCadence, setActivityCadence] = useState<Cadence>("Monthly");

  const trendPoints = useMemo(() => {
    if (selectedView === "Custom") {
      return TREND_POINTS;
    }

    const months = parseInt(selectedView, 10);
    return TREND_POINTS.slice(-months);
  }, [selectedView]);

  const balanceHeaders = balanceCadence === "Monthly" ? MONTH_HEADERS : WEEK_HEADERS;
  const balanceRows: TableRow[] = ENDING_BALANCE_ROWS.map((row) => ({
    label: row.label,
    sublabel: row.sublabel,
    values: balanceCadence === "Monthly" ? row.monthly : row.weekly
  }));

  const activityHeaders = activityCadence === "Monthly" ? MONTH_HEADERS : WEEK_HEADERS;
  const activityRows: TableRow[] = NET_ACTIVITY_ROWS.map((row) => ({
    label: row.label,
    sublabel: row.sublabel,
    values: activityCadence === "Monthly" ? row.monthly : row.weekly
  }));

  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Client dashboard</p>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Profit First forecast</h1>
              <p className="text-sm text-slate-500">
                Mirrors the legacy dashboard layout with summary cards, trend chart, and tables for ending balances and net activity.
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="text-right">
                <p className="text-xs uppercase text-slate-400">Active client</p>
                <p className="font-medium">Client name</p>
              </div>
              <div className="rounded-full border border-slate-300 px-4 py-2 text-xs uppercase tracking-wide text-slate-500">
                Active since Jan 2023
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SUMMARY_TILES.map((tile) => (
            <SummaryTile key={tile.title} title={tile.title} value={tile.value} description={tile.description} />
          ))}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trend overview</p>
              <h2 className="text-2xl font-semibold text-slate-900">Projected cash balance</h2>
              <p className="text-sm text-slate-500">
                Select a time horizon to preview the trend line. Custom lets you specify an exact start and end date.
              </p>
            </div>
            <div className="flex flex-col gap-4 text-sm text-slate-600">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">View</span>
                <select
                  value={selectedView}
                  onChange={(event) => setSelectedView(event.target.value as ViewOption)}
                  className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                >
                  {VIEW_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {selectedView === "Custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-2 text-xs">
                    <span className="font-semibold uppercase tracking-wide text-slate-500">Start date</span>
                    <input
                      type="date"
                      value={customRange.start}
                      onChange={(event) => setCustomRange((prev) => ({ ...prev, start: event.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs">
                    <span className="font-semibold uppercase tracking-wide text-slate-500">End date</span>
                    <input
                      type="date"
                      value={customRange.end}
                      onChange={(event) => setCustomRange((prev) => ({ ...prev, end: event.target.value }))}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
            <TrendChart points={trendPoints} />
          </div>
        </section>

        <section className="space-y-10">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Ending balances ({balanceCadence.toLowerCase()})</h2>
                <p className="text-sm text-slate-500">Placeholder columns for balances grouped by cadence. Values will be populated later.</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setBalanceCadence("Monthly")}
                  className={`rounded-full px-4 py-2 ${balanceCadence === "Monthly" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600"}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceCadence("Weekly")}
                  className={`rounded-full px-4 py-2 ${balanceCadence === "Weekly" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600"}`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <DataTable headers={balanceHeaders} rows={balanceRows} />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Net activity ({activityCadence.toLowerCase()})</h2>
                <p className="text-sm text-slate-500">Mirror of the legacy table showing net inflow and outflow per account.</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setActivityCadence("Monthly")}
                  className={`rounded-full px-4 py-2 ${activityCadence === "Monthly" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600"}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setActivityCadence("Weekly")}
                  className={`rounded-full px-4 py-2 ${activityCadence === "Weekly" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600"}`}
                >
                  Weekly
                </button>
              </div>
            </div>
            <DataTable headers={activityHeaders} rows={activityRows} />
          </div>
        </section>
      </div>
    </main>
  );
}
