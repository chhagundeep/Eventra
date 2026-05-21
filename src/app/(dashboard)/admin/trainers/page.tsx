"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, UserPlus, Trash2, Loader2, KeyRound, X, Copy, Check, AlertTriangle, Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { 
  collection, onSnapshot, query, orderBy, doc, deleteDoc, getDocs, where 
} from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Trainer, trainerFromFirestoreDoc, trainerDisplayName, formatTrainerPrice } from "@/types";
import AddTrainerDrawer from "@/components/modals/AddTrainerDrawer";
import EditTrainerDrawer from "@/components/modals/EditTrainerDrawer";
import DeleteModal from "@/components/DeleteModal";

// Standardized fallback for profiles
const DEFAULT_AVATAR = "https://res.cloudinary.com/dfxae9jrx/image/upload/v1711464455/sample_avatar.png";

export default function TrainerManagementPage() {
  const { tenantId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]); // Typed correctly
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- UI MODAL STATES ---
  const [viewingCredentials, setViewingCredentials] = useState<Trainer | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Trainer | null>(null);
  const [restrictionMessage, setRestrictionMessage] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<Trainer | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    
    // Correct Path: Nested within the tenant cluster
    const trainersRef = collection(db, "tenants", tenantId, "trainers");
    const q = query(trainersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrainers(
        snapshot.docs.map((d) =>
          trainerFromFirestoreDoc(d.id, d.data() as Record<string, unknown>)
        )
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const filteredTrainers = trainers.filter((t) =>
    trainerDisplayName(t).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  // --- DELETE LOGIC ---
  const handleInitiateDelete = async (trainer: Trainer) => {
    if (!tenantId) return;
    setRestrictionMessage(null); 
    
    try {
      // Check if trainer is linked to any events within this tenant
      const eventsRef = collection(db, "tenants", tenantId, "events");
      const q = query(eventsRef, where("trainerId", "==", trainer.uid)); // Check by Auth UID
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const linkedEvent = querySnapshot.docs[0].data().title || "an active event";
        setRestrictionMessage(
          `${trainerDisplayName(trainer)} is assigned to "${linkedEvent}". Reassign the event before removal.`
        );
      }
      setDeletingStaff(trainer);
    } catch (err) {
      console.error("Integrity check failed:", err);
    }
  };

  const confirmDelete = async () => {
    if (!tenantId || !deletingStaff) return;
    setIsDeleting(true);

    try {
      // Delete from tenant sub-collection
      await deleteDoc(doc(db, "tenants", tenantId, "trainers", deletingStaff.id));
      
      // Note: You might also want to call your API to delete the root 'users' doc 
      // and Auth account, but for now, we remove them from the tenant view.
      
      setDeletingStaff(null);
    } catch (err) {
      console.error("Deletion failed:", err);
    } finally {
      setIsDeleting(false);
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-zinc-900/40 p-5 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] border border-zinc-800/50 shadow-2xl">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight italic uppercase">Team Management</h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Cluster Node / Staff Registry
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Filter by name..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-orange-600 transition-all w-full lg:w-72"
            />
          </div>
          <button onClick={() => setIsDrawerOpen(true)} className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5">
            <UserPlus size={18} /> Onboard Staff
          </button>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide"> 
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                <th className="p-6">Identity</th>
                <th className="p-6">Status</th>
                <th className="p-6">Contact Info</th>
                <th className="p-6 text-right">Node Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {loading ? (
                 <tr><td colSpan={4} className="p-24 text-center"><Loader2 className="animate-spin text-orange-600 mx-auto" /></td></tr>
              ) : filteredTrainers.map((trainer) => (
                <tr key={trainer.id} className="hover:bg-white/[0.02] group transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 rounded-2xl overflow-hidden border border-white/5 bg-zinc-800">
                        <Image 
                          src={trainer.image || DEFAULT_AVATAR} 
                          alt={trainerDisplayName(trainer)} 
                          fill 
                          unoptimized 
                          className="object-cover" 
                        />
                      </div>
                      <div>
                        <span className="font-black text-white text-sm uppercase italic tracking-tight block">{trainerDisplayName(trainer)}</span>
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">ID: {trainer.uid.slice(0, 8)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${trainer.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                      {trainer.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <p className="text-zinc-300 text-sm font-medium">{trainer.email}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{trainer.phone}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {trainer.experience ? `Experience: ${trainer.experience}` : "Experience: —"}
                    </p>
                    <p className="text-orange-500/90 text-xs font-bold mt-0.5">
                      Personal Training Price: {formatTrainerPrice(trainer.price)}
                    </p>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingStaff(trainer); setIsEditDrawerOpen(true); }} className="h-10 w-10 flex items-center justify-center bg-zinc-900 border border-white/5 hover:border-orange-600/50 hover:bg-orange-600/10 text-zinc-400 hover:text-orange-500 rounded-xl transition-all">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => setViewingCredentials(trainer)} className="h-10 w-10 flex items-center justify-center bg-zinc-900 border border-white/5 hover:border-blue-600/50 hover:bg-blue-600/10 text-zinc-400 hover:text-blue-500 rounded-xl transition-all">
                        <KeyRound size={16} />
                      </button>
                      <button onClick={() => handleInitiateDelete(trainer)} className="h-10 w-10 flex items-center justify-center bg-zinc-900 border border-white/5 hover:border-red-600/50 hover:bg-red-600/10 text-zinc-400 hover:text-red-500 rounded-xl transition-all">
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

      {/* --- MODALS --- */}
      <AnimatePresence>
        {viewingCredentials && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/5 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-black uppercase italic text-white flex items-center gap-2 text-lg">Staff Access Key</h3>
                <button onClick={() => setViewingCredentials(null)} className="text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl flex flex-col items-center gap-4 group cursor-pointer hover:bg-zinc-900 transition-all" onClick={() => copyToClipboard((viewingCredentials as any).password)}>
                <span className="text-4xl font-mono font-black text-orange-600 tracking-[0.3em] uppercase">{(viewingCredentials as any).password || "NO-KEY"}</span>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  {copied ? <><Check size={12} className="text-green-500" /> Key Copied</> : <><Copy size={12} /> Tap to Sync Clipboard</>}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {deletingStaff && (
          <DeleteModal 
            isOpen={!!deletingStaff}
            onClose={() => { setDeletingStaff(null); setRestrictionMessage(null); }}
            onConfirm={confirmDelete}
            title={restrictionMessage ? "Node Lock" : "Purge Staff Node?"}
            orgName={trainerDisplayName(deletingStaff)}
            loading={isDeleting}
            description={
              restrictionMessage ? (
                <div className="flex flex-col items-center text-center gap-4 py-2">
                  <div className="h-12 w-12 bg-orange-600/10 rounded-full flex items-center justify-center">
                    <AlertTriangle className="text-orange-600" size={24} />
                  </div>
                  <p className="text-white text-xs font-bold uppercase tracking-tight leading-relaxed">{restrictionMessage}</p>
                </div>
              ) : null
            }
            isRestricted={!!restrictionMessage} 
          />
        )}
      </AnimatePresence>

      <AddTrainerDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onSuccess={() => setIsDrawerOpen(false)} tenantId={tenantId || ""} />
      <EditTrainerDrawer 
        isOpen={isEditDrawerOpen} 
        trainer={editingStaff} 
        onClose={() => { setIsEditDrawerOpen(false); setEditingStaff(null); }} 
        onSuccess={() => { setIsEditDrawerOpen(false); setEditingStaff(null); }} 
      />
    </div>
  );
}