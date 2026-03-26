"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, UserPlus, Trash2, 
  ArrowUpRight, Loader2, KeyRound, User
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import AddTrainerDrawer from "@/components/modals/AddTrainerDrawer";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Updated to handle folder-based publicIds and Cloudinary versioning
const getCloudinaryUrl = (publicId: string) => {
  if (!publicId || publicId === "sample_avatar") {
    return "https://res.cloudinary.com/dfxae9jrx/image/upload/v1711464455/sample_avatar.png"; 
  }
  // Cloudinary automatically handles slashes in publicId (e.g., Eventra/xyz)
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_100,h_100,g_face/v1/${publicId}`;
};

export default function TrainerManagementPage() {
  const { tenantId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    const trainersRef = collection(db, "tenants", tenantId, "trainers");
    const q = query(trainersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrainers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const filteredTrainers = trainers.filter((t) =>
    (t.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (t.specialization?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!tenantId || !confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await deleteDoc(doc(db, "tenants", tenantId, "trainers", id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 pt-20 lg:pt-8 min-h-screen bg-black">
      {/* --- TOP BAR --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-zinc-900/40 p-5 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] border border-zinc-800/50 shadow-sm">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight italic uppercase">Team Management</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Admin / Staff Node {tenantId && <span className="text-orange-600/50 ml-2">ID: {tenantId}</span>}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or skill..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-600/50 transition-all w-full lg:w-64"
            />
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 hover:text-white transition-all duration-300"
          >
            <UserPlus size={18} /> 
            <span className="whitespace-nowrap">Add Member</span>
          </button>
        </div>
      </div>

      {/* --- TABLE CONTAINER --- */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto scrollbar-hide"> 
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Name / Profile</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Specialization</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Email Address</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Phone</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="animate-spin text-zinc-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredTrainers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-zinc-500">
                      <User size={40} strokeWidth={1} />
                      <p className="text-sm font-medium uppercase tracking-widest">No team members found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrainers.map((trainer, index) => (
                  <motion.tr 
                    key={trainer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="relative h-10 w-10 flex-shrink-0 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900">
                          {/* Use unoptimized to avoid Next.js Image Config issues during testing */}
                          <Image 
                            src={getCloudinaryUrl(trainer.imgId)} 
                            alt={trainer.name} 
                            fill 
                            unoptimized
                            className="object-cover" 
                          />
                        </div>
                        <span className="font-bold text-white text-sm">{trainer.name}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="text-zinc-400 text-sm italic">{trainer.specialization || "General Staff"}</span>
                    </td>
                    <td className="p-5 text-zinc-400 text-sm font-medium">{trainer.email}</td>
                    <td className="p-5 text-zinc-400 text-sm font-medium">{trainer.phone}</td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200">
                        <button 
                          title="View Access Key"
                          onClick={() => alert(`Temporary Password: ${trainer.password}`)}
                          className="h-9 w-9 flex items-center justify-center bg-zinc-800 hover:bg-blue-600 text-white rounded-lg transition-all"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button className="h-9 w-9 flex items-center justify-center bg-zinc-800 hover:bg-orange-600 text-white rounded-lg transition-all">
                          <ArrowUpRight size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(trainer.id)}
                          className="h-9 w-9 flex items-center justify-center bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddTrainerDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={() => {
          setIsDrawerOpen(false);
          // Optional: Trigger a toast notification here
        }} 
      />
    </div>
  );
}