"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState("checking"); // checking | ready | invalid
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // A valid recovery link gives us a temporary session (set by /auth/callback).
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setStatus(data?.user ? "ready" : "invalid");
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords don't match." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    } else {
      setMessage({ type: "success", text: "Password updated! Taking you to your dashboard…" });
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="surface w-full max-w-md animate-fade-up p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-saffron-400 text-indigo-900">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl text-indigo-900">Set a new password</h1>
            <p className="text-sm text-indigo-500">Resonance Studios</p>
          </div>
        </div>

        {status === "checking" && (
          <div className="flex items-center gap-2 py-8 text-indigo-500">
            <Loader2 size={18} className="animate-spin" /> Verifying your reset link…
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-4">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              This reset link is invalid or has expired. Request a new one from the
              sign-in page.
            </p>
            <Link href="/login" className="btn-primary w-full">
              <ArrowLeft size={16} /> Back to sign in
            </Link>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="flex items-center gap-3 rounded-xl border border-cream-200 bg-white px-4 py-3 focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-100">
              <Lock size={16} className="text-indigo-300" />
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-indigo-800 placeholder:text-indigo-300 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-cream-200 bg-white px-4 py-3 focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-100">
              <Lock size={16} className="text-indigo-300" />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="w-full bg-transparent text-indigo-800 placeholder:text-indigo-300 focus:outline-none"
              />
            </label>

            {message && (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.type === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {message.text}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
