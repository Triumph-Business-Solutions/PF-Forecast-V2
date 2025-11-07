# PF-Forecast-V2

PF Forecast version 2 is built with Next.js and Supabase. This repository contains the
initial project structure, Supabase client helper, and a sample page that loads the
five most recent records from a `forecasts` table.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file based on the provided example:

   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your Supabase project URL and anon key.

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the app.

If the `forecasts` table does not exist, update the Supabase query or create the table
to match your desired schema.
