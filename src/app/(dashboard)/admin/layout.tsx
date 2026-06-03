"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import DashboardProfileMenu from "@/components/DashboardProfileMenu";
import { Menu, Search, Bell, Sun, Moon } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { DashboardThemeProvider, useDashboardTheme } from "@/contexts/DashboardThemeContext";

function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { role, loading, user } = useAuth();
  const { isDark, toggleTheme } = useDashboardTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0a0a]" : "bg-zinc-50"}`}>
        <div className="h-8 w-8 border-2 border-orange-600 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  const welcomeName =
    user?.displayName?.trim() || user?.email?.split("@")[0] || "Admin";

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${isDark ? "bg-[#050505] text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#121212",
            color: "#fff",
            border: "1px solid #27272a",
            fontSize: "11px",
            fontWeight: "bold",
            borderRadius: "16px",
          },
        }}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-110 w-72 transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar role={(role as "admin") || "admin"} onClose={() => setIsSidebarOpen(false)} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`relative z-[100] h-24 border-b backdrop-blur-xl flex items-center justify-between px-6 lg:px-12 ${isDark ? "border-zinc-800/50 bg-[#0a0a0a]/50" : "border-zinc-200 bg-white/80"}`}
        >
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden p-3 border rounded-xl ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Dashboard</h2>
              <p className={`text-xs font-bold mt-0.5 ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>
                Welcome back, {welcomeName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div
              className={`hidden md:flex items-center border rounded-2xl px-5 py-3 w-80 group focus-within:border-orange-600/50 transition-all ${isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-zinc-100 border-zinc-200"}`}
            >
              <Search size={16} className="text-zinc-500 group-focus-within:text-orange-600" />
              <input
                type="text"
                placeholder="Search organization..."
                className={`bg-transparent border-none outline-none px-3 text-xs font-bold w-full placeholder:text-zinc-500 ${isDark ? "text-white" : "text-zinc-900"}`}
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className={`p-3 border rounded-2xl hover:text-orange-500 transition-all ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}
              >
                {isDark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
              </button>
              <button
                type="button"
                className={`p-3 border rounded-2xl hover:text-orange-500 transition-all relative group ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-600"}`}
              >
                <Bell size={18} />
                <span className="absolute top-3 right-3 h-1.5 w-1.5 bg-orange-600 rounded-full group-hover:animate-ping" />
              </button>
              <DashboardProfileMenu isDark={isDark} fallbackLabel="Admin" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-orange-900/5 via-transparent to-transparent">
          <div className="max-w-400 mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </DashboardThemeProvider>
  );
}
