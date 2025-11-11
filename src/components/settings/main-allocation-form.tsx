"use client";

import { useEffect, useMemo, useState } from "react";

import {
  fetchProfitFirstAccounts,
  saveProfitFirstAccounts,
  type ProfitFirstAccountUpsertInput,
} from "@/lib/profit-first/accounts";
import { MAX_CUSTOM_MAIN_ACCOUNTS } from "@/lib/accounts/custom";
import type { AccountType } from "@/types/accounts";

const MAIN_ACCOUNT_DISPLAY_ORDER: AccountType[] = [
  "profit",
  "owners_pay",
  "tax",
  "operating_expenses",
];

function formatPercent(value: number): string {
  return Number.isFinite(value) ? value.toString() : "0";
}

function parsePercent(value: string): number {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(parsed, 9999);
}

type MainAccountState = {
  id: string | null;
  name: string;
  type: AccountType;
  allocationPercent: string;
  customPosition: number | null;
  isCustom: boolean;
};

type Snapshot = {
  accounts: MainAccountState[];
  removedIds: string[];
};

type MainAllocationFormProps = {
  companyId: string;
  companyName: string;
};

function sortMainAccounts(accounts: MainAccountState[]): MainAccountState[] {
  return [...accounts].sort((a, b) => {
    const indexA = MAIN_ACCOUNT_DISPLAY_ORDER.indexOf(a.type);
    const indexB = MAIN_ACCOUNT_DISPLAY_ORDER.indexOf(b.type);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) {
      return -1;
    }

    if (indexB !== -1) {
      return 1;
    }

    const positionA = a.customPosition ?? Number.POSITIVE_INFINITY;
    const positionB = b.customPosition ?? Number.POSITIVE_INFINITY;

    if (positionA !== positionB) {
      return positionA - positionB;
    }

    return a.name.localeCompare(b.name);
  });
}

function createSnapshot(state: MainAccountState[], removedIds: string[]): Snapshot {
  return {
    accounts: sortMainAccounts(state).map((account) => ({
      ...account,
      name: account.name.trim(),
      allocationPercent: formatPercent(Number.parseFloat(account.allocationPercent ?? "0")),
    })),
    removedIds: [...removedIds].sort(),
  };
}

function snapshotsEqual(a: Snapshot | null, b: Snapshot | null): boolean {
  if (!a || !b) {
    return a === b;
  }

  if (a.removedIds.length !== b.removedIds.length) {
    return false;
  }

  for (let index = 0; index < a.removedIds.length; index += 1) {
    if (a.removedIds[index] !== b.removedIds[index]) {
      return false;
    }
  }

  if (a.accounts.length !== b.accounts.length) {
    return false;
  }

  for (let index = 0; index < a.accounts.length; index += 1) {
    const accountA = a.accounts[index];
    const accountB = b.accounts[index];

    if (
      accountA.id !== accountB.id ||
      accountA.name !== accountB.name ||
      accountA.type !== accountB.type ||
      accountA.allocationPercent !== accountB.allocationPercent ||
      accountA.customPosition !== accountB.customPosition ||
      accountA.isCustom !== accountB.isCustom
    ) {
      return false;
    }
  }

  return true;
}

export function MainAllocationForm({ companyId, companyName }: MainAllocationFormProps) {
  const [accounts, setAccounts] = useState<MainAccountState[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [initialSnapshot, setInitialSnapshot] = useState<Snapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAccounts = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const { data, error } = await fetchProfitFirstAccounts(companyId);

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Unable to load Profit First main allocations", error);
        setAccounts([]);
        setInitialSnapshot(null);
        setErrorMessage("We couldn’t load Profit First allocations. Try again shortly.");
      } else {
        const mainAccounts = data
          .filter((account) => account.group === "main" && account.isActive)
          .map<MainAccountState>((account) => ({
            id: account.id,
            name: account.name,
            type: account.type,
            allocationPercent: formatPercent(account.allocationPercent ?? 0),
            customPosition: account.customPosition,
            isCustom: account.type === "custom",
          }));

        const sorted = sortMainAccounts(mainAccounts);
        setAccounts(sorted);
        const snapshot = createSnapshot(sorted, []);
        setInitialSnapshot(snapshot);
        setRemovedIds([]);
      }

      setIsLoading(false);
    };

    void loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const totalPercent = useMemo(
    () =>
      accounts.reduce((sum, account) => {
        const value = parsePercent(account.allocationPercent);
        return sum + value;
      }, 0),
    [accounts],
  );

  const roundedDifference = useMemo(() => Number((totalPercent - 100).toFixed(2)), [totalPercent]);
  const hasBalancedTotal = Math.abs(roundedDifference) <= 0.01;

  const customAccountCount = useMemo(
    () => accounts.filter((account) => account.isCustom).length,
    [accounts],
  );

  const hasMissingCustomName = useMemo(
    () =>
      accounts.some((account) => account.isCustom && account.name.trim().length === 0),
    [accounts],
  );

  const currentSnapshot = useMemo(
    () => createSnapshot(accounts, removedIds),
    [accounts, removedIds],
  );

  const isDirty = useMemo(() => !snapshotsEqual(initialSnapshot, currentSnapshot), [initialSnapshot, currentSnapshot]);

  const disableSave = !isDirty || isLoading || isSaving || hasMissingCustomName || !hasBalancedTotal;

  const nextCustomPosition = useMemo(() => {
    const positions = accounts
      .filter((account) => account.isCustom && account.customPosition)
      .map((account) => account.customPosition ?? 0);
    return positions.length > 0 ? Math.max(...positions) + 1 : 1;
  }, [accounts]);

  const handleAccountNameChange = (index: number, value: string) => {
    setAccounts((previous) => {
      const next = [...previous];
      next[index] = { ...next[index], name: value };
      return next;
    });
  };

  const handleAccountPercentChange = (index: number, value: string) => {
    if (value === "") {
      setAccounts((previous) => {
        const next = [...previous];
        next[index] = { ...next[index], allocationPercent: "" };
        return next;
      });
      return;
    }

    const sanitized = value.replace(/[^0-9.]/g, "");
    setAccounts((previous) => {
      const next = [...previous];
      next[index] = { ...next[index], allocationPercent: sanitized };
      return next;
    });
  };

  const handleRemoveAccount = (account: MainAccountState, index: number) => {
    if (!account.isCustom) {
      return;
    }

    setAccounts((previous) => {
      const next = [...previous];
      next.splice(index, 1);
      return next;
    });

    if (account.id) {
      setRemovedIds((previous) => [...previous, account.id]);
    }
  };

  const handleAddCustomAccount = () => {
    if (customAccountCount >= MAX_CUSTOM_MAIN_ACCOUNTS) {
      setErrorMessage(
        `You can add up to ${MAX_CUSTOM_MAIN_ACCOUNTS} custom allocation accounts. Remove one before adding another.`,
      );
      return;
    }

    setAccounts((previous) =>
      sortMainAccounts([
        ...previous,
        {
          id: null,
          name: "New allocation bucket",
          type: "custom",
          allocationPercent: "0",
          customPosition: nextCustomPosition,
          isCustom: true,
        },
      ]),
    );
  };

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    resetMessages();

    if (hasMissingCustomName) {
      setErrorMessage("Name each custom allocation before saving.");
      return;
    }

    if (!hasBalancedTotal) {
      setErrorMessage("Main allocation percentages must total exactly 100% of real revenue.");
      return;
    }

    setIsSaving(true);

    const payload: ProfitFirstAccountUpsertInput[] = accounts.map((account) => ({
      id: account.id,
      type: account.type,
      group: "main",
      name: account.name.trim(),
      allocationPercent: Number(parsePercent(account.allocationPercent).toFixed(2)),
      customPosition: account.isCustom ? account.customPosition : null,
      isActive: true,
    }));

    const { error } = await saveProfitFirstAccounts(companyId, payload, removedIds);

    if (error) {
      console.error("Unable to save Profit First allocations", error);
      setErrorMessage("We couldn’t save your Profit First allocations. Try again.");
      setIsSaving(false);
      return;
    }

    const { data, error: refreshError } = await fetchProfitFirstAccounts(companyId);

    if (refreshError) {
      console.error("Unable to refresh Profit First allocations", refreshError);
      setErrorMessage("Your changes saved, but we couldn’t refresh the allocation list. Reload the page to continue.");
      setIsSaving(false);
      return;
    }

    const refreshedAccounts = data
      .filter((account) => account.group === "main" && account.isActive)
      .map<MainAccountState>((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        allocationPercent: formatPercent(account.allocationPercent ?? 0),
        customPosition: account.customPosition,
        isCustom: account.type === "custom",
      }));

    const sorted = sortMainAccounts(refreshedAccounts);
    setAccounts(sorted);
    setRemovedIds([]);
    const snapshot = createSnapshot(sorted, []);
    setInitialSnapshot(snapshot);
    setSuccessMessage("Profit First allocations updated for " + companyName + ".");
    setIsSaving(false);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-inner shadow-white">
        <header className="flex flex-col gap-1">
          <h4 className="text-lg font-semibold text-slate-900">Profit First remainder allocations</h4>
          <p className="text-sm text-slate-600">
            Split real revenue among Profit, Owner’s Pay, Tax, Operating Expenses, and any custom buckets so each
            allocation event zeroes the income account.
          </p>
        </header>

        {isLoading ? (
          <div className="mt-6 space-y-2 text-sm text-slate-500">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <table className="w-full table-fixed border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-1/2 px-3 py-2">Account</th>
                  <th className="w-1/4 px-3 py-2">Allocation % of real revenue</th>
                  <th className="w-1/4 px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account, index) => (
                  <tr key={`${account.id ?? "new"}-${index}`} className="rounded-xl bg-slate-50/70">
                    <td className="rounded-l-xl px-3 py-3 align-top">
                      {account.isCustom ? (
                        <input
                          type="text"
                          value={account.name}
                          onChange={(event) => handleAccountNameChange(index, event.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                          placeholder="Custom allocation name"
                        />
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{account.name}</p>
                          <p className="text-xs text-slate-500">
                            {account.type === "profit"
                              ? "Quarterly profit distributions to reward healthy margins."
                              : account.type === "owners_pay"
                                ? "Owner compensation for predictable personal pay."
                                : account.type === "tax"
                                  ? "Estimated tax reserves set aside each allocation."
                                  : "Operating cash for day-to-day expenses; receives the remainder."}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={account.allocationPercent}
                          onChange={(event) => handleAccountPercentChange(index, event.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
                          aria-label={`Allocation percentage for ${account.name}`}
                        />
                        <span className="text-sm text-slate-500">%</span>
                      </div>
                    </td>
                    <td className="rounded-r-xl px-3 py-3 align-top">
                      {account.isCustom ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(account, index)}
                          className="text-sm font-medium text-rose-600 hover:text-rose-700"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="text-xs uppercase tracking-wide text-slate-400">Required</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-700">Total remainder allocation</span>
                <span className="text-base font-semibold text-slate-900">{totalPercent.toFixed(2)}%</span>
              </div>
              <div>
                {hasBalancedTotal ? (
                  <p>Distribute 100% of real revenue so the income account zeros out every allocation cycle.</p>
                ) : (
                  <p className="text-rose-600">
                    Adjust allocations by {Math.abs(roundedDifference).toFixed(2)}% to hit an exact 100% target.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAddCustomAccount}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
              >
                Add custom allocation
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={disableSave}
                className={`inline-flex items-center rounded-lg px-5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                  disableSave
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
                    : "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                }`}
              >
                {isSaving ? "Saving..." : "Save remainder allocations"}
              </button>
            </div>

            {hasMissingCustomName ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Provide a label for every custom allocation bucket.
              </div>
            ) : null}
          </div>
        )}
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}
    </div>
  );
}
