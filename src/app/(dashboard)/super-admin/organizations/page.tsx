"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Search, Filter, ChevronRight, 
  Trash2, AlertCircle, Loader2, Users, UserCog
} from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, onSnapshot, query, orderBy, 
  doc, deleteDoc, getDocs 
} from "firebase/firestore";
import Link from "next/link";
import toast from "react-hot-toast";

export default function OrganizationsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    // 1. Strict Filter: Only show docs that actually exist and have data
    const q = query(collection(db, "tenants"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeData = snapshot.docs
        .filter(doc => doc.exists() && doc.data().name) 
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      setTenants(activeData);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (orgId: string, orgName: string) => {
    if (!confirm(`CAUTION: Decommissioning ${orgName} will wipe all sub-node data. Proceed?`)) return;
    
    setIsDeleting(orgId);
    try {
      // Clean sub-collections to prevent "Italicized Phantom Docs" in console
      const usersRef = collection(db, "tenants", orgId, "users");
      const usersSnap = await getDocs(usersRef);
      await Promise.all(usersSnap.docs.map(uDoc => deleteDoc(uDoc.ref)));

      await deleteDoc(doc(db, "tenants", orgId));
      toast.success(`${orgName} removed from fleet.`);
    } catch (error) {
      toast.error("Decommissioning failed.");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
            Fleet <span className="text-orange-600">Inventory</span>
          </h2>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-3">
            Real-Time Node Management Suite
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-orange-600/50 transition-all w-full md:w-72"
            />
          </div>
        </div>
      </div>

      {/* RESTORED DATA TABLE */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-275">
            <thead>
              <tr className="border-b border-zinc-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 bg-zinc-900/40">
                <th className="px-8 py-6">Organization</th>
                <th className="px-6 py-6">Service Tier</th>
                <th className="px-6 py-6 text-center">Trainers</th>
                <th className="px-6 py-6 text-center">Users</th>
                <th className="px-6 py-6">Deployment Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              <AnimatePresence mode="popLayout">
                {filteredTenants.map((org) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={org.id} 
                    className="group hover:bg-white/2 transition-colors"
                  >
                    {/* Organization Column */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-orange-500 transition-all">
                          <Building2 size={22} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-base tracking-tight">{org.name}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase">{org.adminEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* Service Tier Column */}
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        org.plan === 'Enterprise' 
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {org.plan || 'Pro'} Tier
                      </span>
                    </td>

                    {/* Trainers Count */}
                    <td className="px-6 py-5 text-center">
                       <span className="text-zinc-400 font-bold text-sm">
                         {org.trainerCount || 0}
                       </span>
                    </td>

                    {/* Users Count */}
                    <td className="px-6 py-5 text-center">
                       <span className="text-zinc-400 font-bold text-sm">
                         {org.userCount || 0}
                       </span>
                    </td>

                    {/* Deployment Status */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full shadow-[0_0_8px] animate-pulse ${
                          org.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-zinc-600 shadow-zinc-600/50'
                        }`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          org.status === 'active' ? 'text-emerald-500' : 'text-zinc-500'
                        }`}>
                          {org.status === 'active' ? 'Active' : 'Offline'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-5 text-right flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleDelete(org.id, org.name)}
                        disabled={isDeleting === org.id}
                        className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                      >
                        {isDeleting === org.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                      </button>
                      <Link 
                        href={`/super-admin/organizations/${org.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800/50 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase transition-all"
                      >
                        Deep Dive <ChevronRight size={14} />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}