import { ROLE_DEFINITIONS } from "@/lib/auth/roles";

const contentSections = [
  {
    title: "Authentication Roadmap",
    description:
      "Email magic links powered by Supabase Auth will introduce secure firm and company onboarding. Role-aware dashboards will unlock once a user signs in.",
  },
  {
    title: "Operational Data Model",
    description:
      "Firms own workspaces and invite collaborators. Companies connect to a firm and expose cash flow forecasts, Profit First allocations, and insights to the assigned team.",
  },
  {
    title: "Collaboration Layers",
    description:
      "We will stage future features into firm management, client forecasting, and reporting hubs. Each area respects role permissions down to the company level.",
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="max-w-3xl space-y-6 text-center">
        <span className="inline-flex items-center rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold text-brand-700">
          Profit First Forecasting Platform V2
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Build confident cash flow forecasts for your business.
        </h1>
        <p className="text-lg text-slate-600">
          Kick-start development with a modern Next.js 14 foundation, Supabase integration, and scalable architecture tailored
          for Profit First methodology.
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
      <section className="mt-16 w-full max-w-5xl space-y-12">
        <div className="space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Purpose-built access for every stakeholder
          </h2>
          <p className="text-lg text-slate-600">
            Define who can see and manage your Profit First forecasts. During development we’ll introduce authentication, but
            the role model is ready so you can plan collaboration today.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {ROLE_DEFINITIONS.map((role) => (
            <article
              key={role.title}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">{role.title}</h3>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-brand-700">
                  {role.badge}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{role.summary}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {role.permissions.map((permission) => (
                  <li key={permission} className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-brand-500" aria-hidden />
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50 p-6 text-sm text-brand-800">
          <div className="space-y-4 text-left md:text-center">
            <h3 className="text-base font-semibold uppercase tracking-wider text-brand-700">Platform Foundations</h3>
            <p>
              These stakeholder roles now drive both the database schema and the upcoming authentication flow. Supabase Auth
              will issue role-aware sessions, and relational tables persist firm, company, and membership data for future
              iterations of the product.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {contentSections.map((section) => (
                <div key={section.title} className="rounded-xl border border-brand-200 bg-white p-4 text-left shadow-sm">
                  <h4 className="text-sm font-semibold text-brand-800">{section.title}</h4>
                  <p className="mt-2 text-xs text-brand-700">{section.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
