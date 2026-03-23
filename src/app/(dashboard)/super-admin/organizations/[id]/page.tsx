"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Building2, Users, UserCog, Calendar, 
  ArrowLeft, ShieldCheck, Mail, Copy, 
  Activity, ExternalLink
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import toast from "react-hot-toast";

export default function OrganizationDeepDive() {
  const { id } = useParams();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ trainers: 0, users: 0, events: 0 });

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, "tenants", id as string), (docSnap) => {
      if (docSnap.exists()) {
        setOrg({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });

    const fetchCounts = async () => {
      const trainersQ = query(collection(db, "users"), where("tenantId", "==", id), where("role", "==", "trainer"));
      const usersQ = query(collection(db, "users"), where("tenantId", "==", id), where("role", "==", "user"));
      
      const [trainersSnap, usersSnap] = await Promise.all([
        getDocs(trainersQ),
        getDocs(usersQ)
      ]);

      setStats({
        trainers: trainersSnap.size,
        users: usersSnap.size,
        events: 0 
      });
    };

    fetchCounts();
    return () => unsubscribe();
  }, [id]);

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="h-2 w-24 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="h-full w-1/2 bg-orange-600"
        />
      </div>
      <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.4em] mt-4 animate-pulse">
        Synchronizing Node Data...
      </p>
    </div>
  );

  if (!org) return (
    <div className="p-10 text-center">
      <h2 className="text-red-500 font-black text-2xl uppercase italic">Node Not Found</h2>
      <button onClick={() => router.back()} className="mt-4 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest">
        Return to Fleet Map
      </button>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all hover:bg-zinc-800"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
            {org.name} <span className="text-orange-600">Profile</span>
          </h2>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">
            Node ID: {id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Trainers", value: stats.trainers, icon: UserCog, color: "text-orange-500", path: "trainers" },
          { label: "Total Members", value: stats.users, icon: Users, color: "text-blue-500", path: "users" },
          { label: "Scheduled Events", value: stats.events, icon: Calendar, color: "text-purple-500", path: "events" },
        ].map((stat) => (
          <Link href={`/super-admin/organizations/${id}/${stat.path}`} key={stat.label}>
            <motion.div 
              whileHover={{ y: -5, borderColor: "rgba(255,255,255,0.2)" }}
              className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-4xl group cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`${stat.color}`} size={28} />
                <ExternalLink size={16} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-4xl font-black text-white mt-1">{stat.value}</h3>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-8">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <ShieldCheck size={16} className="text-orange-500" /> Administrative Metadata
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center py-5 border-b border-zinc-800/50">
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Primary Admin</span>
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Mail size={14} className="text-zinc-600" />
                {org.adminEmail}
              </div>
            </div>

            <div className="flex justify-between items-center py-5 border-b border-zinc-800/50">
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">License Tier</span>
              <span className="px-4 py-1.5 bg-orange-600/10 border border-orange-600/20 text-orange-500 text-[10px] font-black rounded-full uppercase tracking-tighter">
                {org.plan || 'Pro'} Tier
              </span>
            </div>

            {/* UPDATED ACCESS KEY ROW */}
            <div className="flex justify-between items-center py-5">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Temporary Access Key</span>
                <span className="font-mono text-orange-500 font-black text-xl tracking-[0.2em] mt-1">
                  {org.password || 'NOT DEPLOYED'}
                </span>
              </div>
              
              {org.password && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(org.password);
                    toast.success("Access Key Copied");
                  }}
                  className="p-4 bg-zinc-800/40 hover:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-orange-500 transition-all group"
                >
                  <Copy size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-8">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <Activity size={16} className="text-emerald-500" /> Operational Status
          </h3>
          <div className="h-56 flex items-center justify-center border border-dashed border-zinc-800/50 rounded-[2rem] bg-black/20">
             <div className="text-center">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 mx-auto animate-pulse mb-4 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Node Healthy & Synchronized</p>
                <p className="text-zinc-600 text-[9px] font-bold uppercase mt-2">Uptime: 100.00%</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}