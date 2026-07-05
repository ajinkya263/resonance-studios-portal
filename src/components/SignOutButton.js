"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({ className = "" }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className={`inline-flex items-center gap-2 text-sm text-indigo-200 transition hover:text-cream-50 ${className}`}
    >
      <LogOut size={16} />
      Sign out
    </button>
  );
}
