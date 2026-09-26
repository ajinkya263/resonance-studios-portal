import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LayoutList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ContentEditor from "@/components/admin/ContentEditor";

export const metadata = { title: "Content Editor — Resonance Studios" };

export default async function ContentPage() {
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

  // Load every module + lesson (RLS lets admins read all of these).
  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, title, description, unlock_delay_days, order_index")
      .order("order_index", { ascending: true }),
    supabase
      .from("lessons")
      .select(
        "id, module_id, title, media_type, media_url, text_content, video_url, order_index"
      )
      .order("module_id", { ascending: true })
      .order("order_index", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-indigo-500 transition hover:text-indigo-700"
        >
          <ArrowLeft size={15} /> Back to Admin Console
        </Link>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-700 px-3 py-1 text-xs font-semibold text-cream-50">
          <LayoutList size={13} /> Content Editor
        </p>
        <h1 className="font-display text-3xl text-indigo-900 md:text-4xl">
          Content Editor
        </h1>
        <p className="mt-2 text-indigo-500">
          Create, edit, and reorder modules and lessons without touching SQL.
        </p>
        <div className="gold-rule mt-3" />
      </div>

      <ContentEditor modules={modules ?? []} lessons={lessons ?? []} />
    </div>
  );
}
