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
        {!isSettingsPage && (
          <Link
            href="/settings"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              buttonClassName
            }`}
            prefetch
          >
            <span className="inline-flex h-4 w-4 items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11.13 2.25c-.3-.5-.95-.67-1.45-.36-.16.1-.29.23-.37.4l-.8 1.6a7.05 7.05 0 00-1.76.72l-1.72-.86a1.04 1.04 0 00-1.4.47c-.08.17-.13.36-.13.55l.05 1.92a7.07 7.07 0 00-1.04 1.8l-1.87.33c-.57.1-.95.65-.86 1.22.03.18.1.35.2.5l1.06 1.6a7.03 7.03 0 000 2.07l-1.06 1.6a1.05 1.05 0 00.27 1.45c.16.1.33.17.52.2l1.87.34c.24.64.59 1.24 1.04 1.78l-.05 1.93c-.01.59.46 1.08 1.05 1.09.19 0 .38-.05.55-.14l1.72-.85c.57.34 1.15.61 1.76.8l.8 1.6c.27.54.92.75 1.46.48.17-.09.32-.23.42-.4l.8-1.6c.62-.18 1.2-.46 1.75-.8l1.72.85c.53.27 1.18.06 1.45-.47.09-.17.14-.36.13-.55l-.05-1.93a7.06 7.06 0 001.04-1.78l1.87-.34c.58-.1.97-.65.87-1.23a1.06 1.06 0 00-.21-.52l-1.06-1.6c.1-.68.1-1.38 0-2.07l1.06-1.6c.32-.49.18-1.15-.31-1.47-.15-.1-.32-.16-.5-.2l-1.87-.33a7.05 7.05 0 00-1.04-1.8l.05-1.92c.02-.59-.46-1.08-1.05-1.1-.19 0-.38.05-.55.14l-1.72.86a7.05 7.05 0 00-1.76-.72l-.8-1.6zM10 7.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"
                  fill="currentColor"
                />
              </svg>
            </span>
            Settings
          </Link>
        )}
      </div>
    </header>
  );
}
