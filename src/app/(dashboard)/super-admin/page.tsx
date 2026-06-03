"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Globe, ShieldCheck, Activity, 
  Plus, Key, Trash2, ExternalLink 
} from "lucide-react";
import { db, auth } from "@/lib/firebase"; 
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; 
import { useRouter } from "next/navigation";
import RegisterTenantModal from "@/components/RegisterTenantModal";
import DeleteModal from "@/components/DeleteModal"; 
import toast from "react-hot-toast";
import Link from "next/link";
import { useDashboardThemeOptional } from "@/contexts/DashboardThemeContext";

export default function SuperAdminDashboard() {
  const { isDark } = useDashboardThemeOptional();
  const [tenants, setTenants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace("/");
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    const q = query(collection(db, "tenants"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const tenantData = snapshot.docs.map(doc => ({
          id: doc.id, 
          ...doc.data()
        }));
        setTenants(tenantData);
      },
      (error) => {
        if (error.code !== "permission-denied") {
          toast.error("Network Topology Sync Failed");
        }
      }
    );
    return () => unsubscribe();
  }, []);

  const confirmDelete = async () => {
    if (!tenantToDelete) return;
    try {
      await deleteDoc(doc(db, "tenants", tenantToDelete.id));
      toast.success(`Node ${tenantToDelete.name} Decommissioned`);
      setIsDeleteModalOpen(false);
      setTenantToDelete(null);
    } catch (error) {
      toast.error("Protocol Failure: Deletion Denied");
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-8 pb-10 max-w-7xl mx-auto">
      {/* COMPACT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
        <div className="text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">
            Control <span className="text-orange-600">Center</span>
          </h2>
          <p className="text-zinc-500 font-bold text-[8px] uppercase tracking-[0.4em] mt-2 ml-1">
            Infrastructure Intelligence v2.0
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-orange-600 hover:bg-orange-500 text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-orange-900/20 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} strokeWidth={3} /> Deploy Tenant
        </motion.button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Organizations", value: tenants.length, icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Enterprise", value: tenants.filter(t => t.plan === 'Enterprise').length, icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Health", value: "99.9%", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Est. ARR", value: `$${(tenants.length * 1490).toLocaleString()}`, icon: Building2, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-zinc-900/30 border border-zinc-800/50 p-3 sm:p-4 rounded-xl backdrop-blur-sm group hover:border-zinc-700 transition-all"
          >
            <div className={`h-8 w-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-3 shrink-0`}>
              <stat.icon size={16} />
            </div>
            <p className="text-zinc-500 text-[7px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 tracking-tighter italic">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* TENANT LIST CONTAINER — Network Topology */}
      <div
        className={`rounded-[1.2rem] p-3 sm:p-5 lg:p-6 border ${
          isDark ? "bg-zinc-900/10 border-zinc-800/50" : "bg-white border-zinc-200 shadow-sm"
        }`}
      >
        <div className="flex flex-row items-center justify-between mb-5 gap-4 px-1">
          <h3
            className={`text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 ${
              isDark ? "text-white" : "text-zinc-900"
            }`}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Network Topology
          </h3>
          <span
            className={`hidden xs:block text-[7px] font-black uppercase px-2 py-0.5 rounded-full border ${
              isDark
                ? "text-zinc-600 bg-zinc-900/80 border-zinc-800/50"
                : "text-zinc-600 bg-zinc-100 border-zinc-200"
            }`}
          >
            Node Status: Operational
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {tenants.map((t) => (
              <motion.div 
                layout
                key={t.id} 
                className={`group flex flex-col lg:flex-row lg:items-center justify-between p-3 rounded-xl transition-all gap-3 border ${
                  isDark
                    ? "bg-zinc-900/40 border-zinc-800/40 hover:border-orange-600/20"
                    : "bg-zinc-50 border-zinc-200 hover:border-orange-400"
                }`}
              >
                {/* Identity Section */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center group-hover:text-orange-500 transition-all border shrink-0 ${
                      isDark
                        ? "bg-zinc-900/80 text-zinc-600 border-zinc-800"
                        : "bg-white text-zinc-500 border-zinc-200"
                    }`}
                  >
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`font-black text-sm tracking-tight leading-none mb-1.5 whitespace-normal ${
                        isDark ? "text-white" : "text-zinc-900"
                      }`}
                    >
                      {t.name}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[9px] text-zinc-500 font-bold lowercase tracking-wider break-all">
                        {t.adminEmail}
                      </p>
                      <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${t.plan === 'Enterprise' ? 'text-purple-500 border-purple-500/20' : 'text-blue-500 border-blue-500/20'}`}>
                         {t.plan || 'Pro'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions & Credentials */}
                <div
                  className={`flex flex-row items-center justify-between lg:justify-end gap-2 border-t lg:border-none pt-2 lg:pt-0 ${
                    isDark ? "border-zinc-800/50" : "border-zinc-200"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all min-w-[100px] ${
                      isDark
                        ? "bg-zinc-950 border-zinc-700"
                        : "bg-orange-50 border-orange-300"
                    }`}
                  >
                    <Key size={12} className={`shrink-0 ${isDark ? "text-orange-500" : "text-orange-700"}`} />
                    <span
                      className={`font-mono text-[8px] font-black tracking-[0.1em] uppercase ${
                        isDark ? "text-orange-400" : "text-orange-800"
                      }`}
                    >
                      {t.password || 'SECURED'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/super-admin/organizations/${t.id}`}
                      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${
                        isDark
                          ? "bg-zinc-800/50 text-zinc-500 hover:bg-white hover:text-black"
                          : "bg-zinc-200 text-zinc-600 hover:bg-orange-600 hover:text-white"
                      }`}
                    >
                      <ExternalLink size={14} />
                    </Link>

                    <button 
                      onClick={() => { setTenantToDelete({ id: t.id, name: t.name }); setIsDeleteModalOpen(true); }} 
                      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${
                        isDark
                          ? "bg-zinc-800/50 text-zinc-700 hover:bg-red-600 hover:text-white"
                          : "bg-zinc-200 text-zinc-600 hover:bg-red-600 hover:text-white"
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <DeleteModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => { setIsDeleteModalOpen(false); setTenantToDelete(null); }} 
        onConfirm={confirmDelete} 
        orgName={tenantToDelete?.name || ""} 
      />
      
      <RegisterTenantModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}