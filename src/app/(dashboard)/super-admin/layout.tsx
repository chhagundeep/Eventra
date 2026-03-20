"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Menu, Search, Bell } from "lucide-react";
import { Toaster } from "react-hot-toast";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 overflow-hidden font-sans">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#121212',
            color: '#fff',
            border: '1px solid #27272a',
            fontSize: '11px',
            fontWeight: 'bold',
            borderRadius: '16px'
          }
        }}
      />

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-100 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. SIDEBAR - Stays as-is for navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-110 w-72 transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>

      {/* 2. MAIN CONTENT AREA - Now takes up all remaining width */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-24 border-b border-zinc-800/50 bg-[#0a0a0a]/50 backdrop-blur-xl flex items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="lg:hidden p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Dashboard</h2>
              <p className="text-xs font-bold text-zinc-100 mt-0.5">Welcome back, Super Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center bg-zinc-900/80 border border-zinc-800 rounded-2xl px-5 py-3 w-80 group focus-within:border-orange-600/50 transition-all">
              <Search size={16} className="text-zinc-600 group-focus-within:text-orange-600" />
              <input 
                type="text" 
                placeholder="Search across nodes..." 
                className="bg-transparent border-none outline-none px-3 text-xs font-bold w-full text-white" 
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-orange-500 transition-all relative group">
                <Bell size={18} />
                <span className="absolute top-3 right-3 h-1.5 w-1.5 bg-orange-600 rounded-full group-hover:animate-ping" />
              </button>
              <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-xs shadow-[0_0_15px_rgba(234,88,12,0.3)]">
                RA
              </div>
            </div>
          </div>
        </header>

        {/* This main area now expands into the space previously held by the Right Panel */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-orange-900/5 via-transparent to-transparent">
          <div className="max-w-400 mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* 3. RIGHT PANEL (EVENT FEED) - REMOVED TO OPTIMIZE WIDTH */}
    </div>
  );
}