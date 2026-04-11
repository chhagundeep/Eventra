"use client";

import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Calendar, Users, Activity, Clock } from "lucide-react";

export default function TrainerPage() {
  const { user, tenantId } = useAuth();

  return (
    <div className="p-8 lg:p-12 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-10"
      >
        <header>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Trainer <span className="text-orange-600">Dashboard</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">
            Logged in as: <span className="text-zinc-300">{user?.email}</span>
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem]">
            <Calendar className="text-orange-600 mb-4" size={24} />
            <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Active Events</div>
            <div className="text-3xl font-bold mt-1">08</div>
          </div>
          
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem]">
            <Users className="text-white mb-4" size={24} />
            <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Attendees</div>
            <div className="text-3xl font-bold mt-1">124</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem]">
            <Activity className="text-white mb-4" size={24} />
            <div className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Tenant ID</div>
            <div className="text-xs font-mono mt-2 text-zinc-400 break-all">{tenantId}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}