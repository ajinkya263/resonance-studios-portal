import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Password-recovery landing (server-side).
 * Supabase redirects the reset email here with `?code=…`. We exchange it for a
 * (temporary) session server-side — the same reliable path as /auth/callback —
 * then send the user to the /auth/reset form. Exchanging on the server avoids
 * the browser client's auto-detect consuming the single-use code first.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description");

  if (code && !errorDescription) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/reset`);
    }
  }

  // Link was invalid, expired, or already used.
  return NextResponse.redirect(`${origin}/auth/reset?error=expired`);
}
