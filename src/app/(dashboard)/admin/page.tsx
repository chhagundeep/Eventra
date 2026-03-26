"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar, Users, DollarSign, 
  TrendingUp, Activity, Loader2, UserCog 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

export default function AdminDashboard() {
  const { tenantId, user } = useAuth();
  
  // Dynamic States
  const [eventCount, setEventCount] = useState<number | string>("...");
  const [trainerCount, setTrainerCount] = useState<number | string>("...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    // 1. Listen to Active Events
    const eventsRef = collection(db, "tenants", tenantId, "events");
    const unsubscribeEvents = onSnapshot(eventsRef, (snapshot) => {
      setEventCount(snapshot.size);
    });

    // 2. Listen to Active Trainers (Staff)
    const trainersRef = collection(db, "tenants", tenantId, "trainers");
    const unsubscribeTrainers = onSnapshot(trainersRef, (snapshot) => {
      setTrainerCount(snapshot.size);
      setLoading(false);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeTrainers();
    };
  }, [tenantId]);

  return (
    <div className="p-6 lg:p-12 space-y-12 min-h-screen bg-black">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
              Operational Node: <span className="text-orange-600/70 ml-1 normal-case">{tenantId || "Initializing..."}</span>
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
          label="Active Events" 
          value={eventCount} 
          icon={<Calendar className="text-orange-600" size={20} />} 
          trend="Live Registry"
        />
        <StatCard 
          label="Active Trainers" 
          value={trainerCount} 
          icon={<UserCog className="text-emerald-500" size={20} />} 
          trend="Team Strength"
        />
        <StatCard 
          label="Gross Revenue" 
          value="$0" 
          icon={<DollarSign className="text-orange-600" size={20} />} 
          trend="Target: $15k"
        />
      </div>

      {/* ACTIVITY FEEDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="h-64 bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] border-dashed flex flex-col items-center justify-center text-zinc-700 font-bold uppercase text-xs tracking-widest gap-4">
            <Activity className="opacity-20" size={32} />
            Recent Event Activity Feed
         </div>
         <div className="h-64 bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] border-dashed flex flex-col items-center justify-center text-zinc-700 font-bold uppercase text-xs tracking-widest gap-4">
            <Users className="opacity-20" size={32} />
            Upcoming Trainer Sessions
         </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string | number, icon: React.ReactNode, trend: string }) {
  return (
    <div className="group p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] hover:border-orange-600/30 transition-all duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{label}</p>
      <div className="flex items-end gap-3">
        <p className="text-5xl font-black italic tracking-tighter text-white">
          {value === "..." ? <Loader2 className="animate-spin text-zinc-800" size={32} /> : value}
        </p>
        <div className="mb-2 flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase">
          <TrendingUp size={12} className="text-emerald-500" />
          {trend}
        </div>
      </div>
    </div>
  );
}