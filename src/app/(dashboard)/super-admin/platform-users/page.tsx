"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Search, 
  ArrowUpRight, Activity, AlertTriangle, Trash2
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collectionGroup, onSnapshot, query, where, collection, doc, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function PlatformUsers() {
  const [activeTab, setActiveTab] = useState<"admins" | "trainers" | "users">("admins");
  const [usersData, setUsersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [existingTenants, setExistingTenants] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tenants"), (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.id));
      setExistingTenants(ids);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(true);
    const roleMap: Record<string, string> = { admins: "admin", trainers: "trainer", users: "user" };
    const q = query(collectionGroup(db, "users"), where("role", "==", roleMap[activeTab]));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnap => {
        const rawData = docSnap.data();
        const path = docSnap.ref.path;
        const pathSegments = path.split('/');
        const tenantId = path.includes('tenants') ? pathSegments[1] : "Global System";
        const isGhostNode = path.includes('tenants') && !existingTenants.has(tenantId);

        return {
          id: docSnap.id,
          ...rawData,
          path, // Store full path for deletion
          isGhostNode,
          parentOrg: tenantId,
          compositeKey: `${path}-${docSnap.id}`,
          displayName: rawData.name || rawData.email?.split('@')[0] || "Unknown Node",
          displayStatus: isGhostNode ? 'orphaned' : (rawData.status || 'active')
        };
      }).filter(user => pathIncludesTenant(user.path));

      setUsersData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab, existingTenants]);

  const pathIncludesTenant = (path: string) => path.includes('tenants');

  const handlePurgeNode = async (user: any) => {
  if (!confirm(`Permanently purge orphaned node: ${user.displayName}?`)) return;
  
  try {
    // Call your API route instead of deleteDoc directly
    const response = await fetch('/api/admin/terminate-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tenantId: user.parentOrg, // e.g., "yoga-club"
        adminUid: user.id          // The UID of the admin
      }),
    });

    if (response.ok) {
      toast.success("Identity purged from Auth and Topology");
    } else {
      throw new Error("API failure");
    }
  } catch (error) {
    toast.error("Cleanup failed. Check Auth console.");
  }
};

  const filteredUsers = usersData.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.parentOrg?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none mb-2">
            Identity <span className="text-orange-600">Topology</span>
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.5em] ml-1">
            System Monitoring Node v2.2
          </p>
        </div>
        <div className="flex gap-4">
          <StatCard icon={<ShieldCheck size={18}/>} label="Active Nodes" value={usersData.filter(u => !u.isGhostNode).length} color="border-emerald-500/20" />
          <StatCard icon={<AlertTriangle size={18}/>} label="Orphaned" value={usersData.filter(u => u.isGhostNode).length} color="border-red-500/20" />
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        <div className="lg:col-span-8 flex bg-zinc-900/40 border border-zinc-800/50 p-1.5 rounded-2xl backdrop-blur-xl">
          {['admins', 'trainers', 'users'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                activeTab === tab ? "bg-orange-600 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="lg:col-span-4 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter nodes..." 
            className="w-full bg-zinc-900/20 border border-zinc-800/50 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold outline-none focus:border-orange-600/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-[2rem] overflow-hidden backdrop-blur-md">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-900/40 border-b border-zinc-800/50">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Node Identity</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Parent Org</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Role</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
              <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-zinc-500">Management</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {loading ? <LoadingSkeleton /> : filteredUsers.map((user) => (
              <tr key={user.compositeKey} className={`group transition-colors ${user.isGhostNode ? 'bg-red-950/5 hover:bg-red-950/10' : 'hover:bg-zinc-800/20'}`}>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black border ${
                      user.isGhostNode ? 'bg-red-900/20 border-red-500/50 text-red-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:border-orange-600/50'
                    }`}>
                      {user.isGhostNode ? <AlertTriangle size={14} /> : user.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-sm font-bold uppercase ${user.isGhostNode ? 'text-red-400' : 'text-zinc-100 group-hover:text-orange-500'}`}>{user.displayName}</p>
                      <p className="text-[10px] text-zinc-600 font-medium">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${user.isGhostNode ? 'border-red-900/50 text-red-500/70' : 'border-zinc-800 text-zinc-400'}`}>
                    {user.parentOrg}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{user.role}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${user.isGhostNode ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${user.isGhostNode ? 'text-red-500' : 'text-zinc-400'}`}>
                      {user.isGhostNode ? 'Orphaned Node' : 'Active'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  {user.isGhostNode ? (
                    <button onClick={() => handlePurgeNode(user)} className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button className="p-2.5 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg">
                      <ArrowUpRight size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className={`bg-zinc-900/40 border ${color} p-5 rounded-2xl min-w-[160px]`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="text-zinc-500">{icon}</div>
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
      </div>
      <p className="text-2xl font-black text-white italic">{value}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return <tr><td colSpan={5} className="py-24 text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Identity Stream...</td></tr>;
}

function EmptyState({ tab }: { tab: string }) {
  return <tr><td colSpan={5} className="py-24 text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest">No nodes detected.</td></tr>;
}