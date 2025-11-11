"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useDemoAuth } from "@/components/demo-auth-provider";
import { loadActiveCompany, subscribeToActiveCompanyChanges } from "@/lib/active-company-storage";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useDemoAuth();
  const [activeCompanyName, setActiveCompanyName] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return loadActiveCompany()?.name ?? "";
  });
  const isSettingsPage = pathname?.startsWith("/settings");
  const isHomePage = pathname === "/";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateActiveCompany = () => {
      setActiveCompanyName(loadActiveCompany()?.name ?? "");
    };

    const unsubscribe = subscribeToActiveCompanyChanges(updateActiveCompany);
    updateActiveCompany();

    return unsubscribe;
  }, []);

  if (pathname === "/login") {
    return null;
  }

  const headerClassName = isHomePage
    ? "border-white/10 bg-slate-900/80 text-white"
    : "border-slate-200/70 bg-white/90 text-slate-900";

  const buttonClassName = isHomePage
    ? "bg-white/10 text-white hover:bg-white/20"
    : "bg-slate-900/5 text-slate-700 hover:bg-slate-900/10";

  const activeCompanyLabel = activeCompanyName ? activeCompanyName : "None selected";

  const handleSwitchUser = () => {
    clearUser();
    router.push("/login");
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur transition-colors duration-300 ${headerClassName}`}
      role="banner"
    >
      <div className="mx-auto flex w-full items-center justify-between px-4 py-4 sm:px-[5vw]">
        <Link
          href="/"
          className={`text-sm font-semibold uppercase tracking-[0.3em] ${
            isHomePage ? "text-sky-100" : "text-slate-700"
          }`}
        >
          Profit First Forecast
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <div
              className={`hidden text-right text-xs font-medium sm:block ${
                isHomePage ? "text-sky-100" : "text-slate-500"
              }`}
            >
              <span className="block text-[0.65rem] uppercase tracking-[0.25em] opacity-70">Demo user</span>
              <span className="text-sm font-semibold leading-tight tracking-normal">{user.displayName}</span>
            </div>
          ) : null}
          <span
            className={`inline-flex items-center rounded-full px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] ${
              isHomePage
                ? "border border-white/25 bg-white/10 text-sky-100"
                : "border border-slate-200/80 bg-white/80 text-slate-600"
            }`}
          >
            Active company · {activeCompanyLabel}
          </span>
          {user ? (
            <button
              type="button"
              onClick={handleSwitchUser}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${buttonClassName}`}
            >
              Switch user
            </button>
          ) : (
            <Link
              href="/login"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${buttonClassName}`}
            >
              Demo login
            </Link>
          )}
          <Link
            href={isSettingsPage ? "/" : "/settings"}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              buttonClassName
            } ${isSettingsPage ? "" : "shadow-sm"}`}
            prefetch
          >
            {isSettingsPage ? (
              <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden>
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                  <path
                    d="M9.5 4l-3 4 3 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : (
              <span className="inline-flex h-5 w-5 items-center justify-center" aria-hidden>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 6.5V4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M15.89 8.11 17.52 6.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M17.5 12h2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M15.89 15.89 17.52 17.52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M12 17.5v2.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M8.11 15.89 6.48 17.52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M6.5 12H4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M8.11 8.11 6.48 6.48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            )}
            {isSettingsPage ? "Dashboard" : "Settings"}
          </Link>
        </div>
      </div>
    </header>
  );
}
