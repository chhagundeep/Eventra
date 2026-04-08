"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Building2, Users, UserCog, 
  ArrowLeft, ShieldCheck, Mail, Copy, 
  Activity, ExternalLink, Fingerprint, Lock,
  Globe, Zap, Calendar, Clock
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, limit } from "firebase/firestore";
import Link from "next/link";
import toast from "react-hot-toast";

export default function OrganizationDeepDive() {
  const params = useParams();
  const id = params.id as string; 
  const router = useRouter();
  
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ trainers: 0, users: 0, events: 0 });
  const [activeEvents, setActiveEvents] = useState<any[]>([]);

  // Utility function for copying text
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} Copied`);
  };

  useEffect(() => {
    if (!id) return;

    // 1. Fetch Organization Base Data
    const unsubOrg = onSnapshot(doc(db, "tenants", id), (docSnap) => {
      if (docSnap.exists()) {
        setOrg({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Node not found in registry");
      }
      setLoading(false);
    }, (error) => {
      console.error("Org Snapshot error:", error);
      setLoading(false);
    });

    // 2. Trainers Stats
    const trainersRef = collection(db, "tenants", id, "trainers");
    const unsubTrainers = onSnapshot(trainersRef, (snap) => {
      setStats(prev => ({ ...prev, trainers: snap.size }));
    });

    // 3. Users Stats
    const usersRef = collection(db, "tenants", id, "users");
    const usersQuery = query(usersRef, where("role", "==", "user"));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    // 4. Events Stats & Live Records (Limited to 4 for the preview)
    const eventsRef = collection(db, "tenants", id, "events");
    const qEvents = query(eventsRef, limit(4));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      const eventList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveEvents(eventList);
      setStats(prev => ({ ...prev, events: snap.size }));
    });

    return () => {
      unsubOrg();
      unsubTrainers();
      unsubUsers();
      unsubEvents();
    };
  }, [id]);

  if (loading) return (
    <div className="p-10 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="h-1.5 w-32 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="h-full w-1/2 bg-orange-600"
        />
      </div>
    </div>
  );

  if (!org) return (
    <div className="p-10 text-center text-white">
      <p className="text-zinc-500 font-black uppercase tracking-widest mb-4">Error 404</p>
      <h2 className="text-2xl font-bold">Node Not Found</h2>
      <button onClick={() => router.back()} className="mt-6 text-orange-600 uppercase font-black text-xs">Return to Fleet</button>
    </div>
  );

  return (
    <div className="space-y-8 lg:space-y-12 px-4 sm:px-6 lg:px-8 pb-10 max-w-7xl mx-auto overflow-x-hidden">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-4">
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl lg:text-4xl font-black italic tracking-tighter uppercase text-white leading-tight break-words">
              {org.name} <span className="text-orange-600">Infrastructure</span>
            </h2>
            <p className="text-zinc-500 font-bold text-[9px] uppercase tracking-[0.4em] mt-1">
              Status: <span className="text-emerald-500">Node Synchronized</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-5 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl shrink-0">
          <Globe size={16} className="text-zinc-500" />
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Region: Global-01</span>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
        {[
          { label: "Active Trainers", value: stats.trainers, icon: UserCog, color: "text-orange-500", href: `/super-admin/organizations/${id}/trainers` },
          { label: "Platform Users", value: stats.users, icon: Users, color: "text-blue-500", href: `/super-admin/organizations/${id}/users` },
          // FIXED: Redirects to your custom Card Format page at /admin/events
          { label: "Network Events", value: stats.events, icon: Zap, color: "text-purple-500", href: `/super-admin/organizations/${id}/events` },
        ].map((stat) => (
          <Link href={stat.href} key={stat.label}>
            <motion.div 
              whileHover={{ y: -5, borderColor: "rgba(234, 88, 12, 0.3)" }}
              className="bg-zinc-900/40 border border-zinc-800/50 p-6 sm:p-8 rounded-[2rem] group cursor-pointer transition-all backdrop-blur-sm shadow-2xl shadow-black/20"
            >
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`${stat.color} group-hover:scale-110 transition-transform`} size={24} />
                <ExternalLink size={14} className="text-zinc-600 group-hover:text-white transition-colors" />
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl sm:text-4xl font-black text-white mt-1">{stat.value}</h3>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* LIVE EVENTS DEEP DIVE SECTION */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 backdrop-blur-md">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Calendar size={16} className="text-purple-500" /> Event Records (Live)
          </h3>
          {/* FIXED: Redirects to /admin/events */}
          <Link href={`/admin/events?tenantId=${id}`} className="text-[9px] font-black text-zinc-500 hover:text-orange-500 uppercase tracking-widest flex items-center gap-2 transition-colors">
            Access Full Registry <ExternalLink size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeEvents.length > 0 ? (
            activeEvents.map((event, idx) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 flex items-center gap-5 hover:border-zinc-700 transition-all cursor-default"
              >
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                  <Zap size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-bold text-sm truncate uppercase tracking-tight">
                    {event.title || "Unnamed Event"}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[9px] font-black text-zinc-600 uppercase flex items-center gap-1">
                      <Clock size={10} /> {event.date || "TBD"}
                    </span>
                    <span className="text-[9px] font-black text-purple-500 uppercase px-2 py-0.5 bg-purple-500/10 rounded-md">
                      {event.type || "Live"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center border border-dashed border-zinc-800 rounded-3xl">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">No event records found in sub-collection</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* SECURE INFO */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 backdrop-blur-md relative overflow-hidden">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <Lock size={16} className="text-orange-500" /> Secure Identity Protocol
          </h3>
          <div className="space-y-6 relative z-10">
            <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-4 border-b border-zinc-800/30 gap-2 group">
                <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest shrink-0">Admin Email</span>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-xs">{org.adminEmail}</span>
                  <button onClick={() => copyToClipboard(org.adminEmail, "Admin Email")} className="text-zinc-600 hover:text-orange-500 transition-colors">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 gap-2 group">
                <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest shrink-0">Network ID</span>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400 font-mono text-[10px]">{id}</span>
                  <button onClick={() => copyToClipboard(id, "Network ID")} className="text-zinc-600 hover:text-orange-500 transition-colors">
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PERFORMANCE */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 backdrop-blur-md">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
            <Activity size={16} className="text-emerald-500" /> Live Node Performance
          </h3>
          <div className="min-h-[200px] flex flex-col items-center justify-center border border-dashed border-zinc-800/50 rounded-[2rem] bg-black/40 space-y-4">
              <div className="h-4 w-4 rounded-full bg-emerald-500 animate-ping opacity-30" />
              <div className="text-center">
                <p className="text-[11px] font-black text-white uppercase tracking-[0.5em]">Synchronized</p>
                <p className="text-zinc-600 text-[9px] font-bold uppercase mt-2">Integrity Check Passed</p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}