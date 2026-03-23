"use client";

import React, { useState, useEffect } from "react";
import { X, Building2, Mail, Copy, Zap, ShieldCheck, Globe } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
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
  editData?: any; 
}

export default function RegisterTenantModal({ isOpen, onClose, editData }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ email: string, pass: string } | null>(null);
  const [formData, setFormData] = useState({ orgName: "", adminEmail: "", plan: "Pro" });

  useEffect(() => {
    if (editData) {
      setFormData({
        orgName: editData.name || "",
        adminEmail: editData.adminEmail || "",
        plan: editData.plan || "Pro",
      });
    } else {
      setFormData({ orgName: "", adminEmail: "", plan: "Pro" });
    }
  }, [editData, isOpen]);

  const generateSlug = (name: string) => name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
  
  // Alphanumeric only: No slashes, no hyphens
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
      if (editData) {
        const tenantRef = doc(db, "tenants", editData.id);
        await updateDoc(tenantRef, {
          name: formData.orgName,
          adminEmail: formData.adminEmail,
          plan: formData.plan,
          updatedAt: serverTimestamp(),
        });
        toast.success("Organization profile updated");
        onClose();
      } else {
        const tenantId = generateSlug(formData.orgName);
        const tempPassword = generatePassword();

        // 1. Initialize Secondary Auth to avoid logging out current Super Admin
        const secondaryApp = getApps().find(a => a.name === 'secondary') || initializeApp(firebaseConfig, 'secondary');
        const secondaryAuth = getAuth(secondaryApp);
        
        // 2. Create actual User in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth, 
          formData.adminEmail, 
          tempPassword
        );
        const uid = userCredential.user.uid;

        // 3. GLOBAL USER MAPPING (Visible password saved here for your reference)
        await setDoc(doc(db, "users", uid), {
          uid: uid,
          email: formData.adminEmail,
          password: tempPassword, // Saved as plain text in Firestore so you can see it
          role: "admin",
          tenantId: tenantId,
          status: "active",
          createdAt: serverTimestamp(),
        });

        // 4. TENANT ROOT DOCUMENT
        await setDoc(doc(db, "tenants", tenantId), {
          id: tenantId,
          name: formData.orgName,
          adminEmail: formData.adminEmail,
          adminUid: uid,
          password: tempPassword, // CRITICAL: Added this so the dashboard can read it
          plan: formData.plan,
          status: "active",
          createdAt: serverTimestamp(),
        });

        // 5. TENANT SUB-COLLECTION USER (linked by actual Auth UID)
        await setDoc(doc(db, "tenants", tenantId, "users", uid), {
          email: formData.adminEmail,
          password: tempPassword, // Also saved here for tenant-specific lookups
          role: "admin",
          status: "active",
          joinedAt: serverTimestamp(),
        });

        setSuccessData({ email: formData.adminEmail, pass: tempPassword });
        toast.success("New tenant deployed successfully");
      }
    } catch (error: any) {
      console.error("Deployment Error:", error);
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if(!loading) onClose(); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative h-full w-full max-w-xl bg-[#0a0a0a] border-l border-zinc-800 shadow-2xl flex flex-col text-white"
          >
            {/* HEADER */}
            <div className="p-10 border-b border-zinc-800/50 flex justify-between items-center bg-gradient-to-b from-zinc-900/50 to-transparent">
              <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                  {successData ? <>Organisation <span className="text-emerald-500">Added</span></> : 
                   editData ? <>Update <span className="text-blue-500">Tenant</span></> : 
                   <>New <span className="text-orange-600">Tenant</span></>}
                </h2>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">
                  {editData ? "Modify Organization Parameters" : "Initialize Organization Instance"}
                </p>
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
                          <button onClick={() => {
                            navigator.clipboard.writeText(successData.pass);
                            toast.success("Token copied to clipboard");
                          }} className="p-3 bg-zinc-800 rounded-xl hover:text-orange-500 transition-colors"><Copy size={20} /></button>
                        </div>
                      </div>
                   </div>
                   <button onClick={() => { setSuccessData(null); onClose(); }} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:invert transition-all">Initialize Dashboard</button>
                </motion.div>
              ) : (
                <form className="p-10 space-y-10" onSubmit={handleSubmit}>
                  {/* ORG NAME */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Core Identity</label>
                    <div className="group relative">
                      <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-600 transition-colors" size={20} />
                      <input 
                        type="text" 
                        required 
                        value={formData.orgName}
                        disabled={!!editData}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl py-6 pl-16 pr-6 outline-none focus:border-orange-600 transition-all font-bold placeholder:text-zinc-700 disabled:opacity-50" 
                        placeholder="ORGANIZATION NAME" 
                        onChange={(e) => setFormData({...formData, orgName: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* ADMIN EMAIL */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Administrative Contact</label>
                    <div className="group relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-600 transition-colors" size={20} />
                      <input 
                        type="email" 
                        required 
                        value={formData.adminEmail}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl py-6 pl-16 pr-6 outline-none focus:border-orange-600 transition-all font-bold placeholder:text-zinc-700" 
                        placeholder="ADMIN@EMAIL.COM" 
                        onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} 
                      />
                    </div>
                  </div>

                  {/* PLAN SELECTION */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">Service Tier Selection</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'Pro', icon: Globe, color: 'text-blue-500', border: 'border-blue-500/30', bg: 'bg-blue-500/5' },
                        { id: 'Enterprise', icon: ShieldCheck, color: 'text-purple-500', border: 'border-purple-500/30', bg: 'bg-purple-500/5' }
                      ].map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setFormData({...formData, plan: plan.id})}
                          className={`relative flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all duration-300 ${
                            formData.plan === plan.id 
                            ? `${plan.border} ${plan.bg} scale-[1.02] ring-1 ring-offset-4 ring-offset-black ring-zinc-800` 
                            : 'border-zinc-800 bg-zinc-900/30 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                          }`}
                        >
                          <plan.icon size={28} className={plan.color} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${plan.color}`}>
                            {plan.id} Tier
                          </span>
                          {formData.plan === plan.id && (
                            <motion.div layoutId="activePlan" className="absolute inset-0 rounded-[2rem] border-2 border-orange-600/20 pointer-events-none" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="relative w-full bg-orange-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:bg-orange-500 shadow-2xl shadow-orange-900/40 group overflow-hidden transition-all">
                    <span className="relative z-10">{loading ? "Synchronizing..." : editData ? "Update Instance" : "Finalize Deployment"}</span>
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