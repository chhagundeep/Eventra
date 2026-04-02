"use client";
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Clock, Users, Trash2, Zap, Banknote } from "lucide-react";

interface SlotListProps {
  eventId: string;
  tenantId: string;
  price: number;
}

export default function SlotList({ eventId, tenantId, price }: SlotListProps) {
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    if (!tenantId || !eventId) return;

    const slotsRef = collection(db, "tenants", tenantId, "events", eventId, "slots");
    const q = query(slotsRef, orderBy("startTime", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSlots(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [eventId, tenantId]);

  const deleteSlot = async (slotId: string) => {
    try {
      await deleteDoc(doc(db, "tenants", tenantId, "events", eventId, "slots", slotId));
    } catch (error) {
      console.error("Purge failed for slot:", error);
    }
  };

  return (
    <div className="space-y-4">
      {slots.length === 0 && (
        <div className="p-16 border-2 border-dashed border-zinc-900 rounded-[2.5rem] text-center">
          <p className="text-zinc-700 font-black uppercase text-[10px] tracking-[0.3em]">No Active Slots in Infrastructure</p>
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

          <div className="flex items-center gap-8 lg:gap-16">
            <div className="text-right">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Payload</p>
              <div className="flex items-center justify-end gap-2 text-zinc-300">
                <Users size={12} className="text-orange-600" />
                <span className="text-xs font-black italic">{slot.availableSeats} / {slot.capacity}</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Slot Revenue</p>
              <div className="flex items-center justify-end gap-2 text-orange-500">
                <Banknote size={12} />
                <span className="text-xs font-black italic">Rs.{(slot.capacity - slot.availableSeats) * price}</span>
              </div>
            </div>

            <button 
              onClick={() => deleteSlot(slot.id)} 
              className="p-3 bg-zinc-950 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}