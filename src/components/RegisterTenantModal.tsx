"use client";

import React, { useState } from "react";
import { X, Building2, Mail, Shield } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function RegisterTenantModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: "",
    adminEmail: "",
    plan: "Pro"
  });

  // Helper to turn "Global Yoga" into "global-yoga" for Firestore IDs
  const generateSlug = (name: string) => {
    return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.orgName || !formData.adminEmail) return;
    setLoading(true);

    try {
      const tenantId = generateSlug(formData.orgName);

      // 1. Use setDoc to create a READABLE ID in the 'tenants' collection
      const tenantRef = doc(db, "tenants", tenantId);
      await setDoc(tenantRef, {
        name: formData.orgName,
        adminEmail: formData.adminEmail,
        plan: formData.plan,
        status: "active",
        createdAt: serverTimestamp(),
      });

      // 2. Create the Admin inside the 'users' sub-collection
      // Using email-based ID for easy lookup in the console
      const adminId = formData.adminEmail.replace(/[@.]/g, '_');
      const userRef = doc(db, "tenants", tenantId, "users", adminId);
      
      await setDoc(userRef, {
        email: formData.adminEmail,
        role: "admin",
        status: "active",
        joinedAt: serverTimestamp(),
      });

      console.log(`Success! Tenant created at: tenants/${tenantId}`);
      onClose();
    } catch (error) {
      console.error("Error onboarding tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="h-full w-full max-w-lg bg-white shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Register Tenant</h2>
            <p className="text-slate-400 text-sm font-medium mt-1">Naming convention: {generateSlug(formData.orgName) || "org-id"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <form className="p-8 flex-1 space-y-8 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Organization Name</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text"
                required
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                placeholder="e.g. Global Tech Events"
                onChange={(e) => setFormData({...formData, orgName: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email"
                required
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                placeholder="admin@organization.com"
                onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Subscription Plan</label>
            <div className="grid grid-cols-2 gap-4">
              {['Pro', 'Enterprise'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({...formData, plan: p})}
                  className={`p-4 rounded-2xl border-2 transition-all text-sm font-bold ${
                    formData.plan === p 
                    ? 'border-orange-500 bg-orange-50 text-orange-600' 
                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {p} Plan
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-900 rounded-[2rem] text-white flex items-center gap-4">
            <Shield className="text-orange-500" size={32} />
            <p className="text-xs font-medium leading-relaxed opacity-80">
              Firestore will generate a readable ID: <strong>tenants/{generateSlug(formData.orgName) || "..."}</strong>
            </p>
          </div>
        </form>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
          <button 
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Registering..." : "Confirm Registration"}
          </button>
        </div>
      </div>
    </div>
  );
}