"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase-client";

interface ForecastRow {
  id: number;
  title: string | null;
  created_at: string | null;
}

export default function HomePage() {
  const [forecasts, setForecasts] = useState<ForecastRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    let supabase: SupabaseClient;
    try {
      supabase = createBrowserSupabaseClient();
    } catch (clientError) {
      if (isMounted) {
        setError(clientError instanceof Error ? clientError.message : String(clientError));
        setIsLoading(false);
      }
      return () => {
        isMounted = false;
      };
    }

    const loadForecasts = async () => {
      const { data, error: supabaseError } = await supabase
        .from("forecasts")
        .select("id, title, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!isMounted) {
        return;
      }

      if (supabaseError) {
        setError(supabaseError.message);
      } else if (data) {
        setForecasts(data);
      }

      setIsLoading(false);
    };

    void loadForecasts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="page">
      <section className="hero">
        <h1>PF Forecast v2</h1>
        <p>
          Your Next.js application is now configured to communicate with Supabase.
          Update the Supabase credentials in your environment file to begin
          reading and writing data.
        </p>
      </section>

      <section className="status">
        <h2>Recent forecasts</h2>
        {isLoading && <p>Loading the latest records…</p>}
        {!isLoading && error && (
          <p className="error">
            Unable to load forecasts from Supabase. Check your API credentials and
            confirm the <code>forecasts</code> table exists.
            <br />
            <span className="details">{error}</span>
          </p>
        )}
        {!isLoading && !error && forecasts.length === 0 && (
          <p>No forecasts found yet. Add rows to the <code>forecasts</code> table.</p>
        )}
        {!isLoading && !error && forecasts.length > 0 && (
          <ul className="list">
            {forecasts.map((forecast) => (
              <li key={forecast.id}>
                <span className="title">{forecast.title ?? "Untitled forecast"}</span>
                <span className="timestamp">
                  {forecast.created_at
                    ? new Date(forecast.created_at).toLocaleString()
                    : "Unknown time"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
