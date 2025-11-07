# Profit First Forecasting Platform V2

A modernized foundation for building the next iteration of our Profit First forecasting platform.
This repository is bootstrapped with Next.js 14, TypeScript, Tailwind CSS, and Supabase to deliver a
scalable experience for financial planning teams.

## Prerequisites

- Node.js ^18.18.0 or >=20.0.0 (use [nvm](https://github.com/nvm-sh/nvm) for easy version
  management)
- npm (bundled with Node.js)
- Supabase CLI for managing database migrations and local development:

  ```bash
  npm install -g supabase
  ```

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables by copying `.env.example` and updating the values as needed:

   ```bash
   cp .env.example .env.local
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.

## Available Scripts

- `npm run dev` – Runs the Next.js development server with hot reloading.
- `npm run build` – Creates an optimized production build.
- `npm run start` – Starts the production server after building the app.
- `npm run lint` – Executes ESLint with Next.js' recommended configuration.

## Project Structure

```
.
├── package.json
├── public/              # Static assets served at the root of the application
├── src/
│   ├── app/             # App Router entrypoints, layouts, and routes
│   │   ├── layout.tsx   # Root layout with metadata, fonts, and global styles
│   │   └── page.tsx     # Initial landing page scaffolding
│   ├── components/      # Shared UI components (placeholder directory)
│   ├── lib/
│   │   ├── supabase.ts  # Supabase client instantiation for shared use
│   │   └── .gitkeep
│   └── types/           # Global TypeScript types and interfaces
└── tailwind.config.ts
```

## Technology Stack

- [Next.js 14](https://nextjs.org/) with the App Router
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) for authentication, database, and migrations
- ESLint & Prettier for linting and formatting consistency

## Environment Variables

Configure the following variables inside `.env.local` (see `.env.example` for reference):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ngfpdlorejzehyiayihj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZnBkbG9yZWp6ZWh5aWF5aWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTA2MjMsImV4cCI6MjA3Nzg2NjYyM30.n06PdL-qpgwKorQnVMyp0PWsbH_WnTQ3HdmejYOHyYc
```

> **Security Reminder:** Keep service role keys and other privileged credentials out of the repository
> and `.env.example`. Never expose them to the client-side bundle.

## Supabase Integration

The Supabase client is configured in `src/lib/supabase.ts` using the public URL and anon key. Import
it anywhere in the application to run queries or interact with Supabase services:

```ts
import { supabase } from "@/lib/supabase";

const { data, error } = await supabase.from("accounts").select();
```

When running on the server, Next.js will automatically inject the environment variables defined in
`.env.local`.

## Database Migrations

Use the Supabase CLI to manage migrations against the linked project.

```bash
# Authenticate with Supabase
supabase login

# Link the local project directory to the hosted Supabase project
supabase link --project-ref ngfpdlorejzehyiayihj

# Create a new migration
supabase migration new add_initial_tables

# Apply migrations
supabase migration up
```

Refer to the [Supabase migration documentation](https://supabase.com/docs/guides/cli/local-development)
for advanced workflows and options.

## Contributing

1. Fork the repository and create a feature branch.
2. Commit your changes following conventional best practices.
3. Open a pull request with a clear summary, testing notes, and screenshots where applicable.

---

Need help? Review the [Next.js documentation](https://nextjs.org/docs) and the
[Supabase guides](https://supabase.com/docs) to continue building out the platform.
