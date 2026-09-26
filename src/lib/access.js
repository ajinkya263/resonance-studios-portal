import { createClient } from "@/lib/supabase/server";

/** Milliseconds in a day — used to convert enrollment span into days. */
const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Pure helper: how many whole days since a student enrolled.
 * Exported so it can be unit-tested without a DB.
 */
export function daysSinceEnrollment(enrollmentDate, now = new Date()) {
  const start = new Date(enrollmentDate).getTime();
  return Math.floor((now.getTime() - start) / DAY_MS);
}

/**
 * Pure helper: is a single module unlocked for a given student?
 * A module unlocks when EITHER
 *   (a) enough time has passed since enrollment, OR
 *   (b) an admin override exists for that (student, module).
 * Admins bypass everything.
 */
export function isModuleUnlocked({
  module,
  daysEnrolled,
  overrideModuleIds,
  isAdmin,
}) {
  if (isAdmin) return true;
  if (overrideModuleIds.has(module.id)) return true;
  return daysEnrolled >= module.unlock_delay_days;
}

/**
 * ── Khan-Academy-style progression ────────────────────────────────────────
 * Returns every module the CURRENT user is allowed to see, each annotated
 * with `unlocked`, `locked`, and (for locked ones) `unlocksInDays` so the UI
 * can show a countdown instead of hiding content entirely.
 *
 * Admins: all modules, all unlocked.
 * Students: unlocked = (days since enrollment >= unlock_delay_days) OR override.
 *
 * Use this in Server Components (it reads request cookies for auth).
 */
export async function getModulesForCurrentUser() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { profile: null, modules: [] };

  // 1. Profile (role + enrollment_date).
  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, email, role, enrollment_date")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // 2. All modules, ordered.
  const { data: allModules = [] } = await supabase
    .from("modules")
    .select("id, title, description, unlock_delay_days, order_index")
    .order("order_index", { ascending: true });

  // 3. This student's manual overrides.
  const { data: overrides = [] } = await supabase
    .from("user_overrides")
    .select("module_id")
    .eq("user_id", user.id);

  const overrideModuleIds = new Set((overrides ?? []).map((o) => o.module_id));
  const daysEnrolled = profile?.enrollment_date
    ? daysSinceEnrollment(profile.enrollment_date)
    : 0;

  const modules = (allModules ?? []).map((module) => {
    const unlocked = isModuleUnlocked({
      module,
      daysEnrolled,
      overrideModuleIds,
      isAdmin,
    });
    return {
      ...module,
      unlocked,
      unlockedByOverride: !isAdmin && overrideModuleIds.has(module.id),
      unlocksInDays: unlocked
        ? 0
        : Math.max(0, module.unlock_delay_days - daysEnrolled),
    };
  });

  return { profile, isAdmin, daysEnrolled, modules };
}

/**
 * Guarded fetch of a single lesson. Confirms the parent module is unlocked
 * for the current user before returning content — prevents a student from
 * deep-linking to a lesson inside a still-locked module.
 * Returns { lesson, module } or { error } .
 */
export async function getLessonIfUnlocked(lessonId) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthenticated" };

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, module_id, title, media_type, media_url, text_content, video_url, order_index")
    .eq("id", lessonId)
    .single();

  if (!lesson) return { error: "not_found" };

  // Reuse the module gate so the rule lives in exactly one place.
  const { modules } = await getModulesForCurrentUser();
  const parentModule = modules.find((m) => m.id === lesson.module_id);

  if (!parentModule || !parentModule.unlocked) return { error: "locked" };

  // Sibling lessons in the same module (for in-viewer navigation).
  const { data: siblings = [] } = await supabase
    .from("lessons")
    .select("id, title, media_type, order_index")
    .eq("module_id", lesson.module_id)
    .order("order_index", { ascending: true });

  // Has the current user already marked this lesson complete?
  const { data: prog } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  return {
    lesson,
    module: parentModule,
    siblings: siblings ?? [],
    completed: !!prog,
  };
}

/** Days-in-a-row streak from a list of completion timestamps (UTC day granularity). */
function computeStreak(timestamps) {
  if (!timestamps.length) return 0;
  const days = new Set(
    timestamps.map((t) => new Date(t).toISOString().slice(0, 10))
  );
  const dayMs = 86400000;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - dayMs).toISOString().slice(0, 10);
  if (!days.has(today) && !days.has(yesterday)) return 0;

  let cursor = days.has(today) ? new Date() : new Date(Date.now() - dayMs);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor.getTime() - dayMs);
  }
  return streak;
}

/**
 * Progress for the current user: the set of completed lesson ids and the
 * current riyaz (practice) streak in days.
 */
export async function getProgressForCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { completedIds: new Set(), streak: 0, total: 0 };

  const { data: rows = [] } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed_at")
    .eq("user_id", user.id);

  const list = rows ?? [];
  return {
    completedIds: new Set(list.map((r) => r.lesson_id)),
    streak: computeStreak(list.map((r) => r.completed_at)),
    total: list.length,
  };
}
