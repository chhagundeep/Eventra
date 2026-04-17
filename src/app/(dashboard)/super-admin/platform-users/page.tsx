"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Building, Fingerprint, Mail, Trash2, 
  ShieldCheck, AlertTriangle, X, Calendar as CalendarIcon 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collectionGroup, onSnapshot, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function PlatformUsers() {
  const [activeTab, setActiveTab] = useState<"admins" | "trainers" | "users">("admins");
  const [usersData, setUsersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // FIX: Initialize with empty string "" instead of undefined to prevent the controlled input error
  const [searchTerm, setSearchTerm] = useState("");
  
  const [hasMounted, setHasMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    setLoading(true);
    
    const roleValue = activeTab === "admins" ? "admin" : "user";

    // Query logic
    const q = activeTab === "trainers" 
      ? query(collectionGroup(db, "trainers"))
      : query(collectionGroup(db, "users"), where("role", "==", roleValue));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Filter for strict path depth to avoid "Unnamed Org" / System entries
      const validDocs = snapshot.docs.filter(d => d.ref.path.split('/').length === 4);

      const dataPromises = validDocs.map(async (docSnap) => {
        const rawData = docSnap.data();
        const pathSegments = docSnap.ref.path.split('/');
        const tenantId = pathSegments[1]; 

        let organizationName = "Unnamed Org";
        try {
          const tenantSnap = await getDoc(doc(db, "tenants", tenantId));
          if (tenantSnap.exists()) {
            organizationName = tenantSnap.data().name || "Unnamed Entity";
          }
        } catch (e) {
          console.error("Tenant fetch error:", e);
        }

        return {
          id: docSnap.id,
          uid: rawData.uid || docSnap.id, // Fetched as it is (no case transformation)
          tenantNodeId: tenantId,
          orgName: organizationName,
          status: (rawData.status || "inactive").toLowerCase(),
          email: rawData.email || "No Email",
          fullPath: docSnap.ref.path
        };
      });

      const resolvedData = await Promise.all(dataPromises);
      setUsersData(resolvedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab, hasMounted]);

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, user.fullPath), { status: newStatus });
      toast.success(`Node updated: ${newStatus}`);
    } catch (error) {
      toast.error("Status toggle failed");
    }
  };

  // Filter functional based on UID, Organization Name, Email, and Tenant ID
  const filtered = usersData.filter(u => 
    (u.orgName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.tenantNodeId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.uid?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (!hasMounted) return null;

  return (
    <div className="relative min-h-screen bg-black text-zinc-400 p-4 md:p-8 font-sans">
      
      {/* PURGE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-white text-lg font-black uppercase mb-4">Confirm Purge</h2>
            <p className="text-zinc-500 text-xs mb-8">Permanently remove <span className="text-orange-500 font-bold">{userToDelete?.email}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold uppercase text-[10px]">Cancel</button>
              <button className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold uppercase text-[10px]">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
          Platform <span className="text-orange-600">Nodes</span>
        </h2>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-10 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
        <input 
          className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-xs text-white outline-none focus:border-orange-600/40"
          placeholder="Filter by Org, Email, Tenant ID or UID..."
          // searchTerm is now guaranteed to be a string
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABS */}
      <div className="flex bg-zinc-900/40 p-1 rounded-2xl border border-zinc-800 mb-8">
        {['admins', 'trainers', 'users'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === t ? "bg-orange-600 text-white shadow-lg" : "text-zinc-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center uppercase text-[10px] tracking-[0.5em]">Syncing Stream...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/5">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/60 border-b border-zinc-800">
              <tr>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-zinc-500">Organization Entity</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-zinc-500">{activeTab} Stream</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-zinc-500 text-center">Status</th>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-zinc-500 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {filtered.map((user) => (
                <tr key={user.fullPath} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-[11px] uppercase tracking-wide">{user.orgName}</span>
                      <span className="text-[8px] font-mono text-zinc-600 mt-0.5">{user.tenantNodeId}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-zinc-300 font-medium text-[10px]">{user.email}</span>
                      {/* Preserving UID exactly as fetched */}
                      <span className="text-[8px] font-mono text-zinc-600 mt-0.5 tracking-tighter">UID: {user.uid}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => handleToggleStatus(user)}
                      className={`mx-auto flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase transition-all ${
                        user.status === 'active' 
                        ? 'bg-orange-500/5 border-orange-500/30 text-orange-500' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-600'
                      }`}
                    >
                      <div className={`h-1 w-1 rounded-full ${user.status === 'active' ? 'bg-orange-500' : 'bg-zinc-600'}`} />
                      {user.status}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => { setUserToDelete(user); setIsModalOpen(true); }} className="text-zinc-700 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}