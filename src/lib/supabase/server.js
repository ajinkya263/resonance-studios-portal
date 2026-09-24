import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Bridges Supabase's auth cookies to Next's cookie store.
 *
 * NOTE: must be created per-request (cookies() is request-scoped).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` was called from a Server Component — safe to ignore,
            // the middleware refreshes the session cookie instead.
          }
        },
      },
    }
  );
}
