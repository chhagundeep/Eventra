"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, Save, Globe, Palette, Building2, 
  Mail, Phone, Info, Loader2, CheckCircle2, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

export default function AdminConfigPage() {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Configuration State matching your Database Architecture
  const [config, setConfig] = useState({
    organizationName: "",
    description: "",
    contactEmail: "",
    supportPhone: "",
    brandColor: "#EA580C",
    isAutoSyncPublic: true,
    allowGuestRegistration: true,
  });

  useEffect(() => {
    async function loadTenantSettings() {
      if (!tenantId) return;
      try {
        const docRef = doc(db, "tenants", tenantId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfig({
            organizationName: data.organizationName || "",
            description: data.description || "",
            contactEmail: data.contactEmail || "",
            supportPhone: data.supportPhone || "",
            brandColor: data.brandColor || "#EA580C",
            isAutoSyncPublic: data.isAutoSyncPublic ?? true,
            allowGuestRegistration: data.allowGuestRegistration ?? true,
          });
        }
      } catch (error) {
        console.error("Error loading config:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTenantSettings();
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const docRef = doc(db, "tenants", tenantId);
      await updateDoc(docRef, {
        ...config,
        lastUpdated: new Date().toISOString(),
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4">
        <Loader2 className="animate-spin text-orange-600" size={40} />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Syncing Node Data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 pt-20 lg:pt-8 min-h-screen bg-black text-white">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-zinc-900/40 p-6 lg:p-8 rounded-[2rem] border border-zinc-800/50">
        <div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight italic uppercase flex items-center gap-3">
            <Settings className="text-orange-600" /> Admin Configuration
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Organization Layer / Node ID: <span className="text-orange-600/70">{tenantId}</span>
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="relative flex items-center justify-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 hover:text-white transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {saving ? "Saving Changes..." : "Save Configuration"}
          
          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="absolute -bottom-10 left-0 right-0 text-center text-green-500 text-[10px] font-bold uppercase tracking-widest"
              >
                Settings Synced Successfully
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Organization Identity */}
          <section className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="font-black italic uppercase text-sm flex items-center gap-2 tracking-tighter">
                <Building2 size={18} className="text-orange-600" /> Identity & Profile
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Official Organization Name</label>
                <input 
                  type="text" 
                  value={config.organizationName}
                  onChange={(e) => setConfig({...config, organizationName: e.target.value})}
                  className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-orange-600 transition-all font-bold"
                  placeholder="Eventra Yoga Club"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Public Description (Mobile App)</label>
                <textarea 
                  rows={4}
                  value={config.description}
                  onChange={(e) => setConfig({...config, description: e.target.value})}
                  className="w-full bg-black/50 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-orange-600 transition-all resize-none text-sm leading-relaxed"
                  placeholder="Describe your organization's mission and events..."
                />
              </div>
            </div>
          </section>

          {/* Contact Details */}
          <section className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-8 space-y-8">
            <h3 className="font-black italic uppercase text-sm flex items-center gap-2 tracking-tighter border-b border-zinc-800 pb-4">
              <Mail size={18} className="text-orange-600" /> Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                  <input 
                    type="email" 
                    value={config.contactEmail}
                    onChange={(e) => setConfig({...config, contactEmail: e.target.value})}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-orange-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                  <input 
                    type="text" 
                    value={config.supportPhone}
                    onChange={(e) => setConfig({...config, supportPhone: e.target.value})}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-orange-600 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          {/* Brand Aesthetics */}
          <section className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="font-black italic uppercase text-sm flex items-center gap-2 tracking-tighter">
              <Palette size={18} className="text-orange-600" /> Mobile Theme
            </h3>
            <div className="p-6 bg-black/40 rounded-3xl border border-zinc-800 flex items-center gap-6">
              <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-2xl">
                <input 
                  type="color" 
                  value={config.brandColor}
                  onChange={(e) => setConfig({...config, brandColor: e.target.value})}
                  className="absolute inset-0 scale-150 cursor-pointer"
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Primary Color</p>
                <p className="font-mono text-sm text-white mt-0.5">{config.brandColor.toUpperCase()}</p>
              </div>
            </div>
          </section>

          {/* Operational Logic */}
          <section className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="font-black italic uppercase text-sm flex items-center gap-2 tracking-tighter">
              <Globe size={18} className="text-orange-600" /> Global Logic
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold italic uppercase">Auto-Sync Public</span>
                  <span className="text-zinc-500 text-[9px] font-bold">Automatic push to Global Feed</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.isAutoSyncPublic}
                  onChange={(e) => setConfig({...config, isAutoSyncPublic: e.target.checked})}
                  className="accent-orange-600 h-5 w-5 cursor-pointer"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-zinc-800/50">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold italic uppercase">Guest Access</span>
                  <span className="text-zinc-500 text-[9px] font-bold">Allow non-members to view</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.allowGuestRegistration}
                  onChange={(e) => setConfig({...config, allowGuestRegistration: e.target.checked})}
                  className="accent-orange-600 h-5 w-5 cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Security Note */}
          <div className="p-6 rounded-[2rem] bg-orange-600/5 border border-orange-600/20 flex gap-4">
            <Shield className="text-orange-600 shrink-0" size={20} />
            <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase">
              Configuration changes are applied instantly across the <span className="text-white">Eventra Ecosystem</span> including trainer mobile apps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}