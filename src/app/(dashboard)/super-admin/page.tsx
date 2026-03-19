"use client";

import React, { useState, useEffect } from "react";
import { Plus, Building2, MoreVertical, ShieldCheck, Key } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import RegisterTenantModal from "@/components/RegisterTenantModal";
import { motion } from "framer-motion";

export default function SuperAdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "tenants"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setTenants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
            Control <span className="text-orange-600">Center</span>
          </h1>
          <p className="text-zinc-500 font-bold mt-4 tracking-wide uppercase text-xs">Manage active Eventra tenants</p>
        </motion.div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all">
          <Plus size={20} strokeWidth={3} /> Register Tenant
        </motion.button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/50 border border-zinc-800/50 rounded-[2.5rem] p-6 md:p-10 backdrop-blur-sm">
        <div className="grid gap-4">
          {tenants.map((t, index) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 md:px-8 bg-zinc-900/80 border border-zinc-800 hover:border-orange-600/30 rounded-3xl transition-all gap-4">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 bg-zinc-800 group-hover:bg-orange-600/10 rounded-2xl flex items-center justify-center transition-colors">
                  <Building2 size={24} className="text-zinc-400 group-hover:text-orange-500" />
                </div>
                <div>
                  <div className="font-black text-lg text-white group-hover:text-orange-500 transition-colors tracking-tight">{t.name}</div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t.adminEmail}</div>
                    {/* UNIQUE PASSWORD BADGE */}
                    {t.tempPassword && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-600/10 border border-orange-600/20 rounded-lg">
                        <Key size={10} className="text-orange-500" />
                        <span className="font-mono text-[10px] text-orange-500 font-black uppercase">{t.tempPassword}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                </div>
                <button className="p-2 text-zinc-600 hover:text-white"><MoreVertical size={20} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <RegisterTenantModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}