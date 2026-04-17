"use client";

import React, { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, Zap, Calendar, Clock, Users, Save } from "lucide-react";
import toast from "react-hot-toast";
import { Slot } from "@/types";

interface CreateSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  tenantId: string;
  trainerId: string; // Added to match new Slot schema
  defaultCapacity: number;
  initialData?: Slot | null;
}

export default function CreateSlotModal({ 
  isOpen, 
  onClose, 
  eventId, 
  tenantId, 
  trainerId, // Use this in handleSubmit
  defaultCapacity,
  initialData 
}: CreateSlotModalProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState(defaultCapacity);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const start = initialData.startTime.toDate();
        const end = initialData.endTime.toDate();

        setDate(start.toISOString().split("T")[0]);
        setStartTime(start.toTimeString().slice(0, 5));
        setEndTime(end.toTimeString().slice(0, 5));
        setCapacity(initialData.capacity);
      } else {
        setDate("");
        setStartTime("");
        setEndTime("");
        setCapacity(defaultCapacity);
      }
    }
  }, [isOpen, initialData, defaultCapacity]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (end <= start) {
      toast.error("Operation Failed: End time must be after start time.");
      return;
    }

    setLoading(true);

    try {
      // Build the data object based on our Slot interface
      const slotData: Partial<Slot> = {
        eventId,
        tenantId,
        trainerId,
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        capacity: Number(capacity),
        // If editing, keep the existing availableSeats logic or adjust proportionately
        availableSeats: initialData ? initialData.availableSeats : Number(capacity), 
        status: "active",
        updatedAt: Timestamp.now(),
      };

      if (initialData?.id) {
        const slotRef = doc(db, "tenants", tenantId, "events", eventId, "slots", initialData.id);
        await updateDoc(slotRef, slotData);
        toast.success("Infrastructure Slot Updated.");
      } else {
        await addDoc(
          collection(db, "tenants", tenantId, "events", eventId, "slots"), 
          { ...slotData, createdAt: Timestamp.now() }
        );
        toast.success("Infrastructure Slot Initialized.");
      }
      
      onClose();
    } catch (error) {
      console.error("Slot operation failed:", error);
      toast.error("Critical: Slot deployment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-950 w-full max-w-md border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-8 border-b border-zinc-900 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-tighter italic text-orange-600">
            {initialData ? "Reconfigure" : "Deploy"}{" "}
            <span className="text-white">{initialData ? "Slot" : "New Slot"}</span>
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-500"
          >
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
              <Calendar size={14} className="text-orange-500"/> Sequence Date
            </label>
            <input 
              type="date" 
              required 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-600 outline-none transition-all text-white cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Clock size={14} className="text-orange-500"/> Start
              </label>
              <input 
                type="time" 
                required 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-600 outline-none transition-all text-white cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Clock size={14} className="text-orange-500"/> End
              </label>
              <input 
                type="time" 
                required 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-600 outline-none transition-all text-white cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
              <Users size={14} className="text-orange-500"/> Capacity Payload
            </label>
            <input 
              type="number" 
              required 
              min="1"
              value={capacity} 
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm focus:border-orange-600 outline-none transition-all text-white"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Synchronizing...
              </span>
            ) : (
              <>
                {initialData ? <Save size={16} fill="black"/> : <Zap size={16} fill="black"/>} 
                {initialData ? "Update Infrastructure" : "Initialize Slot"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}