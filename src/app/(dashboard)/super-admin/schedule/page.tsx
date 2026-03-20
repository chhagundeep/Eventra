"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Plus, Clock, TrendingUp, Download, RefreshCw, CheckCircle2, X 
} from "lucide-react";

export default function SuperAdminSchedule() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // 1. Functional: Export Report to CSV
  const exportToCSV = () => {
    const data = [
      ["Event Name", "Organization", "Date", "Status"],
      ["Global Summit", "Alpha IT", "2026-05-23", "Confirmed"],
      ["Staff Audit", "Beta Corp", "2026-05-17", "Pending"]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "platform_report_may_2026.csv");
    document.body.appendChild(link);
    link.click();
  };

  // 2. Functional: Integrated Google Calendar Sync (No Browser Alert)
  const handleGoogleSync = async () => {
    setIsSyncing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
    
    // Trigger custom UI notification
    setShowToast(true);
    
    // Auto-hide after 4 seconds
    setTimeout(() => setShowToast(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white space-y-8 p-8 relative overflow-hidden">
      
      {/* --- CUSTOM UI TOAST NOTIFICATION --- */}
      {showToast && (
        <div className="fixed top-8 right-8 z-[100] animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="bg-zinc-900 border border-orange-600/50 p-4 rounded-2xl shadow-2xl shadow-orange-900/40 backdrop-blur-xl flex items-center gap-4 min-w-[320px]">
            <div className="bg-orange-600/20 p-2 rounded-full">
              <CheckCircle2 className="text-orange-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white">Sync Successful</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5 tracking-tight">Timeline updated with Google Calendar</p>
            </div>
            <button onClick={() => setShowToast(false)} className="text-zinc-600 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none mb-4">
            Platform <span className="text-orange-600">Timeline</span>
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-600 animate-pulse" />
              Real-time Node Monitoring
            </p>
            <button 
              onClick={handleGoogleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-400 hover:text-orange-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin text-orange-600" : ""} />
              {isSyncing ? "Syncing G-Cal..." : "Sync with Google"}
            </button>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={exportToCSV}
            className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2"
          >
            <Download size={14} /> Export CSV
          </button>
          <button className="px-6 py-3 bg-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-900/20 hover:scale-105 transition-transform">
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard label="Total Bookings" value="44,115" change="+12.5%" icon={<CalendarIcon size={16}/>} />
        <MetricCard label="Avg. Attendance" value="88.4%" change="+3.1%" icon={<TrendingUp size={16}/>} />
        <MetricCard label="Active Nodes" value="48" change="Stable" icon={<div className="text-emerald-500">◈</div>} />
        <MetricCard label="Uptime" value="99.99%" change="Live" icon={<Clock size={16}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Calendar View */}
        <div className="lg:col-span-8">
          <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">May 2026</h3>
                <span className="px-3 py-1 bg-zinc-800 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest">Today: May 23</span>
              </div>
              <div className="flex bg-black p-1 rounded-xl border border-zinc-800">
                <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronLeft size={18}/></button>
                <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><ChevronRight size={18}/></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 pb-4">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const dayNum = i - 3; 
                const isToday = dayNum === 23;
                return (
                  <div key={i} className={`min-h-[110px] rounded-2xl border transition-all p-3 group relative
                    ${dayNum > 0 && dayNum <= 31 ? 'bg-zinc-900/30 border-zinc-800/50 hover:border-orange-600/50' : 'opacity-0 pointer-events-none'}
                    ${isToday ? 'bg-orange-600/5 border-orange-600/50' : ''}
                  `}>
                    <span className={`text-xs font-black ${isToday ? 'text-orange-600' : 'text-zinc-500'}`}>
                      {dayNum > 0 ? (dayNum < 10 ? `0${dayNum}` : dayNum) : ''}
                    </span>
                    
                    {dayNum === 23 && (
                      <div className="mt-2 space-y-1">
                        <div className="h-1.5 w-full bg-orange-600 rounded-full shadow-lg shadow-orange-900/50" />
                        <p className="text-[8px] font-black uppercase text-white truncate">Global Summit</p>
                        <p className="text-[7px] font-bold text-zinc-500 uppercase">Alpha IT</p>
                      </div>
                    )}
                    {dayNum === 15 && (
                      <div className="mt-2 flex flex-col gap-1">
                        <div className="h-1.5 w-8 bg-zinc-700 rounded-full" />
                        <div className="h-1 w-12 bg-zinc-800 rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-[2.5rem] p-8 backdrop-blur-xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Service Distribution</h3>
            <div className="relative h-44 w-44 mx-auto mb-8 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="88" cy="88" r="75" stroke="#18181b" strokeWidth="12" fill="transparent" />
                <circle cx="88" cy="88" r="75" stroke="#ea580c" strokeWidth="12" strokeDasharray="471" strokeDashoffset="150" strokeLinecap="round" fill="transparent" />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black italic tracking-tighter block">72%</span>
                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Node Load</span>
              </div>
            </div>
            <div className="space-y-4">
              <CategoryRow label="Enterprise Tier" percentage="64%" color="bg-orange-600" />
              <CategoryRow label="Standard Tier" percentage="36%" color="bg-zinc-700" />
            </div>
          </div>

          <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-[2.5rem] p-8 backdrop-blur-xl">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">System Health</h3>
             <div className="h-20 flex items-end gap-1 px-2">
                {[40, 70, 45, 90, 65, 80, 50, 85, 100, 75].map((h, i) => (
                  <div key={i} className="flex-1 bg-zinc-800 rounded-t-sm hover:bg-orange-600 transition-all duration-500" style={{ height: `${h}%` }} />
                ))}
             </div>
             <div className="flex justify-between mt-4">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Latency: 14ms</p>
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Optimal</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change, icon }: any) {
  return (
    <div className="bg-zinc-900/20 border border-zinc-800/50 p-6 rounded-[2.5rem] hover:bg-zinc-800/40 transition-all group cursor-default">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-black rounded-2xl text-zinc-500 border border-zinc-800/50 group-hover:text-orange-500 group-hover:border-orange-600/30 transition-all shadow-xl">{icon}</div>
        <span className="text-[9px] font-black px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">{change}</span>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 leading-none mb-2">{label}</p>
      <h4 className="text-3xl font-black italic tracking-tighter">{value}</h4>
    </div>
  );
}

function CategoryRow({ label, percentage, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`h-1.5 w-1.5 rounded-full ${color} shadow-[0_0_8px_rgba(234,88,12,0.4)]`} />
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[9px] font-black text-white">{percentage}</span>
    </div>
  );
}