"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserCog, ArrowLeft, Search, Plus, 
  Mail, Phone, Shield, MoreVertical, 
  Edit2, Trash2, Filter, Activity
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Trainer, trainerFromFirestoreDoc, trainerDisplayName, formatTrainerPrice } from "@/types";

// --- COMPONENTS ---
import EditTrainerDrawer from "@/components/modals/EditTrainerDrawer";
import DeleteModal from "@/components/DeleteModal"; 
import AddTrainerDrawer from "@/components/modals/AddTrainerDrawer";

export default function OrganizationTrainers() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const trainersRef = collection(db, "tenants", id, "trainers");
    const unsubscribe = onSnapshot(trainersRef, (snapshot) => {
      const trainerData = snapshot.docs.map((d) =>
        trainerFromFirestoreDoc(d.id, d.data() as Record<string, unknown>)
      );
      setTrainers(trainerData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      toast.error("Cloud Sync Error: Connection lost");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleDeleteConfirm = async () => {
    if (!selectedTrainer || !id) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "tenants", id, "trainers", selectedTrainer.id));
      toast.success("Trainer record purged successfully");
      setIsDeleteOpen(false);
      setSelectedTrainer(null);
    } catch (error) {
      toast.error("Critical: Deletion failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredTrainers = trainers.filter(t => {
    const search = searchTerm.toLowerCase();
    return (
      trainerDisplayName(t).toLowerCase().includes(search) ||
      t.email?.toLowerCase().includes(search) ||
      t.phone?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-8 pb-10">
      <AddTrainerDrawer 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={() => setIsAddOpen(false)} 
        tenantId={id} 
      />
      
      <EditTrainerDrawer 
        isOpen={isEditOpen} 
        trainer={selectedTrainer} 
        tenantId={id} 
        onClose={() => { setIsEditOpen(false); setSelectedTrainer(null); }} 
        onSuccess={() => setIsEditOpen(false)} 
      />

      <DeleteModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        orgName={selectedTrainer ? trainerDisplayName(selectedTrainer) : "this staff member"}
        loading={deleteLoading}
        title="Revoke Staff Access?"
      />

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
              Authorized <span className="text-orange-600">Trainers</span>
            </h2>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">
              Node Management / ID: {id?.slice(0, 8)}...
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsAddOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Onboard Staff
        </button>
      </div>

      {/* --- UPDATED FILTER BLOCK --- */}
      <div className="bg-zinc-900/30 border border-zinc-800/60 p-5 rounded-[2rem] backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center text-orange-500">
                <Filter size={18} />
             </div>
             <div>
                <p className="text-[10px] font-black text-white uppercase tracking-widest">Registry Filter</p>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Scanning {trainers.length} Personnel Records</p>
             </div>
          </div>

          <div className="relative group flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search by name, email, or digital signature (phone)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/40 border border-zinc-800 rounded-xl py-3 pl-12 pr-6 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-600/40 focus:ring-1 focus:ring-orange-600/10 transition-all w-full"
            />
          </div>

          <div className="hidden lg:flex items-center gap-4 px-4 border-l border-zinc-800/50 ml-2">
             <div className="text-right">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Signal Status</p>
                <div className="flex items-center gap-2 justify-end">
                   <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Sync</span>
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="col-span-full py-10 flex flex-col items-center gap-4">
               <div className="h-1 w-32 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="h-full w-1/2 bg-orange-600" />
               </div>
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Accessing Node...</p>
            </div>
          ) : filteredTrainers.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 border-2 border-dashed border-zinc-800 rounded-[3rem] text-center">
              <UserCog size={48} className="mx-auto text-zinc-800 mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No records found for &quot;{searchTerm}&quot;</p>
            </motion.div>
          ) : (
            filteredTrainers.map((trainer) => (
              <motion.div 
                layout
                key={trainer.id}
                className={`bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem] group hover:border-orange-600/30 transition-all relative overflow-visible backdrop-blur-sm shadow-xl ${
                  activeMenuId === trainer.id ? "z-30" : "z-10"
                }`}
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-orange-500 overflow-hidden border border-zinc-700/50 shadow-inner relative">
                      {trainer.image ? (
                        <img 
                          src={trainer.image} 
                          alt={trainerDisplayName(trainer)} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCog size={28} />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-white text-lg tracking-tight truncate max-w-[150px]">
                        {trainerDisplayName(trainer) || "Unknown"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === trainer.id ? null : trainer.id);
                      }}
                      className="p-2 text-zinc-600 hover:text-white transition-colors bg-zinc-800/50 rounded-xl relative z-50"
                    >
                      <MoreVertical size={20} />
                    </button>

                    <AnimatePresence>
                      {activeMenuId === trainer.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                            }} 
                          />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-48 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl p-2 z-[100] overflow-hidden"
                          >
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrainer(trainer);
                                setIsEditOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="flex items-center gap-3 w-full p-3 text-[10px] font-black uppercase text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
                            >
                              <Edit2 size={14} className="text-orange-600" /> Edit Profile
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrainer(trainer);
                                setIsDeleteOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="flex items-center gap-3 w-full p-3 text-[10px] font-black uppercase text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 size={14} /> Terminate
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-8 space-y-3 relative z-0">
                  <div className="flex items-center gap-3 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    <div className="h-8 w-8 rounded-xl bg-black/20 flex items-center justify-center border border-zinc-800/50">
                        <Mail size={14} className="text-orange-500/50" />
                    </div>
                    <span className="text-xs font-medium truncate lowercase">{trainer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <div className="h-8 w-8 rounded-xl bg-black/20 flex items-center justify-center border border-zinc-800/50">
                        <Phone size={14} className="text-orange-500/50" />
                    </div>
                    <span className="text-xs font-medium tracking-tighter">{trainer.phone || "No contact linked"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <div className="h-8 w-8 rounded-xl bg-black/20 flex items-center justify-center border border-zinc-800/50">
                        <Activity size={14} className="text-orange-500/50" />
                    </div>
                    <span className="text-xs font-medium tracking-tighter">
                      {trainer.experience ? `Experience: ${trainer.experience}` : "Experience: —"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-orange-500/90">
                    <div className="h-8 w-8 rounded-xl bg-black/20 flex items-center justify-center border border-zinc-800/50">
                        <span className="text-[10px] font-black">₹</span>
                    </div>
                    <span className="text-xs font-bold tracking-tighter">
                      Personal: {formatTrainerPrice(trainer.price)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}