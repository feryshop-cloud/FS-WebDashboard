import { ReactNode } from "react";
import Sidebar from "../../components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center">
            {/* Reserved for far-left alignment (e.g. mobile toggle) */}
          </div>

          <div className="flex items-center">
            {/* Profile completely removed for extreme minimalism */}
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
