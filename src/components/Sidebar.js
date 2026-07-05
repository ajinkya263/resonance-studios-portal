"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lock,
  Menu,
  X,
  Music4,
  ShieldCheck,
} from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

/**
 * App navigation. Lists UNLOCKED modules as links; locked ones appear greyed
 * with a countdown so students can see what's coming.
 *
 * Props:
 *   modules  — array from getModulesForCurrentUser() (each has .unlocked, .unlocksInDays)
 *   profile  — { full_name, email }
 *   isAdmin  — boolean
 */
export default function Sidebar({ modules = [], profile, isAdmin = false }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-indigo-800/40 bg-indigo-800 px-4 py-3 text-cream-50 md:hidden">
        <Brand />
        <button onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Backdrop for mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-indigo-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-indigo-800 text-cream-100 shadow-soft transition-transform duration-300 md:static md:z-0 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="hidden px-6 py-6 md:block">
          <Brand />
        </div>

        {/* Primary nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={pathname === "/dashboard"}
            onClick={() => setOpen(false)}
          />

          <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            Modules
          </p>

          {modules.length === 0 && (
            <p className="px-3 py-2 text-sm text-indigo-300">No modules yet.</p>
          )}

          {modules.map((m) =>
            m.unlocked ? (
              <NavItem
                key={m.id}
                href={`/dashboard#module-${m.id}`}
                icon={<Music4 size={18} />}
                label={m.title}
                active={false}
                onClick={() => setOpen(false)}
              />
            ) : (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-indigo-400/70"
                title={`Unlocks in ${m.unlocksInDays} day(s)`}
              >
                <Lock size={18} />
                <span className="flex-1 truncate">{m.title}</span>
                <span className="rounded-full bg-indigo-900/50 px-2 py-0.5 text-[10px]">
                  {m.unlocksInDays}d
                </span>
              </div>
            )
          )}

          {isAdmin && (
            <NavItem
              href="/dashboard"
              icon={<ShieldCheck size={18} />}
              label="Admin — all content"
              active={false}
              onClick={() => setOpen(false)}
              badge="ADMIN"
            />
          )}
        </nav>

        {/* Footer / account */}
        <div className="border-t border-indigo-700/60 p-4">
          <p className="truncate text-sm font-medium text-cream-50">
            {profile?.full_name || "Student"}
          </p>
          <p className="mb-3 truncate text-xs text-indigo-300">
            {profile?.email}
          </p>
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-saffron-400 font-display text-lg font-bold text-indigo-900">
        ॐ
      </span>
      <span>
        <span className="block font-display text-lg leading-tight text-cream-50">
          Resonance Studios
        </span>
        <span className="block text-xs tracking-wide text-saffron-300">
          Tabla · Learning Portal
        </span>
      </span>
    </Link>
  );
}

function NavItem({ href, icon, label, active, onClick, badge }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
        active
          ? "bg-saffron-400 font-semibold text-indigo-900"
          : "text-indigo-100 hover:bg-indigo-700/70"
      }`}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-full bg-indigo-900/60 px-2 py-0.5 text-[10px] font-semibold text-saffron-300">
          {badge}
        </span>
      )}
    </Link>
  );
}
