"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Clock, Users, Trash2, Banknote, Edit3 } from "lucide-react";
import { Slot } from "@/types";

// Import your custom modal
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";

interface SlotListProps {
  eventId: string;
  tenantId: string;
  price: number;
  onEdit: (slot: Slot) => void;
}

export default function SlotList({ eventId, tenantId, price, onEdit }: SlotListProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  
  // States for Custom Deletion UI
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!tenantId || !eventId) return;

    const slotsRef = collection(db, "tenants", tenantId, "events", eventId, "slots");
    const q = query(slotsRef, orderBy("startTime", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSlots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slot)));
    });
    return () => unsubscribe();
  }, [eventId, tenantId]);

  // Handle the initial click on the trash icon
  const initiateDelete = (slotId: string) => {
    setSlotToDelete(slotId);
    setIsDeleteModalOpen(true);
  };

  // Handle the actual deletion after user confirms in the Modal
  const handlePurgeConfirmed = async () => {
    if (!slotToDelete) return;
    setIsDeleting(true);
    
    try {
      await deleteDoc(doc(db, "tenants", tenantId, "events", eventId, "slots", slotToDelete));
      setIsDeleteModalOpen(false);
      setSlotToDelete(null);
    } catch (error) {
      console.error("Purge failed for slot:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {slots.length === 0 && (
        <div className="p-16 border-2 border-dashed border-zinc-900 rounded-[2.5rem] text-center">
          <p className="text-zinc-700 font-black uppercase text-[10px] tracking-[0.3em]">
            No Active Slots in Infrastructure
          </p>
        </div>
      )}
      
      {slots.map((slot) => (
        <div key={slot.id} className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-zinc-900/20 hover:bg-zinc-900/40 rounded-[2rem] border border-zinc-900 hover:border-orange-600/30 transition-all gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-zinc-950 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-widest">
                {slot.startTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — 
                {slot.endTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter mt-1">
                Sequence Date: {slot.startTime?.toDate().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <div className="text-right hidden sm:block">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Payload</p>
              <div className="flex items-center justify-end gap-2 text-zinc-300">
                <Users size={12} className="text-orange-600" />
                <span className="text-xs font-black italic">{slot.availableSeats} / {slot.capacity}</span>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Slot Revenue</p>
              <div className="flex items-center justify-end gap-2 text-orange-500">
                <Banknote size={12} />
                <span className="text-xs font-black italic">
                  Rs. {Math.max(0, (slot.capacity - (slot.availableSeats || 0)) * price)}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onEdit(slot)} 
                className="p-3 bg-zinc-950 text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all border border-transparent hover:border-orange-500/20"
              >
                <Edit3 size={18} />
              </button>
              
              <button 
                onClick={() => initiateDelete(slot.id)} 
                className="p-3 bg-zinc-950 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* RENDER THE CUSTOM MODAL HERE */}
      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSlotToDelete(null);
        }}
        onConfirm={handlePurgeConfirmed}
        title="Infrastructure Slot"
        loading={isDeleting}
      />
    </div>
  );
}