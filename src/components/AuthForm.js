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
  const [emailHint, setEmailHint] = useState(null); // "did you mean ...?"
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const siteUrl = SITE_URL;

  function switchMode(next) {
    setMode(next);
    setMessage(null);
    setEmailHint(null);
  }

  function onEmailChange(v) {
    setEmail(v);
    setEmailHint(suggestEmail(v));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      setMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setLoading(true);

    // ── Forgot password ──────────────────────────────────────────
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
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
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: { full_name: fullName.trim() },
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
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
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

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        <div>
          <Field
            icon={<Mail size={16} />}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={onEmailChange}
            required
          />
          {emailHint && (
            <button
              type="button"
              onClick={() => {
                setEmail(emailHint);
                setEmailHint(null);
              }}
              className="mt-1.5 pl-1 text-left text-xs text-indigo-500"
            >
              Did you mean{" "}
              <span className="font-semibold text-saffron-600">{emailHint}</span>?
            </button>
          )}
        </div>

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

/* ── Email validation helpers ──────────────────────────────────────────────── */

// Requires local@domain.tld — no spaces, a dot, and a 2+ char TLD.
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

const COMMON_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "live.com",
  "msn.com",
];

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// Suggest a corrected email if the domain is a near-miss of a common one.
function suggestEmail(v) {
  const s = v.trim().toLowerCase();
  const at = s.lastIndexOf("@");
  if (at < 1) return null;
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (!domain || domain.length < 3 || COMMON_DOMAINS.includes(domain)) return null;

  let best = null;
  let bestDist = 99;
  for (const d of COMMON_DOMAINS) {
    const dist = levenshtein(domain, d);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best && bestDist > 0 && bestDist <= 2 ? `${local}@${best}` : null;
}
