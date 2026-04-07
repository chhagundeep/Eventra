"use client";

import React, { useState } from "react";
import { X, Building2, Mail, Copy, Zap, ShieldCheck, Globe, Fingerprint } from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  doc, 
  serverTimestamp, 
  writeBatch,
  collection 
} from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterTenantModal({ isOpen, onClose }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ email: string, pass: string } | null>(null);
  const [formData, setFormData] = useState({ orgName: "", adminEmail: "", plan: "Pro" });

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "EV"; 
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orgName || !formData.adminEmail) return;
    setLoading(true);

    try {
      const batch = writeBatch(db);
      const tenantRootRef = doc(collection(db, "tenants")); 
      const tenantId = tenantRootRef.id; 
      const tempPassword = generatePassword();

      const secondaryApp = getApps().find(a => a.name === 'secondary') || initializeApp(firebaseConfig, 'secondary');
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.adminEmail, 
        tempPassword
      );
      const uid = userCredential.user.uid;

      const globalUserRef = doc(db, "users", uid);
      batch.set(globalUserRef, {
        uid: uid,
        email: formData.adminEmail,
        password: tempPassword,
        role: "admin",
        tenantId: tenantId,
        tenantName: formData.orgName,
        status: "active",
        createdAt: serverTimestamp(),
      });

      batch.set(tenantRootRef, {
        id: tenantId,
        name: formData.orgName,
        adminEmail: formData.adminEmail,
        adminUid: uid,
        password: tempPassword,
        plan: formData.plan,
        status: "active",
        createdAt: serverTimestamp(),
      });

      const subUserRef = doc(db, "tenants", tenantId, "users", uid);
      batch.set(subUserRef, {
        email: formData.adminEmail,
        password: tempPassword,
        role: "admin",
        status: "active",
        joinedAt: serverTimestamp(),
      });

      await batch.commit();
      setSuccessData({ email: formData.adminEmail, pass: tempPassword });
      toast.success("Organization Node Deployed");
    } catch (error: any) {
      console.error("Deployment Error:", error);
      toast.error(error.message || "Deployment sequence failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSuccessData(null);
    setFormData({ orgName: "", adminEmail: "", plan: "Pro" });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center md:justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md md:backdrop-blur-xl"
          />

          <motion.div 
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative h-full w-full md:max-w-lg lg:max-w-xl bg-[#050505] border-l border-zinc-800/50 shadow-2xl flex flex-col text-white"
          >
            {/* HEADER - Condensed padding */}
            <div className="p-6 md:p-8 border-b border-zinc-900 flex justify-between items-center bg-gradient-to-b from-zinc-900/40 to-transparent">
              <div>
                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">
                  {successData ? <>Node <span className="text-emerald-500">Live</span></> : <>New <span className="text-orange-600">Tenant</span></>}
                </h2>
                <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-2">
                  {successData ? "Deployment Successful" : "Initialize Infrastructure Instance"}
                </p>
              </div>
              <button onClick={handleClose} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              {successData ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                   <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-[2rem] space-y-6 relative overflow-hidden">
                      <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] text-emerald-500 pointer-events-none">
                        <ShieldCheck size={120} />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Master Identity</label>
                        <p className="text-xl font-bold text-white tracking-tight break-all">{successData.email}</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                          <Fingerprint size={10} className="text-orange-500" /> System Access Token
                        </label>
                        <div className="flex items-center justify-between bg-black/60 p-4 md:p-5 rounded-2xl border border-orange-600/20">
                          <span className="text-2xl md:text-3xl font-black text-orange-500 tracking-[0.15em] font-mono">{successData.pass}</span>
                          <button onClick={() => {
                            navigator.clipboard.writeText(successData.pass);
                            toast.success("Token copied");
                          }} className="h-10 w-10 md:h-12 md:w-12 bg-zinc-800 rounded-lg flex items-center justify-center hover:text-orange-500 transition-all active:scale-90">
                            <Copy size={18} />
                          </button>
                        </div>
                      </div>
                   </div>
                   <button onClick={handleClose} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all shadow-xl">
                      Complete Handshake
                   </button>
                </motion.div>
              ) : (
                <form className="space-y-8" onSubmit={handleSubmit}>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Organization Name</label>
                      <div className="group relative">
                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-orange-600 transition-colors" size={18} />
                        <input 
                          type="text" 
                          required 
                          value={formData.orgName}
                          className="w-full bg-zinc-900/30 border border-zinc-800/80 rounded-2xl py-4 md:py-5 pl-12 pr-6 outline-none focus:border-orange-600 focus:bg-zinc-900/60 transition-all font-bold text-base placeholder:text-zinc-800" 
                          placeholder="Eventra Corp" 
                          onChange={(e) => setFormData({...formData, orgName: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Root Admin Email</label>
                      <div className="group relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-orange-600 transition-colors" size={18} />
                        <input 
                          type="email" 
                          required 
                          value={formData.adminEmail}
                          className="w-full bg-zinc-900/30 border border-zinc-800/80 rounded-2xl py-4 md:py-5 pl-12 pr-6 outline-none focus:border-orange-600 focus:bg-zinc-900/60 transition-all font-bold text-base placeholder:text-zinc-800" 
                          placeholder="admin@eventra.io" 
                          onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">Service Protocol</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'Pro', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                        { id: 'Enterprise', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-500/5' }
                      ].map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setFormData({...formData, plan: plan.id})}
                          className={`relative flex flex-col items-center gap-3 p-5 md:p-6 rounded-3xl border transition-all duration-300 ${
                            formData.plan === plan.id 
                            ? `border-orange-600/40 ${plan.bg} bg-zinc-900/50 shadow-lg` 
                            : 'border-zinc-800/50 bg-transparent opacity-40 hover:opacity-100'
                          }`}
                        >
                          <plan.icon size={24} className={plan.color} />
                          <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${plan.color}`}>
                            {plan.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="relative w-full bg-orange-600 text-white py-5 md:py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-orange-500 shadow-xl shadow-orange-900/20 group overflow-hidden transition-all disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={14} />}
                      {loading ? "Initializing..." : "Deploy Organization"}
                    </span>
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