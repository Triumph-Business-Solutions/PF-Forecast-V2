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
    </header>
  );
}
