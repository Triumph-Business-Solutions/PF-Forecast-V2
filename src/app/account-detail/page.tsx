import Link from "next/link";
import { Fragment } from "react";

const periods = [
  { key: "nov-25", label: "Nov-25", accent: "Projected" },
  { key: "dec-25", label: "Dec-25", accent: "Projected" },
  { key: "jan-26", label: "Jan-26", accent: "Projected" },
  { key: "feb-26", label: "Feb-26", accent: "Projected" },
  { key: "mar-26", label: "Mar-26", accent: "Projected" },
  { key: "apr-26", label: "Apr-26", accent: "Projected" }
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

type TableRow = {
  label: string;
  values: number[];
  variant?: "muted" | "positive" | "negative" | "total" | "emphasis";
};

type TableSection = {
  header: string;
  rows: TableRow[];
};

const inflowSections: TableSection[] = [
  {
    header: "INFLOW",
    rows: [
      { label: "Beginning balance", values: [13200, 11800, 9600, 7800, 6400, 5100], variant: "muted" },
      { label: "Coaching revenue", values: [3150, 3250, 3200, 3200, 3200, 3200], variant: "positive" },
      { label: "Interest income", values: [48, 52, 51, 50, 49, 49], variant: "positive" },
      { label: "TOTAL INFLOW", values: [16498, 15102, 12851, 11050, 9649, 8349], variant: "total" }
    ]
  },
  {
    header: "OUTFLOW",
    rows: [
      { label: "Allocation to direct costs", values: [-2100, -2100, -2100, -2100, -2100, -2100], variant: "negative" },
      { label: "Allocation to operating", values: [-4100, -4200, -4300, -4450, -4600, -4700], variant: "negative" },
      { label: "Owner's pay", values: [-3600, -3600, -3600, -3600, -3600, -3600], variant: "negative" },
      { label: "Discounts", values: [-200, -200, -200, -200, -200, -200], variant: "negative" },
      { label: "TOTAL OUTFLOW", values: [-10000, -10100, -10200, -10350, -10500, -10600], variant: "total" }
    ]
  },
  {
    header: "NET MOVEMENT",
    rows: [
      { label: "Net new income", values: [6498, 5002, 2651, 700, -851, -2251], variant: "emphasis" }
    ]
  },
  {
    header: "ENDING BALANCE",
    rows: [
      { label: "Ending balance", values: [19700, 16802, 15451, 14800, 13949, 11700], variant: "emphasis" }
    ]
  }
];

function getCellClass(variant?: TableRow["variant"], value?: number) {
  const base = "px-6 py-4 text-right text-sm";

  switch (variant) {
    case "muted":
      return `${base} text-slate-500`;
    case "positive":
      return `${base} font-medium text-emerald-600`;
    case "negative":
      return `${base} font-medium text-rose-500`;
    case "total":
      return `${base} font-semibold ${value && value < 0 ? "text-rose-600" : "text-brand-700"}`;
    case "emphasis":
      return `${base} font-semibold ${value && value < 0 ? "text-rose-600" : "text-brand-700"}`;
    default:
      return `${base} text-slate-700`;
  }
}

function getLabelClass(variant?: TableRow["variant"]) {
  const base = "px-6 py-4 text-left text-sm font-medium";

  switch (variant) {
    case "muted":
      return `${base} text-slate-500`;
    case "positive":
      return `${base} text-slate-600`;
    case "negative":
      return `${base} text-slate-600`;
    case "total":
      return `${base} uppercase tracking-wide text-slate-700`;
    case "emphasis":
      return `${base} text-slate-900`;
    default:
      return `${base} text-slate-600`;
  }
}

function renderValue(value: number, variant?: TableRow["variant"]) {
  const formatted = currency.format(Math.abs(value));
  const prefix = value < 0 ? "-" : variant === "positive" || (variant === "emphasis" && value > 0) ? "+" : "";
  const content = (
    <>
      {prefix}
      {formatted}
    </>
  );

  if (variant === "muted") {
    return <span className="font-medium text-slate-500">{content}</span>;
  }

  return <span>{content}</span>;
}

export default function AccountDetailPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-6">
          <div className="space-y-2">
            <Link href="/" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              ← Back to dashboard
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account Detail</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">Income – Nov-25</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-medium text-slate-600">
              <button className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">Monthly</button>
              <button className="rounded-full px-3 py-1 text-slate-500 hover:text-slate-700">Weekly</button>
            </div>
            <button className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700">
              Share stored projection
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-6 py-8">
        <section className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col justify-between gap-6 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Projected balance</p>
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-3xl font-bold text-slate-900">$19,700</h2>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  +$6,498 since last month
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>Updated 2 days ago</span>
              <span className="hidden h-4 w-px bg-slate-200 md:inline" aria-hidden />
              <button className="text-brand-600 hover:text-brand-700">Clear stored projection</button>
            </div>
          </div>
          <div className="h-72 w-full overflow-hidden rounded-b-3xl bg-gradient-to-r from-brand-50 via-white to-brand-100">
            <div className="relative h-full w-full">
              <div className="absolute inset-x-0 top-10 mx-auto h-40 w-[90%] rounded-3xl bg-gradient-to-r from-brand-200/60 via-brand-200/10 to-sky-200/70 blur-3xl" />
              <div className="absolute inset-6 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>$24k</span>
                  <span>$18k</span>
                  <span>$12k</span>
                  <span>$6k</span>
                  <span>$0</span>
                </div>
                <div className="relative h-40 w-full">
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-200/70" />
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                        Line chart placeholder
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  {periods.map((period) => (
                    <span key={period.key}>{period.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Monthly inflows and outflows</p>
              <p className="text-sm text-slate-500">Planned movements across the account through Apr-26.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full bg-brand-100 px-2 py-1 text-brand-700">Projected</span>
              <span className="rounded-full border border-slate-200 px-2 py-1 text-slate-500">Actual</span>
            </div>
          </div>

          <div className="-mx-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="min-w-[220px] px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>
                  {periods.map((period) => (
                    <th key={period.key} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <div className="flex flex-col">
                        <span>{period.label}</span>
                        <span className="text-slate-400">{period.accent}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inflowSections.map((section) => (
                  <Fragment key={section.header}>
                    <tr>
                      <th
                        colSpan={periods.length + 1}
                        className="bg-slate-50 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"
                      >
                        {section.header}
                      </th>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={`${section.header}-${row.label}`} className="even:bg-white odd:bg-slate-50/40">
                        <th className={getLabelClass(row.variant)}>{row.label}</th>
                        {row.values.map((value, index) => (
                          <td key={`${section.header}-${row.label}-${periods[index].key}`} className={getCellClass(row.variant, value)}>
                            {renderValue(value, row.variant)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

