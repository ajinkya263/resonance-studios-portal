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

/** Grant a student early access to a module (creates a user_override). */
export async function grantOverride(userId, moduleId) {
  const supabase = createClient();
  const admin = await requireAdmin(supabase);

  const { error } = await supabase
    .from("user_overrides")
    .upsert(
      { user_id: userId, module_id: moduleId, granted_by: admin.id },
      { onConflict: "user_id,module_id" }
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Revoke a previously granted early-access override. */
export async function revokeOverride(userId, moduleId) {
  const supabase = createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("user_overrides")
    .delete()
    .eq("user_id", userId)
    .eq("module_id", moduleId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Promote or demote a user between 'student' and 'admin'. */
export async function setUserRole(userId, role) {
  if (!["student", "admin"].includes(role)) {
    return { ok: false, error: "Invalid role" };
  }
  const supabase = createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}
