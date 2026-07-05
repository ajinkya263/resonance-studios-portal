import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Root: bounce to the right place based on auth state. */
export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
