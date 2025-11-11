"use client";

import { useEffect, useMemo, useState } from "react";

import {
  fetchAllocationCadenceSettings,
  upsertAllocationCadenceSettings,
} from "@/lib/allocation-cadence/queries";
import type {
  AllocationCadenceSettings,
  AllocationCadenceType,
  AllocationCadenceUpdateInput,
} from "@/types/allocation-cadence";

const WEEKDAY_OPTIONS: { label: string; value: number }[] = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1);

type AllocationCadenceFormProps = {
  companyId: string;
  companyName: string;
};

type FormState = {
  cadence: AllocationCadenceType;
  weeklyDayOfWeek: number | null;
  twiceMonthlyFirstDay: number | null;
  twiceMonthlySecondDay: number | null;
  monthlyDay: number | null;
  nextAllocationDate: string;
};

function createDefaultState(): FormState {
  const today = new Date().toISOString().slice(0, 10);
  return {
    cadence: "monthly",
    weeklyDayOfWeek: 3,
    twiceMonthlyFirstDay: 10,
    twiceMonthlySecondDay: 25,
    monthlyDay: 15,
    nextAllocationDate: today,
  };
}

function mapSettingsToState(settings: AllocationCadenceSettings | null): FormState {
  if (!settings) {
    return createDefaultState();
  }

  return {
    cadence: settings.cadence,
    weeklyDayOfWeek: settings.weeklyDayOfWeek,
    twiceMonthlyFirstDay: settings.twiceMonthlyFirstDay,
    twiceMonthlySecondDay: settings.twiceMonthlySecondDay,
    monthlyDay: settings.monthlyDay,
    nextAllocationDate: settings.nextAllocationDate,
  };
}

function getSummaryCopy(state: FormState): string {
  switch (state.cadence) {
    case "weekly": {
      const weekdayLabel = WEEKDAY_OPTIONS.find((option) => option.value === state.weeklyDayOfWeek)?.label ?? "—";
      return `Weekly on ${weekdayLabel}`;
    }
    case "twice_monthly": {
      const first = state.twiceMonthlyFirstDay;
      const second = state.twiceMonthlySecondDay;
      if (!first || !second) {
        return "Twice per month";
      }
      return `Twice per month on the ${first}${getOrdinal(first)} and ${second}${getOrdinal(second)}`;
    }
    case "monthly": {
      const day = state.monthlyDay;
      if (!day) {
        return "Monthly";
      }
      return `Monthly on the ${day}${getOrdinal(day)}`;
    }
    default:
      return "Custom cadence";
  }
}

function getOrdinal(day: number): string {
  const remainder = day % 10;
  const suffix =
    remainder === 1 && day % 100 !== 11
      ? "st"
      : remainder === 2 && day % 100 !== 12
        ? "nd"
        : remainder === 3 && day % 100 !== 13
          ? "rd"
          : "th";
  return suffix;
}

function sanitizeInput(state: FormState): AllocationCadenceUpdateInput {
  if (state.cadence === "weekly") {
    return {
      cadence: state.cadence,
      weeklyDayOfWeek: state.weeklyDayOfWeek,
      twiceMonthlyFirstDay: null,
      twiceMonthlySecondDay: null,
      monthlyDay: null,
      nextAllocationDate: state.nextAllocationDate,
    };
  }

  if (state.cadence === "twice_monthly") {
    return {
      cadence: state.cadence,
      weeklyDayOfWeek: null,
      twiceMonthlyFirstDay: state.twiceMonthlyFirstDay,
      twiceMonthlySecondDay: state.twiceMonthlySecondDay,
      monthlyDay: null,
      nextAllocationDate: state.nextAllocationDate,
    };
  }

  return {
    cadence: state.cadence,
    weeklyDayOfWeek: null,
    twiceMonthlyFirstDay: null,
    twiceMonthlySecondDay: null,
    monthlyDay: state.monthlyDay,
    nextAllocationDate: state.nextAllocationDate,
  };
}

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

export function AllocationCadenceForm({ companyId, companyName }: AllocationCadenceFormProps) {
  const [initialState, setInitialState] = useState<FormState | null>(null);
  const [state, setState] = useState<FormState>(createDefaultState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const { data, error } = await fetchAllocationCadenceSettings(companyId);

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Unable to load allocation cadence settings", error);
        setErrorMessage("We couldn’t load the current cadence. Try again in a moment.");
        setState(createDefaultState());
        setInitialState(null);
      } else {
        const nextState = mapSettingsToState(data);
        setState(nextState);
        setInitialState(nextState);
      }

      setIsLoading(false);
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const isDirty = useMemo(() => {
    if (!initialState) {
      return true;
    }

    return (
      initialState.cadence !== state.cadence ||
      initialState.weeklyDayOfWeek !== state.weeklyDayOfWeek ||
      initialState.twiceMonthlyFirstDay !== state.twiceMonthlyFirstDay ||
      initialState.twiceMonthlySecondDay !== state.twiceMonthlySecondDay ||
      initialState.monthlyDay !== state.monthlyDay ||
      initialState.nextAllocationDate !== state.nextAllocationDate
    );
  }, [initialState, state]);

  const summaryCopy = useMemo(() => getSummaryCopy(state), [state]);
  const nextRunLabel = useMemo(() => formatDateLabel(state.nextAllocationDate), [state.nextAllocationDate]);

  const handleCadenceChange = (value: AllocationCadenceType) => {
    setState((previous) => {
      if (value === "weekly") {
        return {
          ...previous,
          cadence: value,
          weeklyDayOfWeek: previous.weeklyDayOfWeek ?? 3,
          twiceMonthlyFirstDay: null,
          twiceMonthlySecondDay: null,
          monthlyDay: null,
        };
      }

      if (value === "twice_monthly") {
        const first = previous.twiceMonthlyFirstDay ?? 10;
        const second = previous.twiceMonthlySecondDay ?? 25;
        return {
          ...previous,
          cadence: value,
          weeklyDayOfWeek: null,
          twiceMonthlyFirstDay: Math.min(first, second),
          twiceMonthlySecondDay: Math.max(first, second),
          monthlyDay: null,
        };
      }

      return {
        ...previous,
        cadence: value,
        weeklyDayOfWeek: null,
        twiceMonthlyFirstDay: null,
        twiceMonthlySecondDay: null,
        monthlyDay: previous.monthlyDay ?? 15,
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = sanitizeInput(state);
    const { data, error } = await upsertAllocationCadenceSettings(companyId, payload);

    if (error) {
      console.error("Unable to save allocation cadence settings", error);
      setErrorMessage("We couldn’t save your cadence. Please try again.");
      setIsSaving(false);
      return;
    }

    const nextState = mapSettingsToState(data);
    setInitialState(nextState);
    setState(nextState);
    setSuccessMessage("Cadence applied to your forecast.");
    setIsSaving(false);
  };

  const disableAction = isSaving || isLoading || !isDirty;

  return (
    <section className="mt-8 space-y-8">
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-slate-900">Allocation cadence</h4>
        <p className="text-sm text-slate-600">
          Choose the schedule the forecast should follow when moving money between Profit First accounts for {companyName}.
        </p>
      </div>

      <div className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cadence</span>
            <select
              value={state.cadence}
              onChange={(event) => handleCadenceChange(event.target.value as AllocationCadenceType)}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="weekly">Weekly</option>
              <option value="twice_monthly">Twice per month</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          {state.cadence === "weekly" && (
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weekday</span>
              <select
                value={state.weeklyDayOfWeek ?? ""}
                onChange={(event) =>
                  setState((previous) => ({
                    ...previous,
                    weeklyDayOfWeek: Number.parseInt(event.target.value, 10),
                  }))
                }
                disabled={isLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                {WEEKDAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {state.cadence === "twice_monthly" && (
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">First allocation day</span>
                <select
                  value={state.twiceMonthlyFirstDay ?? ""}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    setState((previous) => ({
                      ...previous,
                      twiceMonthlyFirstDay: value,
                      twiceMonthlySecondDay:
                        previous.twiceMonthlySecondDay && value > previous.twiceMonthlySecondDay
                          ? value
                          : previous.twiceMonthlySecondDay ?? value,
                    }));
                  }}
                  disabled={isLoading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  {DAY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Second allocation day</span>
                <select
                  value={state.twiceMonthlySecondDay ?? ""}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    setState((previous) => ({
                      ...previous,
                      twiceMonthlyFirstDay:
                        previous.twiceMonthlyFirstDay && value < previous.twiceMonthlyFirstDay
                          ? value
                          : previous.twiceMonthlyFirstDay ?? value,
                      twiceMonthlySecondDay: value,
                    }));
                  }}
                  disabled={isLoading}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                >
                  {DAY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {state.cadence === "monthly" && (
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Day of the month</span>
              <select
                value={state.monthlyDay ?? ""}
                onChange={(event) =>
                  setState((previous) => ({
                    ...previous,
                    monthlyDay: Number.parseInt(event.target.value, 10),
                  }))
                }
                disabled={isLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                {DAY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next allocation date</span>
            <input
              type="date"
              value={state.nextAllocationDate}
              onChange={(event) =>
                setState((previous) => ({
                  ...previous,
                  nextAllocationDate: event.target.value,
                }))
              }
              max="9999-12-31"
              disabled={isLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            <span className="text-xs font-normal text-slate-500">
              The forecast will start automating allocations on this date. Choose a future day to delay rollout if needed.
            </span>
          </label>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            <p className="font-semibold text-slate-800">{summaryCopy}</p>
            <p className="mt-1 text-xs text-slate-500">Automations begin on {nextRunLabel}.</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={disableAction}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? "Saving..." : "Apply cadence to forecast"}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3 text-sm text-slate-500">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
        </div>
      )}
    </section>
  );
}
