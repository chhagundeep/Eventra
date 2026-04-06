"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Search, ChevronRight, 
  Trash2, Fingerprint, ShieldCheck 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { 
  collection, onSnapshot, query, orderBy, where 
} from "firebase/firestore";
import Link from "next/link";
import toast from "react-hot-toast";
import DeleteModal from "@/components/DeleteModal";

// --- UPDATED LIVE METRICS COMPONENT ---
function LiveOrganizationMetrics({ tenantId }: { tenantId: string }) {
  const [metrics, setMetrics] = useState({ trainers: 0, users: 0 });

  useEffect(() => {
    if (!tenantId) return;

    // 1. Listen to Trainers sub-collection
    const trainersRef = collection(db, "tenants", tenantId, "trainers");
    const unsubTrainers = onSnapshot(trainersRef, (snap) => {
      setMetrics(prev => ({ ...prev, trainers: snap.size }));
    }, (err) => console.error("Trainers Fetch Error:", err));

    // 2. Listen to Users sub-collection with Role Filter
    const usersRef = collection(db, "tenants", tenantId, "users");
    const usersQuery = query(usersRef, where("role", "==", "user"));
    
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      setMetrics(prev => ({ ...prev, users: snap.size }));
    }, (err) => console.error("Users Fetch Error:", err));

    return () => {
      unsubTrainers();
      unsubUsers();
    };
  }, [tenantId]);

  return (
    <div className="flex items-center justify-center gap-6">
      <div className="text-center">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Trainers</p>
        <p className="text-sm font-bold text-zinc-400">{metrics.trainers}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Users</p>
        <p className="text-sm font-bold text-zinc-400">{metrics.users}</p>
      </div>
    </div>
  );
}

interface Tenant {
  id: string;
  name: string;
  adminUid: string;
  adminEmail?: string;
  password?: string;
  status?: "active" | "inactive";
}

export default function OrganizationsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Tenant | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "tenants"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Tenant)).filter(t => t.name); 
      setTenants(data);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!selectedOrg) return;
    setDeleteLoading(true);
    const loadingId = toast.loading(`Purging ${selectedOrg.name}...`);

    try {
      const response = await fetch("/api/admin/delete-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedOrg.id,
          adminUid: selectedOrg.adminUid,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`${selectedOrg.name} decommissioned.`, { id: loadingId });
        setIsDeleteModalOpen(false);
        setSelectedOrg(null);
      } else {
        throw new Error(data.error || "Decommission protocol failed");
      }
    } catch (error: any) {
      toast.error(error.message, { id: loadingId });
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
            Fleet <span className="text-orange-600">Inventory</span>
          </h2>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-3">
            Identity Management & Node Control
          </p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Filter network nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-orange-600/50 transition-all w-full md:w-72"
          />
        </div>
      </div>

      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-zinc-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 bg-zinc-900/40">
                <th className="px-8 py-6">Organization & Admin Identity</th>
                <th className="px-6 py-6">Security Hash</th>
                <th className="px-6 py-6 text-center">Service Metrics</th>
                <th className="px-6 py-6">Status</th>
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
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-zinc-800 text-zinc-500 group-hover:text-orange-500 transition-all">
                          <Building2 size={22} />
                        </div>
                        <div>
                          <p className="font-bold text-base tracking-tight text-white">{org.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <ShieldCheck size={10} className="text-blue-500" />
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{org.adminEmail}</p>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="group/pass relative inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-lg cursor-help">
                        <Fingerprint size={14} className="text-orange-600" />
                        <span className="text-[11px] font-mono text-zinc-500 group-hover/pass:hidden">••••••••</span>
                        <span className="text-[11px] font-mono text-orange-500 hidden group-hover/pass:block">{org.password}</span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <LiveOrganizationMetrics tenantId={org.id} />
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Node Active</span>
                      </div>
                    </td>

                    <td className="px-8 py-5 text-right flex items-center justify-end gap-3">
                      <button 
                        onClick={() => { setSelectedOrg(org); setIsDeleteModalOpen(true); }} 
                        className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      <Link 
                        href={`/super-admin/organizations/${org.id}`} 
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-black/20"
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

      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedOrg(null); }}
        onConfirm={handleDeleteConfirm}
        orgName={selectedOrg?.name || "this organization"}
        loading={deleteLoading}
      />
    </div>
  );
}