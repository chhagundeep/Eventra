"use client";

import React, { useState } from "react";
import { X, Building2, Mail, Shield, Copy, Key, Zap } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterTenantModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ email: string, pass: string } | null>(null);
  const [formData, setFormData] = useState({ orgName: "", adminEmail: "", plan: "Pro" });

  const generateSlug = (name: string) => name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
  const generatePassword = () => "EV-" + Math.random().toString(36).slice(-8).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orgName || !formData.adminEmail) return;
    setLoading(true);

    try {
      const tenantId = generateSlug(formData.orgName);
      const tempPassword = generatePassword();

      await setDoc(doc(db, "tenants", tenantId), {
        name: formData.orgName,
        adminEmail: formData.adminEmail,
        tempPassword: tempPassword,
        plan: formData.plan,
        status: "active",
        createdAt: serverTimestamp(),
      });

      const adminId = formData.adminEmail.replace(/[@.]/g, '_');
      await setDoc(doc(db, "tenants", tenantId, "users", adminId), {
        email: formData.adminEmail,
        password: tempPassword,
        role: "admin",
        status: "active",
        joinedAt: serverTimestamp(),
      });

      setSuccessData({ email: formData.adminEmail, pass: tempPassword });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if(!loading) onClose(); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          {/* Modal Panel */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative h-full w-full max-w-xl bg-[#0a0a0a] border-l border-zinc-800 shadow-[ -20px_0_50px_rgba(0,0,0,0.5)] flex flex-col text-white"
          >
            <div className="p-10 border-b border-zinc-800/50 flex justify-between items-center bg-gradient-to-b from-zinc-900/50 to-transparent">
              <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                  {successData ? <>Node <span className="text-emerald-500">Deployed</span></> : <>New <span className="text-orange-600">Tenant</span></>}
                </h2>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Initialize Organization Instance</p>
              </div>
              <button onClick={() => { setSuccessData(null); onClose(); }} className="p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-2xl text-zinc-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {successData ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-10 space-y-8">
                   <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={120} /></div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Access Identity</label>
                        <p className="text-xl font-bold text-white">{successData.email}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">System Token</label>
                        <div className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-zinc-800">
                          <span className="text-3xl font-black text-orange-500 tracking-[0.3em] font-mono">{successData.pass}</span>
                          <button onClick={() => navigator.clipboard.writeText(successData.pass)} className="p-3 bg-zinc-800 rounded-xl hover:text-orange-500 transition-colors"><Copy size={20} /></button>
                        </div>
                      </div>
                   </div>
                   <button onClick={() => { setSuccessData(null); onClose(); }} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:invert transition-all">Initialize Dashboard</button>
                </motion.div>
              ) : (
                <form className="p-10 space-y-10" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Core Identity</label>
                    <div className="group relative">
                      <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-600 transition-colors" size={20} />
                      <input type="text" required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl py-6 pl-16 pr-6 outline-none focus:border-orange-600 transition-all font-bold placeholder:text-zinc-700" placeholder="ORGANIZATION NAME" onChange={(e) => setFormData({...formData, orgName: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Administrative Contact</label>
                    <div className="group relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-600 transition-colors" size={20} />
                      <input type="email" required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl py-6 pl-16 pr-6 outline-none focus:border-orange-600 transition-all font-bold placeholder:text-zinc-700" placeholder="ADMIN@EMAIL.COM" onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="relative w-full bg-orange-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:bg-orange-500 shadow-2xl shadow-orange-900/40 group overflow-hidden transition-all">
                    <span className="relative z-10">{loading ? "Synchronizing..." : "Finalize Deployment"}</span>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}