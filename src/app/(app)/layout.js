import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getModulesForCurrentUser } from "@/lib/access";

/**
 * Shell for all authenticated pages (/dashboard, /lessons/*).
 * Fetches the current user's module list once and renders the sidebar + page.
 * Middleware already redirects unauthenticated users, but we double-check here.
 */
export default async function AppLayout({ children }) {
  const { profile, isAdmin, modules } = await getModulesForCurrentUser();

  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar modules={modules} profile={profile} isAdmin={isAdmin} />
      <main className="flex-1 px-5 py-8 md:px-10 md:py-12">{children}</main>
    </div>
  );
}
