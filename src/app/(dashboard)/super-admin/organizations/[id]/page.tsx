"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Building2, Users, UserCog, Calendar, 
  ArrowLeft, ShieldCheck, Mail, HardDrive, 
  Activity, ExternalLink
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function OrganizationDeepDive() {
  const { id } = useParams();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ trainers: 0, users: 0, events: 0 });

  useEffect(() => {
    if (!id) return;

    // 1. Listen to Organization Metadata
    const unsubscribe = onSnapshot(doc(db, "tenants", id as string), (docSnap) => {
      if (docSnap.exists()) {
        setOrg({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });

    // 2. Fetch Sub-collection Counts (Trainers/Users/Events)
    const fetchCounts = async () => {
      const trainersQ = query(collection(db, "users"), where("orgId", "==", id), where("role", "==", "trainer"));
      const usersQ = query(collection(db, "users"), where("orgId", "==", id), where("role", "==", "user"));
      
      const [trainersSnap, usersSnap] = await Promise.all([
        getDocs(trainersQ),
        getDocs(usersQ)
      ]);

      setStats({
        trainers: trainersSnap.size,
        users: usersSnap.size,
        events: 0 // Replace with your events collection query later
      });
    };

    fetchCounts();
    return () => unsubscribe();
  }, [id]);

  if (loading) return <div className="p-10 text-zinc-500 font-black animate-pulse">SYNCHRONIZING NODE DATA...</div>;
  if (!org) return <div className="p-10 text-red-500 font-black">NODE NOT FOUND</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Navigation Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"
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

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Trainers", value: stats.trainers, icon: UserCog, color: "text-orange-500", path: "trainers" },
          { label: "Total Members", value: stats.users, icon: Users, color: "text-blue-500", path: "users" },
          { label: "Scheduled Events", value: stats.events, icon: Calendar, color: "text-purple-500", path: "events" },
        ].map((stat) => (
          <Link href={`/super-admin/organizations/${id}/${stat.path}`} key={stat.label}>
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-4xl group cursor-pointer hover:border-zinc-600 transition-all"
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

      {/* Configuration & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Organization Details Card */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-8">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <ShieldCheck size={16} className="text-orange-500" /> Administrative Metadata
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
              <span className="text-zinc-500 text-[10px] font-black uppercase">Primary Admin</span>
              <span className="text-white font-bold text-sm">{org.adminEmail}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
              <span className="text-zinc-500 text-[10px] font-black uppercase">License Tier</span>
              <span className="px-3 py-1 bg-orange-600/10 border border-orange-600/20 text-orange-500 text-[10px] font-black rounded-full uppercase">
                {org.plan || 'Pro'}
              </span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-zinc-800/50">
              <span className="text-zinc-500 text-[10px] font-black uppercase">Temporary Access Key</span>
              <span className="font-mono text-orange-500 font-black text-xs">{org.tempPassword || 'SECURED'}</span>
            </div>
          </div>
        </div>

        {/* System Health / Logs Placeholder */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-8">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <Activity size={16} className="text-emerald-500" /> Operational Status
          </h3>
          <div className="h-48 flex items-center justify-center border border-dashed border-zinc-800 rounded-3xl">
             <div className="text-center">
                <div className="h-2 w-2 rounded-full bg-emerald-500 mx-auto animate-pulse mb-3" />
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Node Healthy & Synchronized</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}