"use client";
import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, Zap, Calendar, Clock, Users } from "lucide-react";

interface CreateSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  tenantId: string;
  defaultCapacity: number;
}

export default function CreateSlotModal({ isOpen, onClose, eventId, tenantId, defaultCapacity }: CreateSlotModalProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState(defaultCapacity);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const start = new Date(`${date}T${startTime}`);
      const end = new Date(`${date}T${endTime}`);

      const slotData = {
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        capacity: Number(capacity),
        availableSeats: Number(capacity), // Critical: Initialize availability
        status: "active",
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "tenants", tenantId, "events", eventId, "slots"), slotData);
      onClose();
    } catch (error) {
      console.error("Slot generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 w-full max-w-md border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-zinc-900 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-tighter italic text-orange-600">Deploy <span className="text-white">New Slot</span></h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-500"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
              <Calendar size={12}/> Sequence Date
            </label>
            <input 
              type="date" required value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-600 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Clock size={12}/> Start
              </label>
              <input 
                type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Clock size={12}/> End
              </label>
              <input 
                type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
              <Users size={12}/> Capacity Payload
            </label>
            <input 
              type="number" required value={capacity} onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-600 outline-none transition-all"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : <><Zap size={16} fill="black"/> Initialize Slot</>}
          </button>
        </form>
      </div>
    </div>
  );
}