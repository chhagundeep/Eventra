"use client";

import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard, Calendar, Users, Settings } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function AdminDashboard() {
  const { tenantId, user } = useAuth();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 p-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-orange-600 rounded-xl flex items-center justify-center font-bold">E</div>
          <span className="font-black uppercase italic tracking-tighter text-xl">Eventra</span>
        </div>

        <nav className="space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-orange-600/10 text-orange-600 rounded-xl font-bold transition-all">
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-zinc-500 hover:text-white transition-all">
            <Calendar size={20} /> My Events
          </button>
          <button className="w-full flex items-center gap-3 p-3 text-zinc-500 hover:text-white transition-all">
            <Users size={20} /> My Team
          </button>
        </nav>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all mt-auto"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">
              Admin <span className="text-orange-600">Console</span>
            </h1>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">
              Managing Organization: <span className="text-white">{tenantId}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Active Session</p>
            <p className="text-sm font-bold">{user?.email}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] space-y-2">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Total Events</p>
            <p className="text-4xl font-black italic">12</p>
          </div>
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] space-y-2">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Active Tickets</p>
            <p className="text-4xl font-black italic text-emerald-500">450</p>
          </div>
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[2rem] space-y-2">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Revenue</p>
            <p className="text-4xl font-black italic text-orange-600">$12,400</p>
          </div>
        </div>
      </main>
    </div>
  );
}