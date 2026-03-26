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

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<{ id: string, name: string } | null>(null);

  // AUTH GUARD: Ensure only logged in users see the dashboard
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/");
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  // DATA LISTENER: Real-time sync with "tenants" collection
  useEffect(() => {
    const q = query(collection(db, "tenants"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const tenantData = snapshot.docs.map(doc => ({
          // IMPORTANT: doc.id is now the unique Firebase Auto-ID
          id: doc.id, 
          ...doc.data()
        }));
        setTenants(tenantData);
      },
      (error) => {
        if (error.code !== "permission-denied") {
          console.error("Firestore error:", error);
          toast.error("Network Topology Sync Failed");
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // DELETE HANDLER: Uses the unique ID to decommission the node
  const confirmDelete = async () => {
    if (!tenantToDelete) return;
    try {
      await deleteDoc(doc(db, "tenants", tenantToDelete.id));
      toast.success(`Node ${tenantToDelete.name} Decommissioned`);
      setIsDeleteModalOpen(false);
      setTenantToDelete(null);
    } catch (error) {
      console.error("Deletion Error:", error);
      toast.error("Protocol Failure: Deletion Denied");
    }
  };

  return (
    <div className="space-y-8 lg:space-y-12 px-4 sm:px-0 pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black italic tracking-tighter uppercase leading-none">
            Control <span className="text-orange-600">Center</span>
          </h2>
          <p className="text-zinc-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.4em] mt-3">
            Infrastructure Intelligence Suite v2.0
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="w-full lg:w-auto bg-orange-600 hover:bg-orange-500 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-orange-900/40 transition-all flex items-center justify-center gap-3"
        >
          <Plus size={18} strokeWidth={3} /> Deploy New Tenant
        </motion.button>
      </div>

      {/* TOP STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: "Active Nodes", value: tenants.length, icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Enterprise Tier", value: tenants.filter(t => t.plan === 'Enterprise').length, icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Network Health", value: "99.9%", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Estimated ARR", value: `$${(tenants.length * 1490).toLocaleString()}`, icon: Building2, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-900/40 border border-zinc-800/50 p-8 rounded-[2.5rem] backdrop-blur-sm group hover:border-zinc-700 transition-all"
          >
            <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-white mt-1 tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* TENANT LIST SECTION */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[3rem] p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4 px-2">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Network Topology
          </h3>
          <span className="text-[9px] font-black text-zinc-500 uppercase px-4 py-2 bg-zinc-800/50 rounded-full border border-zinc-800">
            Node Status: Operational
          </span>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {tenants.map((t) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={t.id} 
                className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-zinc-900/40 border border-zinc-800/50 hover:border-orange-600/30 rounded-[2rem] transition-all gap-5"
              >
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-zinc-800 rounded-3xl flex items-center justify-center text-zinc-600 group-hover:text-orange-500 group-hover:bg-orange-600/10 transition-all border border-transparent group-hover:border-orange-600/20">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-xl tracking-tight leading-none mb-2">{t.name}</h4>
                    <div className="flex items-center gap-3">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t.adminEmail}</p>
                        <div className="h-1 w-1 rounded-full bg-zinc-800" />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${t.plan === 'Enterprise' ? 'text-purple-500' : 'text-blue-500'}`}>
                           {t.plan || 'Pro'} Tier
                        </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4">
                  {/* Access Token Display */}
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-black/40 rounded-2xl border border-zinc-800/50 group-hover:border-orange-600/20 transition-all">
                    <Key size={14} className="text-orange-600" />
                    <span className="font-mono text-[11px] text-orange-500 font-black tracking-[0.2em]">
                      {t.password || 'SECURED'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* View Details Button - Uses t.id which is now the unique Firebase ID */}
                    <Link 
                      href={`/super-admin/organizations/${t.id}`}
                      className="h-12 w-12 flex items-center justify-center bg-zinc-800 text-zinc-400 hover:bg-orange-600 hover:text-white rounded-xl transition-all"
                    >
                      <ExternalLink size={18} />
                    </Link>

                    {/* Delete Button */}
                    <button 
                      onClick={() => { setTenantToDelete({ id: t.id, name: t.name }); setIsDeleteModalOpen(false); setIsDeleteModalOpen(true); }} 
                      className="h-12 w-12 flex items-center justify-center bg-zinc-800 text-zinc-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
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