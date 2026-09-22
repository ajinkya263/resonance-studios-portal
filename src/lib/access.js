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

  return { lesson, module: parentModule, siblings: siblings ?? [] };
}
