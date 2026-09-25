"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/config";

export default function AuthForm() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState("signin"); // 'signin' | 'signup' | 'forgot'
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const siteUrl = SITE_URL;

  function switchMode(next) {
    setMode(next);
    setMessage(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // ── Forgot password ──────────────────────────────────────────
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/recovery`,
      });
      setMessage(
        error
          ? { type: "error", text: error.message }
          : {
              type: "success",
              text: "If an account exists for that email, a reset link is on its way. Check your inbox (and spam).",
            }
      );
      setLoading(false);
      return;
    }

    // ── Sign up ──────────────────────────────────────────────────
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: { full_name: fullName },
        },
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      } else {
        setMessage({
          type: "success",
          text: "Check your inbox to confirm your email, then sign in.",
        });
        setMode("signin");
      }
      setLoading(false);
      return;
    }

    // ── Sign in ──────────────────────────────────────────────────
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  const cta =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link";

  return (
    <div className="w-full">
      {mode === "forgot" && (
        <button
          onClick={() => switchMode("signin")}
          className="mb-4 inline-flex items-center gap-1 text-sm text-indigo-500 transition hover:text-indigo-800"
        >
          <ArrowLeft size={15} /> Back to sign in
        </button>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <Field
            icon={<User size={16} />}
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={setFullName}
            required
          />
        )}

        <Field
          icon={<Mail size={16} />}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          required
        />

        {mode !== "forgot" && (
          <Field
            icon={<Lock size={16} />}
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
            required
          />
        )}

        {mode === "signin" && (
          <div className="text-right">
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="text-sm font-medium text-saffron-500 hover:text-saffron-600"
            >
              Forgot password?
            </button>
          </div>
        )}

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
          {cta}
        </button>
      </form>

      {mode !== "forgot" && (
        <p className="mt-6 text-center text-sm text-indigo-500">
          {mode === "signin" ? "New to the studio?" : "Already enrolled?"}{" "}
          <button
            onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
            className="font-semibold text-saffron-500 hover:text-saffron-600"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      )}
    </div>
  );
}

function Field({ icon, value, onChange, ...props }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-cream-200 bg-white px-4 py-3 focus-within:border-saffron-400 focus-within:ring-2 focus-within:ring-saffron-100">
      <span className="text-indigo-300">{icon}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-indigo-800 placeholder:text-indigo-300 focus:outline-none"
      />
    </label>
  );
}
