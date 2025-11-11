import { createClient } from "@supabase/supabase-js";

const fallbackSupabaseUrl =
  "https://ngfpdlorejzehyiayihj.supabase.co" as const;
const fallbackSupabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZnBkbG9yZWp6ZWh5aWF5aWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTA2MjMsImV4cCI6MjA3Nzg2NjYyM30.n06PdL-qpgwKorQnVMyp0PWsbH_WnTQ3HdmejYOHyYc" as const;

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? fallbackSupabaseUrl;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? fallbackSupabaseAnonKey;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    "Missing Supabase environment variables. Falling back to default Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set for production deployments.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
