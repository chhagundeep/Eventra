"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import { Menu, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth(); // Assuming your hook provides loading state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // PREVENT CRASH: If auth is still loading, show a simple loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-orange-600 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col lg:flex-row">
      
      {/* --- MOBILE HEADER --- */}
      <header className="lg:hidden h-16 border-b border-zinc-800/50 bg-[#0a0a0a] flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Zap className="text-orange-600 fill-orange-600" size={20} />
          <span className="font-black uppercase italic tracking-tighter text-sm">Eventra</span>
        </div>
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-zinc-900 rounded-xl transition-colors"
        >
          <Menu size={24} className="text-zinc-400" />
        </button>
      </header>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 border-r border-zinc-800/50 flex-shrink-0">
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