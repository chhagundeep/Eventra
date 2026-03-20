"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Globe, ShieldCheck, Activity, Plus, Key, Trash2, Edit3 } from "lucide-react";
import { db, auth } from "@/lib/firebase"; // Added auth import
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // Added for auth guard
import { useRouter } from "next/navigation";
import RegisterTenantModal from "@/components/RegisterTenantModal";
import DeleteModal from "@/components/DeleteModal"; 
import toast from "react-hot-toast";

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const router = useRouter();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<{ id: string, name: string } | null>(null);

  // AUTH GUARD: If user logs out, boot them immediately
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/");
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  // DATA LISTENER
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, "tenants"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const tenantData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTenants(tenantData);
      },
      (error) => {
        // Prevents the "Internal Assertion Failed" crash during logout
        if (error.code === "permission-denied") {
          console.warn("Firestore listener detached on logout.");
        } else {
          console.error("Firestore error:", error);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const confirmDelete = async () => {
    if (!tenantToDelete) return;
    try {
      await deleteDoc(doc(db, "tenants", tenantToDelete.id));
      toast.success(`${tenantToDelete.name} removed from fleet`);
      setIsDeleteModalOpen(false);
      setTenantToDelete(null);
    } catch (error) {
      toast.error("Failed to delete tenant");
    }
  };

  const handleEdit = (tenant: any) => {
    setEditingTenant(tenant);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 lg:space-y-12 px-4 sm:px-0 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black italic tracking-tighter uppercase leading-none">
            Control <span className="text-orange-600">Center</span>
          </h2>
          <p className="text-zinc-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] mt-3">
            Platform Intelligence Suite v2.0
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setEditingTenant(null); setIsModalOpen(true); }}
          className="w-full lg:w-auto bg-orange-600 hover:bg-orange-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-orange-900/40 transition-all flex items-center justify-center gap-3"
        >
          <Plus size={18} strokeWidth={3} /> Register New Tenant
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: "Active Tenants", value: tenants.length, icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Enterprise Tier", value: tenants.filter(t => t.plan === 'Enterprise').length, icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "System Health", value: "99.9%", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Revenue Node", value: `$${(tenants.length * 149).toLocaleString()}`, icon: Building2, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-900/40 border border-zinc-800/50 p-6 lg:p-8 rounded-3xl lg:rounded-[2.5rem] backdrop-blur-sm group hover:border-zinc-700 transition-all flex flex-col items-center sm:items-start"
          >
            <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-white mt-1 tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl lg:rounded-[3rem] p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" /> Active Organizations
          </h3>
          <span className="text-[9px] font-bold text-zinc-500 uppercase px-4 py-2 bg-zinc-800/50 rounded-full border border-zinc-800">
            Real-time Feed
          </span>
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {tenants.map((t) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={t.id} 
                className="group flex flex-col md:flex-row md:items-center justify-between p-5 lg:p-6 bg-zinc-900/60 border border-zinc-800/50 hover:border-orange-600/30 rounded-2xl lg:rounded-[2rem] transition-all gap-5"
              >
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  <div className="flex-shrink-0 h-12 w-12 sm:h-14 sm:w-14 bg-zinc-800 rounded-xl lg:rounded-[1.25rem] flex items-center justify-center text-zinc-500 group-hover:text-orange-500 transition-colors">
                    <Building2 size={22} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white tracking-tight text-base sm:text-lg truncate">{t.name}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight truncate max-w-[180px] sm:max-w-none">
                      {t.adminEmail}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 sm:gap-6 pt-3 md:pt-0 border-t border-zinc-800/50 md:border-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-black rounded-xl border border-zinc-800">
                    <Key size={12} className="text-orange-500" />
                    <span className="font-mono text-[9px] sm:text-[10px] text-orange-500 font-black tracking-widest uppercase truncate max-w-[80px]">
                      {t.tempPassword || 'SECURED'}
                    </span>
                  </div>
                  <div className={`px-4 py-1.5 border rounded-full text-[9px] font-black uppercase tracking-widest ${
                    t.plan === 'Enterprise' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                  }`}>
                    {t.plan || 'Pro'} Tier
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(t)} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"><Edit3 size={18} /></button>
                    <button onClick={() => { setTenantToDelete({ id: t.id, name: t.name }); setIsDeleteModalOpen(true); }} className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <DeleteModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setTenantToDelete(null); }} onConfirm={confirmDelete} orgName={tenantToDelete?.name || ""} />
      <RegisterTenantModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTenant(null); }} editData={editingTenant} />
    </div>
  );
}