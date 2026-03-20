"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, GraduationCap, Smartphone, Search, 
  ExternalLink, Activity, MoreHorizontal, ArrowUpRight
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collectionGroup, onSnapshot, query } from "firebase/firestore";

export default function PlatformUsers() {
  const [activeTab, setActiveTab] = useState<"admins" | "trainers" | "users">("admins");
  const [usersData, setUsersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collectionGroup(db, activeTab));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        tenantName: doc.ref.parent.parent?.id || "Global System"
      }));
      setUsersData(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* 1. Header & Global Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none mb-4">
            Identity <span className="text-orange-600">Topology</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-orange-600 rounded-full" />
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.5em]">
              Cross-Tenant Monitoring Node v2.0
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <StatCard icon={<ShieldCheck size={18}/>} label="Verified Admins" value="12" color="border-purple-500/20" />
          <StatCard icon={<GraduationCap size={18}/>} label="Active Trainers" value="48" color="border-blue-500/20" />
        </div>
      </div>

      {/* 2. Control Bar (Navigation + Search) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <div className="lg:col-span-8 flex bg-zinc-900/40 border border-zinc-800/50 p-1.5 rounded-2xl backdrop-blur-xl">
          {['admins', 'trainers', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 ${
                activeTab === tab 
                ? "bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]" 
                : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="lg:col-span-4 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={`Search across ${activeTab}...`} 
            className="w-full bg-zinc-900/20 border border-zinc-800/50 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-white outline-none focus:border-orange-600/50 focus:bg-zinc-900/40 transition-all"
          />
        </div>
      </div>

      {/* 3. Main Full-Width Data Grid */}
      <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/40 border-b border-zinc-800/50">
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Identity Node</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Parent Organization</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">System Role</th>
                <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Status</th>
                <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-32">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-8 w-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Establishing Node Connection...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                usersData.map((user) => (
                  <tr key={user.id} className="group hover:bg-zinc-800/20 transition-all duration-300">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center font-black text-zinc-400 group-hover:border-orange-600/50 transition-colors">
                          {user.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{user.name}</p>
                          <p className="text-[10px] text-zinc-500 font-bold lowercase opacity-60">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800/30 border border-zinc-700/30">
                        <div className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{user.tenantName}</span>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border ${
                        activeTab === 'admins' ? 'border-purple-500/20 text-purple-500 bg-purple-500/5' : 
                        activeTab === 'trainers' ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' : 
                        'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                      }`}>
                        {activeTab.slice(0, -1)}
                      </span>
                    </td>
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.6)] animate-pulse" />
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Active Node</span>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <button className="p-3 text-zinc-600 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-all">
                        <ArrowUpRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className={`bg-zinc-900/40 border ${color} p-6 rounded-3xl min-w-50 hover:bg-zinc-900/60 transition-all group`}>
      <div className="flex items-center gap-4 mb-3">
        <div className="p-2.5 bg-black rounded-xl text-zinc-500 group-hover:text-orange-600 transition-colors shadow-inner">
          {icon}
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none">{label}</p>
      </div>
      <p className="text-3xl font-black italic text-white tracking-tighter leading-none">{value}</p>
    </div>
  );
}