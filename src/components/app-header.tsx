"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  const isSettingsPage = pathname?.startsWith("/settings");
  const isHomePage = pathname === "/";

  const headerClassName = isHomePage
    ? "border-white/10 bg-slate-900/80 text-white"
    : "border-slate-200/70 bg-white/90 text-slate-900";

  const buttonClassName = isHomePage
    ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50";

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
        <Link
          href={isSettingsPage ? "/" : "/settings"}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
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
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2c.34 0 .65.17.84.46l1.08 1.62c.59.1 1.16.27 1.7.5l1.9-1.04a1 1 0 011.32.36l1.68 2.9a1 1 0 01-.25 1.3l-1.62 1.24c.08.37.13.74.13 1.13 0 .39-.05.76-.13 1.13l1.62 1.24a1 1 0 01.25 1.3l-1.68 2.9a1 1 0 01-1.32.36l-1.9-1.04c-.54.23-1.11.4-1.7.5l-1.08 1.62a1 1 0 01-1.68 0l-1.08-1.62a7.98 7.98 0 01-1.7-.5l-1.9 1.04a1 1 0 01-1.32-.36l-1.68-2.9a1 1 0 01.25-1.3l1.62-1.24A6.54 6.54 0 014 12c0-.39.05-.76.13-1.13L2.51 9.62a1 1 0 01-.25-1.3l1.68-2.9a1 1 0 011.32-.36l1.9 1.04c.54-.23 1.11-.4 1.7-.5L11.16 2.46A1 1 0 0112 2zm0 6a4 4 0 100 8 4 4 0 000-8z"
                  fill="currentColor"
                />
              </svg>
            </span>
          )}
          {isSettingsPage ? "Dashboard" : "Settings"}
        </Link>
      </div>
    </header>
  );
}
