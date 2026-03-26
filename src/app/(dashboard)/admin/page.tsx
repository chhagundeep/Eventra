"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar, Users, DollarSign, 
  TrendingUp, Activity 
} from "lucide-react";

export default function AdminDashboard() {
  const { tenantId, user } = useAuth();

  return (
    <div className="p-6 lg:p-12 space-y-12">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
              Operational Node: {tenantId || "Initializing..."}
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
            Admin <span className="text-orange-600">Console</span>
          </h1>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4">
           <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center text-orange-600">
              <Activity size={20} />
           </div>
           <div>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Operator</p>
              <p className="text-sm font-bold truncate max-w-[150px] text-white">{user?.email}</p>
           </div>
        </div>
      </header>

      {/* ANALYTICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Events" 
          value="12" 
          icon={<Calendar className="text-orange-600" size={20} />} 
          trend="+2 this month"
        />
        <StatCard 
          label="Active Members" 
          value="450" 
          icon={<Users className="text-emerald-500" size={20} />} 
          trend="+12% growth"
        />
        <StatCard 
          label="Gross Revenue" 
          value="$12,400" 
          icon={<DollarSign className="text-orange-600" size={20} />} 
          trend="Target: $15k"
        />
      </div>

      {/* ACTIVITY FEEDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="h-64 bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] border-dashed flex items-center justify-center text-zinc-700 font-bold uppercase text-xs tracking-widest">
            Recent Event Activity Feed
         </div>
         <div className="h-64 bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] border-dashed flex items-center justify-center text-zinc-700 font-bold uppercase text-xs tracking-widest">
            Upcoming Trainer Sessions
         </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="group p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] hover:border-orange-600/30 transition-all duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{label}</p>
      <div className="flex items-end gap-3">
        <p className="text-5xl font-black italic tracking-tighter text-white">{value}</p>
        <div className="mb-2 flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase">
          <TrendingUp size={12} className="text-emerald-500" />
          {trend}
        </div>
      </div>
    </div>
  );
}