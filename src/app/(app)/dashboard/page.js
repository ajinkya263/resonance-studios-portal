import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getModulesForCurrentUser, getProgressForCurrentUser } from "@/lib/access";
import ModuleCard from "@/components/ModuleCard";
import Reveal from "@/components/Reveal";
import { Sparkles, Music4, PlayCircle } from "lucide-react";

export const metadata = { title: "Dashboard — Resonance Studios" };

export default async function DashboardPage() {
  const { profile, isAdmin, daysEnrolled, modules } =
    await getModulesForCurrentUser();
  const { completedIds, streak } = await getProgressForCurrentUser();

  // Fetch lessons for every UNLOCKED module in one query, then group them.
  const unlockedIds = modules.filter((m) => m.unlocked).map((m) => m.id);
  let lessonsByModule = {};

  if (unlockedIds.length > 0) {
    const supabase = createClient();
    const { data: lessons = [] } = await supabase
      .from("lessons")
      .select("id, module_id, title, media_type, media_url, order_index")
      .in("module_id", unlockedIds)
      .order("order_index", { ascending: true });

    lessonsByModule = (lessons ?? []).reduce((acc, l) => {
      (acc[l.module_id] ||= []).push(l);
      return acc;
    }, {});
  }

  // First not-yet-completed lesson in an unlocked module → "resume".
  let resumeId = null;
  for (const m of modules) {
    if (!m.unlocked) continue;
    const found = (lessonsByModule[m.id] || []).find(
      (l) => !completedIds.has(l.id)
    );
    if (found) {
      resumeId = found.id;
      break;
    }
  }

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const unlockedCount = modules.filter((m) => m.unlocked).length;

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="surface relative mb-10 overflow-hidden p-8 md:p-10">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-saffron-100 px-3 py-1 text-xs font-semibold text-saffron-600">
            <Sparkles size={13} />
            {isAdmin ? "Admin view — all content unlocked" : "Your practice path"}
          </p>
          <h1 className="font-display text-3xl text-indigo-900 md:text-4xl">
            Namaste, <span className="text-gradient">{firstName}</span> 🙏
          </h1>
          <p className="mt-3 text-indigo-500">
            {isAdmin
              ? "You’re viewing every module and lesson in the studio."
              : `You have ${unlockedCount} module${
                  unlockedCount === 1 ? "" : "s"
                } unlocked. Keep practicing — more opens as you progress.`}
          </p>

          {!isAdmin && (
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <Stat label="Day streak" value={`${streak}🔥`} />
              <Stat label="Lessons done" value={completedIds.size} />
              <Stat label="Modules unlocked" value={unlockedCount} />
              <Stat label="Days enrolled" value={daysEnrolled} />
            </div>
          )}

          {resumeId && (
            <Link href={`/lessons/${resumeId}`} className="btn-primary mt-6">
              <PlayCircle size={18} /> Continue practicing
            </Link>
          )}
        </div>

        {/* decorative note glyph */}
        <Music4
          className="absolute -right-6 -top-6 hidden h-40 w-40 animate-float text-saffron-400/15 md:block"
          strokeWidth={1}
        />
      </section>

      {/* ── Module grid ──────────────────────────────────────────────── */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl text-indigo-800">Your Modules</h2>
          <div className="gold-rule mt-2" />
        </div>
      </div>

      {modules.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module, i) => {
            const lessons = lessonsByModule[module.id] || [];
            const doneCount = lessons.filter((l) =>
              completedIds.has(l.id)
            ).length;
            return (
              <Reveal key={module.id} delay={i * 70} className="h-full">
                <ModuleCard
                  module={module}
                  lessons={lessons}
                  completedIds={completedIds}
                  doneCount={doneCount}
                />
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-display text-3xl text-indigo-800">{value}</p>
      <p className="text-xs uppercase tracking-wide text-indigo-400">{label}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="surface grid place-items-center gap-2 py-16 text-center text-indigo-400">
      <Music4 size={32} />
      <p className="font-medium text-indigo-600">No modules yet</p>
      <p className="text-sm">
        Your teacher hasn’t published any modules. Check back soon.
      </p>
    </div>
  );
}
