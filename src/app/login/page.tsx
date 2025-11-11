"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { DEMO_USERS, demoUserMap } from "@/lib/demo-users";
import { ROLE_DEFINITIONS } from "@/lib/auth/roles";
import { useDemoAuth } from "@/components/demo-auth-provider";

const backgroundImageUrl =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80";

export default function LoginPage() {
  const router = useRouter();
  const { user, selectUser, isLoading } = useDemoAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (user) {
      router.replace("/");
    }
  }, [isLoading, router, user]);

  const handleSelection = (userId: string) => {
    if (!demoUserMap.has(userId)) {
      return;
    }

    selectUser(userId);
    router.replace("/");
  };

  const roleTitleMap = new Map(ROLE_DEFINITIONS.map((role) => [role.id, role.title]));

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/60 to-slate-950/90" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/10 bg-white/5 px-8 py-10 text-center text-white">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-200/80">Specially made for Profit First teams</p>
              <h1 className="mt-4 text-3xl font-semibold text-white">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-200/80">
                Select a demo user to explore the platform experience for each role.
              </p>
            </div>
            <div className="space-y-3 px-6 py-8">
              {DEMO_USERS.map((demoUser) => {
                const roleTitle = roleTitleMap.get(demoUser.role) ?? "Demo user";

                return (
                  <button
                    key={demoUser.id}
                    type="button"
                    onClick={() => handleSelection(demoUser.id)}
                    className="group relative flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/40 px-5 py-5 text-left text-white shadow-sm transition hover:border-sky-300/40 hover:bg-slate-900/55 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <div>
                      <span className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">
                        {roleTitle}
                      </span>
                      <p className="mt-2 text-lg font-semibold text-white">{demoUser.displayName}</p>
                      <p className="mt-1 text-sm text-slate-200/80">{demoUser.description}</p>
                      <p className="mt-2 text-xs text-slate-400/80">{demoUser.email}</p>
                    </div>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition group-hover:border-sky-400/60 group-hover:text-sky-200">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        aria-hidden
                      >
                        <path
                          d="M7.5 5.5l5 4.5-5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="bg-white/5 px-8 py-6 text-center text-xs text-slate-200/70">
              Demo access does not require a password. Switch users at any time from the header menu.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
