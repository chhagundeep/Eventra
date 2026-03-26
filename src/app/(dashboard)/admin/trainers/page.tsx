"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, UserPlus, Trash2, Loader2, KeyRound, X, Copy, Check, AlertTriangle, Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import AddTrainerDrawer from "@/components/modals/AddTrainerDrawer";
import EditTrainerDrawer from "@/components/modals/EditTrainerDrawer"; // Import the new Edit Drawer

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const getCloudinaryUrl = (publicId: string) => {
  if (!publicId || publicId === "sample_avatar") {
    return "https://res.cloudinary.com/dfxae9jrx/image/upload/v1711464455/sample_avatar.png"; 
  }
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,w_100,h_100,g_face/v1/${publicId}`;
};

export default function TrainerManagementPage() {
  const { tenantId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false); // State for Edit Drawer
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- UI MODAL STATES ---
  const [viewingCredentials, setViewingCredentials] = useState<any | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<any | null>(null);
  const [editingStaff, setEditingStaff] = useState<any | null>(null); // State for trainer being edited
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const trainersRef = collection(db, "tenants", tenantId, "trainers");
    const q = query(trainersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrainers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const filteredTrainers = trainers.filter((t) =>
    (t.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (t.specialization?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const confirmDelete = async () => {
    if (!tenantId || !deletingStaff) return;
    try {
      await deleteDoc(doc(db, "tenants", tenantId, "trainers", deletingStaff.id));
      setDeletingStaff(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 pt-20 lg:pt-8 min-h-screen bg-black">
      {/* --- TOP BAR --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-zinc-900/40 p-5 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] border border-zinc-800/50">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight italic uppercase">Team Management</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
  Admin / Staff Node {tenantId && <span className="text-orange-600/50 ml-2 normal-case">ID: {tenantId}</span>}
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
          <button onClick={() => setIsDrawerOpen(true)} className="flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 hover:text-white transition-all">
            <UserPlus size={18} /> Add Member
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide"> 
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                <th className="p-5">Name / Profile</th>
                <th className="p-5">Specialization</th>
                <th className="p-5">Email Address</th>
                <th className="p-5">Phone</th>
                <th className="p-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {loading ? (
                 <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin text-zinc-500 mx-auto" /></td></tr>
              ) : filteredTrainers.map((trainer) => (
                <tr key={trainer.id} className="hover:bg-white/[0.02] group transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-zinc-800">
                        <Image src={getCloudinaryUrl(trainer.imgId)} alt="" fill unoptimized className="object-cover" />
                      </div>
                      <span className="font-bold text-white text-sm">{trainer.name}</span>
                    </div>
                  </td>
                  <td className="p-5 text-zinc-400 text-sm italic">{trainer.specialization || "General"}</td>
                  <td className="p-5 text-zinc-400 text-sm">{trainer.email}</td>
                  <td className="p-5 text-zinc-400 text-sm">{trainer.phone}</td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                      {/* EDIT BUTTON */}
                      <button 
                        onClick={() => {
                          setEditingStaff(trainer);
                          setIsEditDrawerOpen(true);
                        }} 
                        className="h-9 w-9 flex items-center justify-center bg-zinc-800 hover:bg-orange-600 text-white rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>

                      {/* KEY BUTTON */}
                      <button onClick={() => setViewingCredentials(trainer)} className="h-9 w-9 flex items-center justify-center bg-zinc-800 hover:bg-blue-600 text-white rounded-lg transition-colors">
                        <KeyRound size={16} />
                      </button>

                      {/* DELETE BUTTON */}
                      <button onClick={() => setDeletingStaff(trainer)} className="h-9 w-9 flex items-center justify-center bg-zinc-800 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
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

      {/* --- DRAWERS & MODALS --- */}
      <AnimatePresence>
        {/* VIEW KEY MODAL */}
        {viewingCredentials && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-black uppercase italic text-white flex items-center gap-2 text-lg"><KeyRound className="text-orange-600" /> Staff Key</h3>
                <button onClick={() => setViewingCredentials(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <div className="bg-black border border-zinc-800 p-6 rounded-2xl flex justify-between items-center group cursor-pointer" onClick={() => copyToClipboard(viewingCredentials.password)}>
                <span className="text-2xl font-mono font-black text-orange-600 tracking-widest">{viewingCredentials.password}</span>
                {copied ? <Check className="text-green-500" /> : <Copy className="text-zinc-500 group-hover:text-white" size={20} />}
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deletingStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl overflow-hidden p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-black text-white uppercase italic">Remove {deletingStaff.name.split(' ')[0]}?</h3>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setDeletingStaff(null)} className="py-3 rounded-xl bg-zinc-800 text-white font-bold uppercase">Cancel</button>
                <button onClick={confirmDelete} className="py-3 rounded-xl bg-red-600 text-white font-bold uppercase">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD MEMBER DRAWER */}
      <AddTrainerDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={() => setIsDrawerOpen(false)} 
      />

      {/* EDIT MEMBER DRAWER */}
      <EditTrainerDrawer 
        isOpen={isEditDrawerOpen} 
        trainer={editingStaff} 
        onClose={() => {
          setIsEditDrawerOpen(false);
          setEditingStaff(null);
        }} 
        onSuccess={() => {
          setIsEditDrawerOpen(false);
          setEditingStaff(null);
        }} 
      />
    </div>
  );
}