export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="max-w-3xl space-y-6 text-center">
        <span className="inline-flex items-center rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold text-brand-700">
          Profit First Forecasting Platform V2
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Build confident cash flow forecasts for your business.
        </h1>
        <p className="text-lg text-slate-600">
          Kick-start development with a modern Next.js 14 foundation, Supabase integration, and
          scalable architecture tailored for Profit First methodology.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-3 text-base font-semibold text-white shadow-card transition hover:bg-brand-700"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noreferrer"
          >
            Next.js Documentation
          </a>
          <a
            className="inline-flex items-center justify-center rounded-lg border border-brand-200 px-5 py-3 text-base font-semibold text-brand-700 transition hover:border-brand-300 hover:text-brand-800"
            href="https://supabase.com/docs"
            target="_blank"
            rel="noreferrer"
          >
            Supabase Docs
          </a>
        </div>
      </div>
    </main>
  );
}
