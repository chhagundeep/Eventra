"use client";

import React, { useState } from "react";
import { X, Building2, Mail, Copy, Zap, ShieldCheck, Globe, Fingerprint } from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  doc, 
  serverTimestamp, 
  writeBatch,
  collection // Added collection for ID generation
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
      
      /** * TEACHER'S REQUIREMENT: 
       * Instead of using a name-based slug, we generate a unique Firebase ID.
       */
      const tenantRootRef = doc(collection(db, "tenants")); 
      const tenantId = tenantRootRef.id; // Unique string like 'k8JzLp2...'
      
      const tempPassword = generatePassword();

      // Firebase Secondary Instance for Auth Creation
      const secondaryApp = getApps().find(a => a.name === 'secondary') || initializeApp(firebaseConfig, 'secondary');
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.adminEmail, 
        tempPassword
      );
      const uid = userCredential.user.uid;

      // 1. Global User Identity
      const globalUserRef = doc(db, "users", uid);
      batch.set(globalUserRef, {
        uid: uid,
        email: formData.adminEmail,
        password: tempPassword,
        role: "admin",
        tenantId: tenantId,
        tenantName: formData.orgName, // Saved as metadata for easy display
        status: "active",
        createdAt: serverTimestamp(),
      });

      // 2. Tenant Root Node
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

      // 3. Tenant Sub-collection (Internal RBAC)
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
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="relative h-full w-full max-w-xl bg-[#050505] border-l border-zinc-800/50 shadow-2xl flex flex-col text-white"
          >
            {/* HEADER */}
            <div className="p-12 border-b border-zinc-900 flex justify-between items-center bg-gradient-to-b from-zinc-900/40 to-transparent">
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                  {successData ? <>Node <span className="text-emerald-500">Live</span></> : <>New <span className="text-orange-600">Tenant</span></>}
                </h2>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-3">
                  {successData ? "Deployment Successful" : "Initialize Infrastructure Instance"}
                </p>
              </div>
              <button onClick={handleClose} className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl text-zinc-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              {successData ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                   <div className="bg-zinc-900/50 border border-zinc-800 p-10 rounded-[3rem] space-y-10 relative overflow-hidden">
                      <div className="absolute -top-6 -right-6 p-8 opacity-5 text-emerald-500"><ShieldCheck size={180} /></div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Master Identity</label>
                        <p className="text-2xl font-bold text-white tracking-tight">{successData.email}</p>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                          <Fingerprint size={12} className="text-orange-500" /> System Access Token
                        </label>
                        <div className="flex items-center justify-between bg-black/60 p-6 rounded-[2rem] border border-orange-600/20">
                          <span className="text-4xl font-black text-orange-500 tracking-[0.2em] font-mono">{successData.pass}</span>
                          <button onClick={() => {
                            navigator.clipboard.writeText(successData.pass);
                            toast.success("Token copied");
                          }} className="h-14 w-14 bg-zinc-800 rounded-2xl flex items-center justify-center hover:text-orange-500 transition-all active:scale-90"><Copy size={20} /></button>
                        </div>
                      </div>
                   </div>
                   <button onClick={handleClose} className="w-full bg-white text-black py-7 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] hover:bg-orange-600 hover:text-white transition-all shadow-2xl shadow-white/5">Complete Handshake</button>
                </motion.div>
              ) : (
                <form className="space-y-12" onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Organization Name</label>
                      <div className="group relative">
                        <Building2 className="absolute left-7 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-orange-600 transition-colors" size={20} />
                        <input 
                          type="text" 
                          required 
                          value={formData.orgName}
                          className="w-full bg-zinc-900/30 border border-zinc-800/80 rounded-[2rem] py-7 pl-16 pr-8 outline-none focus:border-orange-600 focus:bg-zinc-900/60 transition-all font-bold text-lg placeholder:text-zinc-800" 
                          placeholder="Eventra Corp" 
                          onChange={(e) => setFormData({...formData, orgName: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Root Admin Email</label>
                      <div className="group relative">
                        <Mail className="absolute left-7 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-orange-600 transition-colors" size={20} />
                        <input 
                          type="email" 
                          required 
                          value={formData.adminEmail}
                          className="w-full bg-zinc-900/30 border border-zinc-800/80 rounded-[2rem] py-7 pl-16 pr-8 outline-none focus:border-orange-600 focus:bg-zinc-900/60 transition-all font-bold text-lg placeholder:text-zinc-800" 
                          placeholder="admin@eventra.io" 
                          onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Service Protocol</label>
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { id: 'Pro', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                        { id: 'Enterprise', icon: ShieldCheck, color: 'text-purple-500', bg: 'bg-purple-500/5' }
                      ].map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setFormData({...formData, plan: plan.id})}
                          className={`relative flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border transition-all duration-500 ${
                            formData.plan === plan.id 
                            ? `border-orange-600/40 ${plan.bg} scale-[1.05] shadow-2xl shadow-orange-900/20` 
                            : 'border-zinc-800/50 bg-transparent opacity-40 hover:opacity-100'
                          }`}
                        >
                          <plan.icon size={32} className={plan.color} />
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${plan.color}`}>
                            {plan.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="relative w-full bg-orange-600 text-white py-8 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] hover:bg-orange-500 shadow-2xl shadow-orange-900/40 group overflow-hidden transition-all disabled:opacity-50">
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={16} />}
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