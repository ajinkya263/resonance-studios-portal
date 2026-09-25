"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/config";

export default function AuthForm() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const siteUrl = SITE_URL;

  async function handleEmail(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

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
        // Email confirmation is off → the user is signed in immediately.
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
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        router.push("/dashboard");
        router.refresh();
        return;
      }
    }
    setLoading(false);
  }

  return (
    <div className="w-full">
      {/* Email / password */}
      <form onSubmit={handleEmail} className="space-y-4">
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
        <Field
          icon={<Lock size={16} />}
          type="password"
          placeholder="Password"
          value={password}
          onChange={setPassword}
          required
        />

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
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-indigo-500">
        {mode === "signin" ? "New to the studio?" : "Already enrolled?"}{" "}
        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
          className="font-semibold text-saffron-500 hover:text-saffron-600"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
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
