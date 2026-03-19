"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, ArrowLeft, Search, Filter, 
  Mail, Calendar, MoreVertical, ShieldCheck,
  UserPlus, Download, CheckCircle2, Clock
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function OrganizationUsers() {
  const { id } = useParams();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Fetch users belonging to this specific orgId with role 'user'
    const q = query(
      collection(db, "users"), 
      where("orgId", "==", id),
      where("role", "==", "user")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
              Member <span className="text-orange-600">Directory</span>
            </h2>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">
              Node Infrastructure / Internal Database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">
            <Download size={16} /> Export CSV
          </button>
          <button className="flex-1 lg:flex-none bg-white text-black px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-3">
            <UserPlus size={18} strokeWidth={3} /> Add Member
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by identity or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-orange-600/50 transition-all w-full"
          />
        </div>
        <button className="px-6 py-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all flex items-center gap-2">
          <Filter size={18} /> <span className="text-[10px] font-black uppercase">Filter</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-800/50 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 bg-zinc-900/40">
                <th className="px-8 py-6">Member Identity</th>
                <th className="px-6 py-6">Status</th>
                <th className="px-6 py-6">Join Date</th>
                <th className="px-6 py-6">Last Activity</th>
                <th className="px-8 py-6 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={user.id} 
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:bg-zinc-700 transition-colors">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm tracking-tight">{user.name || "Guest User"}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase truncate max-w-[150px]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                        <Calendar size={14} className="text-zinc-600" />
                        {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs font-medium">
                        <Clock size={14} />
                        Recently
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {loading && (
            <div className="p-20 text-center text-zinc-600 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">
              Syncing global user records...
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="p-20 text-center">
              <Users size={40} className="mx-auto text-zinc-800 mb-4" />
              <p className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest">No members found in this node</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}