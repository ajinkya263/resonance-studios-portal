import { redirect } from "next/navigation";
import { ShieldCheck, Users, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { daysSinceEnrollment } from "@/lib/access";
import AdminUsersPanel from "@/components/admin/AdminUsersPanel";

export const metadata = { title: "Admin Console — Resonance Studios" };

export default async function AdminPage() {
  const supabase = createClient();

  // Guard: admins only.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/dashboard");

  // Load everything the console needs (RLS lets admins read all of these).
  const [{ data: users }, { data: modules }, { data: overrides }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, email, role, auth_provider, enrollment_date")
        .order("enrollment_date", { ascending: true }),
      supabase
        .from("modules")
        .select("id, title, unlock_delay_days, order_index")
        .order("order_index", { ascending: true }),
      supabase.from("user_overrides").select("user_id, module_id"),
    ]);

  const allUsers = (users ?? []).map((u) => ({
    ...u,
    daysEnrolled: daysSinceEnrollment(u.enrollment_date),
  }));
  const overrideKeys = (overrides ?? []).map(
    (o) => `${o.user_id}::${o.module_id}`
  );

  const studentCount = allUsers.filter((u) => u.role === "student").length;
  const adminCount = allUsers.filter((u) => u.role === "admin").length;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-700 px-3 py-1 text-xs font-semibold text-cream-50">
          <ShieldCheck size={13} /> Admin Console
        </p>
        <h1 className="font-display text-3xl text-indigo-900 md:text-4xl">
          Students &amp; Progression
        </h1>
        <p className="mt-2 text-indigo-500">
          View every account and manually unlock modules ahead of schedule.
        </p>
        <div className="gold-rule mt-3" />
      </div>

      {/* Summary tiles */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Tile icon={<Users size={18} />} label="Total accounts" value={allUsers.length} />
        <Tile icon={<GraduationCap size={18} />} label="Students" value={studentCount} />
        <Tile icon={<ShieldCheck size={18} />} label="Admins" value={adminCount} />
      </div>

      <AdminUsersPanel
        users={allUsers}
        modules={modules ?? []}
        overrideKeys={overrideKeys}
      />
    </div>
  );
}

function Tile({ icon, label, value }) {
  return (
    <div className="surface flex items-center gap-4 p-5">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </span>
      <div>
        <p className="font-display text-2xl text-indigo-800">{value}</p>
        <p className="text-xs uppercase tracking-wide text-indigo-400">{label}</p>
      </div>
    </div>
  );
}
