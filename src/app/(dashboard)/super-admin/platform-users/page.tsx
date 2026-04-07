"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, Building, Fingerprint, Mail, Trash2, 
  ShieldCheck, Power, AlertTriangle, X, Calendar as CalendarIcon 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collectionGroup, onSnapshot, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

/**
 * SHARED UI COMPONENTS
 */
const DataRow = ({ label, value, icon, isMono }: any) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[7px] font-black text-zinc-500 uppercase flex items-center gap-1">
      {icon} {label}
    </span>
    <span className={`text-[10px] font-bold ${isMono ? 'font-mono text-zinc-500' : 'text-zinc-300'} break-all leading-tight`}>
      {value}
    </span>
  </div>
);

export default function PlatformUsers() {
  const [activeTab, setActiveTab] = useState<"admins" | "trainers" | "users">("admins");
  const [usersData, setUsersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  
  // DYNAMIC DATE STATE
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  useEffect(() => {
    setHasMounted(true);
    const dateTimer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(dateTimer);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    setLoading(true);
    const roleMap: Record<string, string> = { admins: "admin", trainers: "trainer", users: "user" };
    const q = query(collectionGroup(db, "users"), where("role", "==", roleMap[activeTab]));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tenantDocs = snapshot.docs.filter(docSnap => docSnap.ref.path.split('/').length === 4);

      const dataPromises = tenantDocs.map(async (docSnap) => {
        const rawData = docSnap.data();
        const pathSegments = docSnap.ref.path.split('/');
        const tenantId = pathSegments[1]; 

        let organizationName = "Unnamed Org";
        try {
          const tenantSnap = await getDoc(doc(db, "tenants", tenantId));
          if (tenantSnap.exists()) {
            organizationName = tenantSnap.data().name || organizationName;
          }
        } catch (e) {
          console.error("Tenant fetch error:", e);
        }

        return {
          id: docSnap.id,
          tenantNodeId: tenantId,
          orgName: organizationName,
          status: rawData.status || "inactive",
          email: rawData.email || "No Email",
          compositeKey: docSnap.ref.path,
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
    const userRef = doc(db, user.fullPath);
    
    try {
      await updateDoc(userRef, { status: newStatus });
      toast.success(`User set to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setIsModalOpen(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    
    setIsModalOpen(false);
    const loadingToast = toast.loading("Purging Node...");
    
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: userToDelete.tenantNodeId, userId: userToDelete.id }),
      });
      if ((await res.json()).success) {
        toast.success("Identity Purged.", { id: loadingToast });
      } else {
        throw new Error("Failed");
      }
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setUserToDelete(null);
    }
  };

  const filtered = usersData.filter(u => 
    u.orgName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.tenantNodeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasMounted) return null;

  // Render variables after mount to prevent hydration mismatch
  const formattedMonth = currentDate.toLocaleString('default', { month: 'long' });
  const formattedDay = currentDate.getDate();
  const formattedWeekday = currentDate.toLocaleString('default', { weekday: 'long' });

  return (
    <div className="relative min-h-screen bg-black text-zinc-400 p-3 md:p-8 font-sans">
      
      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl shadow-orange-900/20 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <h2 className="text-white text-lg font-black uppercase tracking-tight mb-2">Confirm Node Purge</h2>
            <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-8">
              You are about to permanently delete <span className="text-orange-500 font-bold">{userToDelete?.email}</span> from the <span className="text-zinc-300 font-bold">{userToDelete?.orgName}</span> network. This action cannot be reversed.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={executeDelete}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-red-900/20"
              >
                Confirm Permanent Purge
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all"
              >
                Cancel Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TITLE SECTION WITH REPAIRED NESTING & SPACING */}
      <div className="mb-10 pt-2">
        <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">
            Platform <span className="text-orange-600">Users</span>
        </h2>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mb-10 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-orange-500 transition-colors" size={16} />
        <input 
          className="w-full bg-zinc-900/20 border border-zinc-800/60 rounded-2xl pl-12 pr-4 py-4 text-xs text-zinc-200 outline-none focus:border-orange-600/40 focus:bg-zinc-900/40 transition-all placeholder:text-zinc-700"
          placeholder="Search Identity Stream (Email, ID, or Org)..."
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ACCESS MANAGEMENT HEADER */}
      <div className="flex items-center justify-between mb-8 px-1">
        <div className="flex flex-col">
           <h1 className="text-white text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
             <ShieldCheck size={14} className="text-orange-600" />
             Access Management
           </h1>
           <div className="flex items-center gap-2 mt-1">
             <CalendarIcon size={10} className="text-zinc-700" />
             <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
               {formattedWeekday}, {formattedDay} {formattedMonth}
             </span>
           </div>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800/50">
           <div className="h-1.5 w-1.5 rounded-full bg-orange-600 animate-pulse" />
           <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Live Nodes: {filtered.length}</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-800/40 mb-8">
        {['admins', 'trainers', 'users'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === t ? "bg-orange-600 text-white shadow-xl shadow-orange-900/20 scale-[1.02]" : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-32 text-center">
           <div className="inline-block h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mb-4" />
           <div className="text-[8px] font-black uppercase tracking-[0.8em] text-zinc-800 text-center ml-2">Decrypting</div>
        </div>
      ) : (
        <div className="max-w-full">
          {/* MOBILE LIST */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filtered.map((user) => (
              <div key={user.compositeKey} className="bg-zinc-900/20 border border-zinc-800/30 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800/50 rounded-xl border border-zinc-700/30">
                      <Building size={14} className="text-orange-500" />
                    </div>
                    <h4 className="text-[12px] font-black text-zinc-100 uppercase tracking-tight">{user.orgName}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleToggleStatus(user)} className={`p-2 rounded-lg border transition-all ${user.status === 'active' ? 'bg-orange-500/10 border-orange-500/40 text-orange-500' : 'bg-zinc-800 border-zinc-700 text-zinc-600'}`}>
                      <Power size={14} />
                    </button>
                    <button onClick={() => handleDeleteUser(user)} className="p-2 bg-red-500/5 border border-red-500/20 text-red-900 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-zinc-800/50">
                  <DataRow label="Network Mail" value={user.email} icon={<Mail size={10}/>} />
                  <DataRow label="Node ID" value={user.tenantNodeId} icon={<Fingerprint size={10}/>} isMono />
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/5 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-900/40 border-b border-zinc-800/80">
                <tr>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 whitespace-nowrap">Organization Entity</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Access Key</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 text-center">Status</th>
                  <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 text-right">Node Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/20">
                {filtered.map((user) => (
                  <tr key={user.compositeKey} className="group hover:bg-zinc-900/30 transition-all">
                    <td className="px-8 py-5 whitespace-nowrap">
                       <div className="flex flex-col">
                          <span className="text-white font-bold text-[11px] uppercase tracking-wide">{user.orgName}</span>
                          <span className="text-[8px] font-mono text-zinc-600 mt-1">{user.tenantNodeId}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-[10px] text-zinc-400 font-medium">{user.email}</td>
                    <td className="px-8 py-5">
                       <button 
                        onClick={() => handleToggleStatus(user)}
                        className={`mx-auto flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase transition-all ${
                          user.status === 'active' 
                          ? 'bg-orange-500/5 border-orange-500/30 text-orange-500' 
                          : 'bg-zinc-800/50 border-zinc-700 text-zinc-600'
                        }`}
                       >
                         <div className={`h-1 w-1 rounded-full ${user.status === 'active' ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]' : 'bg-zinc-600'}`} />
                         {user.status}
                       </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDeleteUser(user)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}