"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Throws unless the current session belongs to an admin. Returns the admin user. */
async function requireAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Admins only");
  return user;
}

/** Coerce any input to a safe integer (blank / NaN → fallback). */
function toInt(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Re-render the surfaces that read this content. */
function revalidateContent() {
  revalidatePath("/admin/content");
  revalidatePath("/dashboard");
}

/* ── Modules ─────────────────────────────────────────────────────────── */

/** Insert a blank module at the end of the list (order_index = current max + 1). */
export async function createModule() {
  const supabase = createClient();
  await requireAdmin(supabase);

  const { data: last } = await supabase
    .from("modules")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (last?.[0]?.order_index ?? -1) + 1;

  const { error } = await supabase.from("modules").insert({
    title: "New module",
    unlock_delay_days: 0,
    order_index: nextOrder,
  });
  if (error) return { ok: false, error: error.message };

  revalidateContent();
  return { ok: true };
}

/** Update an existing module's editable fields. */
export async function updateModule(
  id,
  { title, description, unlock_delay_days, order_index }
) {
  const supabase = createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("modules")
    .update({
      title,
      description,
      unlock_delay_days: toInt(unlock_delay_days),
      order_index: toInt(order_index),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateContent();
  return { ok: true };
}

/** Permanently delete a module. */
export async function deleteModule(id) {
  const supabase = createClient();
  await requireAdmin(supabase);

  const { error } = await supabase.from("modules").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateContent();
  return { ok: true };
}

/* ── Lessons ─────────────────────────────────────────────────────────── */

/** Insert a blank lesson at the end of a module (order_index = max + 1 in module). */
export async function createLesson(moduleId) {
  const supabase = createClient();
  await requireAdmin(supabase);

  const { data: last } = await supabase
    .from("lessons")
    .select("order_index")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (last?.[0]?.order_index ?? -1) + 1;

  const { error } = await supabase.from("lessons").insert({
    module_id: moduleId,
    title: "New lesson",
    media_type: "text",
    order_index: nextOrder,
  });
  if (error) return { ok: false, error: error.message };

  revalidateContent();
  return { ok: true };
}

/** Update an existing lesson's editable fields. */
export async function updateLesson(
  id,
  { title, media_type, media_url, text_content, video_url, order_index }
) {
  const supabase = createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("lessons")
    .update({
      title,
      media_type,
      media_url,
      text_content,
      video_url,
      order_index: toInt(order_index),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateContent();
  return { ok: true };
}

/** Permanently delete a lesson. */
export async function deleteLesson(id) {
  const supabase = createClient();
  await requireAdmin(supabase);

  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateContent();
  return { ok: true };
}
