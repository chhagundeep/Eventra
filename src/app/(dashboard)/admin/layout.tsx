"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { Menu, Zap, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardThemeProvider, useDashboardTheme } from "@/contexts/DashboardThemeContext";

function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const { isDark, toggleTheme } = useDashboardTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0a0a0a]" : "bg-zinc-50"}`}>
        <div className="h-8 w-8 border-2 border-orange-600 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${isDark ? "bg-[#0a0a0a] text-white" : "bg-zinc-50 text-zinc-900"}`}>
      
      {/* --- MOBILE HEADER --- */}
      <header className={`lg:hidden h-16 border-b flex items-center justify-between px-6 sticky top-0 z-40 ${isDark ? "border-zinc-800/50 bg-[#0a0a0a]" : "border-zinc-200 bg-white"}`}>
        <div className="flex items-center gap-2">
          <Zap className="text-orange-600 fill-orange-600" size={20} />
          <span className={`font-black uppercase italic tracking-tighter text-sm ${isDark ? "text-white" : "text-zinc-900"}`}>Eventra</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-zinc-900 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"}`}
          >
            {isDark ? <Sun size={22} className="text-amber-500" /> : <Moon size={22} />}
          </button>
          <button 
            onClick={toggleSidebar}
            className={`p-2 rounded-xl transition-colors ${isDark ? "hover:bg-zinc-900 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"}`}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={`hidden lg:block w-72 h-screen sticky top-0 border-r flex-shrink-0 ${isDark ? "border-zinc-800/50" : "border-zinc-200"}`}>
        <Sidebar role={(role as any) || "admin"} />
      </aside>

      {/* --- MOBILE SIDEBAR --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] z-[60] lg:hidden shadow-2xl"
            >
              <Sidebar 
                role={(role as any) || "admin"} 
                onClose={() => setIsSidebarOpen(false)} 
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0">
        <div className="p-0">
          {children}
        </div>
      </main>
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