import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth/role";
import { isAdminRole } from "@/lib/roles";
import Sidebar from "../../components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getCurrentRole();

  if (!isAdminRole(role)) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={role} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center">
            {/* Reserved for far-left alignment (e.g. mobile toggle) */}
          </div>

          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600">
              {role}
            </span>
          </div>
        </header>

        {/* Scrollable Main */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
