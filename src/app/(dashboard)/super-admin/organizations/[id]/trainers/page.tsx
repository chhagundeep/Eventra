"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserCog, ArrowLeft, Search, Plus, 
  Mail, Phone, Shield, MoreVertical, Trash2 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

export default function OrganizationTrainers() {
  const { id } = useParams();
  const router = useRouter();
  const [trainers, setTrainers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Query: Users where orgId matches AND role is 'trainer'
    const q = query(
      collection(db, "users"), 
      where("orgId", "==", id),
      where("role", "==", "trainer")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trainerData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrainers(trainerData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const filteredTrainers = trainers.filter(t => 
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
              Authorized <span className="text-orange-600">Trainers</span>
            </h2>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">
              Management Portal / Node {id?.slice(0,8)}...
            </p>
          </div>
        </div>

        <button className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-900/20 transition-all flex items-center justify-center gap-3">
          <Plus size={18} strokeWidth={3} /> Onboard Trainer
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" size={18} />
        <input 
          type="text"
          placeholder="Search trainers by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-orange-600/50 transition-all w-full"
        />
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] animate-pulse">Retrieving encrypted trainer data...</p>
          ) : filteredTrainers.length === 0 ? (
            <div className="col-span-full py-20 border-2 border-dashed border-zinc-800 rounded-[3rem] text-center">
              <UserCog size={48} className="mx-auto text-zinc-800 mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No trainers assigned to this node</p>
            </div>
          ) : (
            filteredTrainers.map((trainer) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={trainer.id}
                className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem] group hover:border-orange-600/30 transition-all relative overflow-hidden"
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-zinc-800 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                      {trainer.photoURL ? (
                        <img src={trainer.photoURL} alt="" className="h-full w-full object-cover rounded-2xl" />
                      ) : (
                        <UserCog size={24} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg tracking-tight">{trainer.name || "Unnamed Trainer"}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified Specialist</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="mt-8 space-y-3 relative z-10">
                  <div className="flex items-center gap-3 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    <Mail size={14} className="text-orange-500/50" />
                    <span className="text-xs font-medium truncate">{trainer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Phone size={14} className="text-orange-500/50" />
                    <span className="text-xs font-medium">{trainer.phone || "No contact linked"}</span>
                  </div>
                </div>

                {/* Decorative background element */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <UserCog size={120} />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}