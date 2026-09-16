"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Search,
  Lock,
  Check,
  Clock,
  Sparkles,
  Loader2,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { grantOverride, revokeOverride, setUserRole } from "@/app/(app)/admin/actions";

/**
 * Admin console body.
 * Props:
 *   users       — [{ id, full_name, email, role, auth_provider, enrollment_date, daysEnrolled }]
 *   modules     — [{ id, title, unlock_delay_days, order_index }]
 *   overrideKeys — ["<userId>::<moduleId>", ...]
 */
export default function AdminUsersPanel({ users, modules, overrideKeys }) {
  const [query, setQuery] = useState("");
  const [overrides, setOverrides] = useState(() => new Set(overrideKeys));
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  function key(userId, moduleId) {
    return `${userId}::${moduleId}`;
  }

  function toggleOverride(userId, moduleId, currentlyGranted) {
    const k = key(userId, moduleId);
    setBusyKey(k);
    startTransition(async () => {
      const res = currentlyGranted
        ? await revokeOverride(userId, moduleId)
        : await grantOverride(userId, moduleId);
      if (res?.ok) {
        setOverrides((prev) => {
          const next = new Set(prev);
          currentlyGranted ? next.delete(k) : next.add(k);
          return next;
        });
      }
      setBusyKey(null);
    });
  }

  return (
    <div>
      {/* Search */}
      <label className="surface mb-6 flex items-center gap-3 px-4 py-3">
        <Search size={18} className="text-indigo-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full bg-transparent text-indigo-800 placeholder:text-indigo-300 focus:outline-none"
        />
        <span className="text-xs text-indigo-400">
          {filtered.length} account{filtered.length === 1 ? "" : "s"}
        </span>
      </label>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <p className="surface p-8 text-center text-indigo-400">
            No accounts match “{query}”.
          </p>
        )}

        {filtered.map((u) => (
          <article key={u.id} className="surface p-5">
            {/* User header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-indigo-100 font-display text-lg text-indigo-700">
                  {(u.full_name || u.email || "?").charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="font-medium text-indigo-900">
                    {u.full_name || "—"}
                  </p>
                  <p className="text-sm text-indigo-500">{u.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-indigo-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-cream-100 px-3 py-1">
                  <Clock size={13} /> {u.daysEnrolled}d enrolled
                </span>
                <RoleControl user={u} />
              </div>
            </div>

            {/* Module progression */}
            <div className="mt-4 border-t border-cream-200 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-400">
                Module access
              </p>
              <div className="flex flex-wrap gap-2">
                {modules.map((m) => {
                  const granted = overrides.has(key(u.id, m.id));
                  const unlockedByTime = u.daysEnrolled >= m.unlock_delay_days;
                  const k = key(u.id, m.id);
                  const isBusy = busyKey === k && pending;

                  // Already open by time — nothing to grant.
                  if (unlockedByTime) {
                    return (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700"
                        title={`Unlocks on day ${m.unlock_delay_days}`}
                      >
                        <Check size={13} /> {m.title}
                      </span>
                    );
                  }

                  // Locked by time → grantable / revocable.
                  return (
                    <button
                      key={m.id}
                      disabled={isBusy}
                      onClick={() => toggleOverride(u.id, m.id, granted)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                        granted
                          ? "bg-saffron-100 text-saffron-600 hover:bg-saffron-200"
                          : "bg-cream-100 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700"
                      }`}
                      title={
                        granted
                          ? "Early access granted — click to revoke"
                          : `Locked until day ${m.unlock_delay_days} — click to grant early`
                      }
                    >
                      {isBusy ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : granted ? (
                        <Sparkles size={13} />
                      ) : (
                        <Lock size={13} />
                      )}
                      {m.title}
                      <span className="ml-0.5 text-[10px] opacity-70">
                        {granted ? "granted" : `${m.unlock_delay_days}d`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/** Small student/admin role toggle. */
function RoleControl({ user }) {
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState(user.role);

  function flip() {
    const next = role === "admin" ? "student" : "admin";
    startTransition(async () => {
      const res = await setUserRole(user.id, next);
      if (res?.ok) setRole(next);
    });
  }

  return (
    <button
      onClick={flip}
      disabled={pending}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
        role === "admin"
          ? "bg-indigo-700 text-cream-50 hover:bg-indigo-600"
          : "bg-cream-100 text-indigo-500 hover:bg-indigo-50"
      }`}
      title={role === "admin" ? "Click to demote to student" : "Click to make admin"}
    >
      {pending ? (
        <Loader2 size={12} className="animate-spin" />
      ) : role === "admin" ? (
        <ShieldCheck size={12} />
      ) : (
        <UserIcon size={12} />
      )}
      {role}
    </button>
  );
}
