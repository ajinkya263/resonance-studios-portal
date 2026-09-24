/**
 * Public app configuration.
 *
 * These are NEXT_PUBLIC_* values — public by design (they ship in the browser
 * bundle; the Supabase anon key is safe to expose, your data is protected by
 * Row Level Security). We read the env var if present, but fall back to a
 * literal so the build NEVER depends on env-var delivery (Vercel dashboard,
 * .env files, etc.). `"" || fallback` also covers the case where a platform
 * injects an empty value.
 *
 * To point at a different Supabase project or domain, either set the matching
 * NEXT_PUBLIC_* env var, or edit the fallback literal here.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tytsqowlalzbntuvosqu.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dHNxb3dsYWx6Ym50dXZvc3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDA5MjIsImV4cCI6MjEwNTc3NjkyMn0.QBcW4on20qYoetbX8bc3wfoEhfi6zacL1M-RuSDPtg4";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ajinkyaranademusic.com";
