"use client";

import { useEffect, useMemo, useState } from "react";

import {
  fetchProfitFirstAccounts,
  saveProfitFirstAccounts,
  type ProfitFirstAccountUpsertInput,
} from "@/lib/profit-first/accounts";
import type { AccountType } from "@/types/accounts";

const DIRECT_COST_DISPLAY_ORDER: AccountType[] = ["materials", "payroll"];
const MAX_CUSTOM_DIRECT_COST_ACCOUNTS = 15;

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

type DirectCostAccountState = {
  id: string | null;
  name: string;
  type: AccountType;
  allocationPercent: string;
  customPosition: number | null;
  isCustom: boolean;
};

type Snapshot = {
  accounts: DirectCostAccountState[];
  removedIds: string[];
};

type DirectCostAllocationFormProps = {
  companyId: string;
  companyName: string;
};

function sortDirectCostAccounts(accounts: DirectCostAccountState[]): DirectCostAccountState[] {
  return [...accounts].sort((a, b) => {
    const indexA = DIRECT_COST_DISPLAY_ORDER.indexOf(a.type);
    const indexB = DIRECT_COST_DISPLAY_ORDER.indexOf(b.type);

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

function createSnapshot(state: DirectCostAccountState[], removedIds: string[]): Snapshot {
  return {
    accounts: sortDirectCostAccounts(state).map((account) => ({
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

export function DirectCostAllocationForm({ companyId, companyName }: DirectCostAllocationFormProps) {
  const [accounts, setAccounts] = useState<DirectCostAccountState[]>([]);
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
        console.error("Unable to load direct cost allocations", error);
        setAccounts([]);
        setInitialSnapshot(null);
        setErrorMessage("We couldn’t load direct cost allocations. Try again shortly.");
      } else {
        const directCostAccounts = data
          .filter((account) => account.group === "direct_cost" && account.isActive)
          .map<DirectCostAccountState>((account) => ({
            id: account.id,
            name: account.name,
            type: account.type,
            allocationPercent: formatPercent(account.allocationPercent ?? 0),
            customPosition: account.customPosition,
            isCustom: account.type === "custom",
          }));

        const sorted = sortDirectCostAccounts(directCostAccounts);
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

  const customAccountCount = useMemo(
    () => accounts.filter((account) => account.isCustom).length,
    [accounts],
  );

  const hasMissingCustomName = useMemo(
    () =>
      accounts.some((account) => account.isCustom && account.name.trim().length === 0),
    [accounts],
  );

  const hasInvalidTotal = totalPercent > 100.0001;
  const shouldWarnLowMargin = totalPercent > 80 && totalPercent <= 100;

  const currentSnapshot = useMemo(
    () => createSnapshot(accounts, removedIds),
    [accounts, removedIds],
  );

  const isDirty = useMemo(() => !snapshotsEqual(initialSnapshot, currentSnapshot), [initialSnapshot, currentSnapshot]);

  const disableSave = !isDirty || isLoading || isSaving || hasInvalidTotal || hasMissingCustomName;

  const nextCustomPosition = useMemo(() => {
    const positions = accounts
      .filter((account) => account.isCustom && account.customPosition)
      .map((account) => account.customPosition ?? 0);
    return positions.length > 0 ? Math.max(...positions) + 1 : 1;
  }, [accounts]);

  const handleAddCustomAccount = () => {
    if (customAccountCount >= MAX_CUSTOM_DIRECT_COST_ACCOUNTS) {
      setErrorMessage(
        `You can add up to ${MAX_CUSTOM_DIRECT_COST_ACCOUNTS} custom direct cost accounts. Remove one before adding another.`,
      );
      return;
    }

    setAccounts((previous) =>
      sortDirectCostAccounts([
        ...previous,
        {
          id: null,
          name: "New direct cost",
          type: "custom",
          allocationPercent: "0",
          customPosition: nextCustomPosition,
          isCustom: true,
        },
      ]),
    );
  };

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

  const handleRemoveAccount = (account: DirectCostAccountState, index: number) => {
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

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    resetMessages();

    if (hasInvalidTotal) {
      setErrorMessage("Direct cost allocations cannot exceed 100% of projected income.");
      return;
    }

    if (hasMissingCustomName) {
      setErrorMessage("Name each custom direct cost account before saving.");
      return;
    }

    if (shouldWarnLowMargin) {
      const confirmed = window.confirm(
        `Direct costs at ${totalPercent.toFixed(2)}% leave only ${(100 - totalPercent).toFixed(2)}% as gross margin. ` +
          "Are you sure these allocations are correct?",
      );

      if (!confirmed) {
        return;
      }
    }

    setIsSaving(true);

    const payload: ProfitFirstAccountUpsertInput[] = accounts.map((account) => ({
      id: account.id,
      type: account.type,
      group: "direct_cost",
      name: account.name.trim(),
      allocationPercent: Number(parsePercent(account.allocationPercent).toFixed(2)),
      customPosition: account.isCustom ? account.customPosition : null,
      isActive: true,
    }));

    const { error } = await saveProfitFirstAccounts(companyId, payload, removedIds);

    if (error) {
      console.error("Unable to save direct cost allocations", error);
      setErrorMessage("We couldn’t save your direct cost allocations. Try again.");
      setIsSaving(false);
      return;
    }

    const { data, error: refreshError } = await fetchProfitFirstAccounts(companyId);

    if (refreshError) {
      console.error("Unable to refresh direct cost allocations", refreshError);
      setErrorMessage("Your changes saved, but we couldn’t refresh the allocation list. Reload the page to continue.");
      setIsSaving(false);
      return;
    }

    const refreshedAccounts = data
      .filter((account) => account.group === "direct_cost" && account.isActive)
      .map<DirectCostAccountState>((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        allocationPercent: formatPercent(account.allocationPercent ?? 0),
        customPosition: account.customPosition,
        isCustom: account.type === "custom",
      }));

    const sorted = sortDirectCostAccounts(refreshedAccounts);
    setAccounts(sorted);
    setRemovedIds([]);
    const snapshot = createSnapshot(sorted, []);
    setInitialSnapshot(snapshot);
    setSuccessMessage("Direct cost allocations updated for " + companyName + ".");
    setIsSaving(false);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-inner shadow-white">
        <header className="flex flex-col gap-1">
          <h4 className="text-lg font-semibold text-slate-900">Direct cost allocation targets</h4>
          <p className="text-sm text-slate-600">
            Define how projected income should fund materials, payroll, and other direct costs before Profit First
            allocations.
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
                  <th className="w-1/4 px-3 py-2">Allocation % of income</th>
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
                          placeholder="Custom direct cost name"
                        />
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{account.name}</p>
                          <p className="text-xs text-slate-500">
                            {account.type === "materials"
                              ? "Supplies, inventory, or subcontracted production costs."
                              : "Wages tied to delivering services or producing goods."}
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
                        <span className="text-xs uppercase tracking-wide text-slate-400">Default</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-700">Total direct cost allocation</span>
                <span className="text-base font-semibold text-slate-900">{totalPercent.toFixed(2)}%</span>
              </div>
              <div>
                {hasInvalidTotal ? (
                  <p className="text-rose-600">Reduce allocations so they do not exceed 100%.</p>
                ) : shouldWarnLowMargin ? (
                  <p className="text-amber-600">
                    Allocations above 80% indicate a slim margin. Confirm your inputs before saving.
                  </p>
                ) : (
                  <p>
                    Allocate up to 100% of projected income across direct cost accounts before Profit First distributions
                    run.
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
                Add custom direct cost
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
                {isSaving ? "Saving..." : "Save direct cost allocations"}
              </button>
            </div>

            {hasMissingCustomName ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Provide a label for every custom direct cost account.
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
