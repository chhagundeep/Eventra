"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  ArrowLeft, Users, Calendar, Clock, MapPin, 
  TrendingUp, Ticket, Edit3, Trash2, 
  Zap, Navigation
} from "lucide-react";
import toast from "react-hot-toast";

// Modals
import CreateEventModal from "@/components/modals/CreateEventModal";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import CreateSlotModal from "@/components/modals/CreateSlotModal";

// Sub-components
import SlotList from "@/components/slots/SlotList";
import { EventraEvent, Trainer, Slot } from "@/types";

interface PageProps {
  params: Promise<{ id: string; eventId: string }>;
}

// --- REFINED ID EXTRACTION ---
const extractIdFromUrl = (url: string) => {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathWithExtension = parts[1].replace(/^v\d+\//, '');
    return pathWithExtension.split('.')[0];
  } catch (error) {
    return null;
  }
};

export default function SuperAdminEventDeepDivePage({ params }: PageProps) {
  const { id: organizationId, eventId } = use(params);
  const router = useRouter();
  
  const [event, setEvent] = useState<EventraEvent | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // Slot Editing State
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Slideshow State
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Trainers for this specific organization
  const fetchTrainers = useCallback(async () => {
    if (!organizationId) return;
    try {
      const trainersRef = collection(db, "tenants", organizationId, "trainers");
      const snap = await getDocs(trainersRef);
      setTrainers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trainer)));
    } catch (error) {
      console.error("Critical: Failed to fetch trainers for node:", error);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId || !eventId) return;

    fetchTrainers(); 

    const eventRef = doc(db, "tenants", organizationId, "events", eventId);
    const unsubscribe = onSnapshot(eventRef, (docSnap) => {
      if (docSnap.exists()) {
        setEvent({ id: docSnap.id, ...docSnap.data() } as EventraEvent);
      } else {
        router.push(`/super-admin/organizations/${organizationId}/events`);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [organizationId, eventId, router, fetchTrainers]);

  // 2. Slideshow Logic
  useEffect(() => {
    const images = event?.images || [];
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % images.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [event?.images]);

  // 3. Purge Logic
  const handleConfirmDelete = async () => {
    if (!organizationId || !eventId || !event) return;
    setIsDeleting(true);

    try {
      if (event.images && event.images.length > 0) {
        const publicIds = event.images.map(url => extractIdFromUrl(url)).filter(Boolean) as string[];
        if (publicIds.length > 0) {
          await fetch("/api/admin/delete-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicIds }),
          });
        }
      }

      await Promise.all([
        deleteDoc(doc(db, "tenants", organizationId, "events", eventId)),
        deleteDoc(doc(db, "publicEvents", eventId))
      ]);
      
      toast.success("Infrastructure node purged.");
      router.push(`/super-admin/organizations/${organizationId}/events`);
    } catch (error) {
      toast.error("Purge protocol failed.");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-black">
      <Zap className="animate-pulse text-orange-600" size={40} />
    </div>
  );

  const images = event?.images || [];

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-8 font-sans">
      {/* HEADER AREA */}
      <div className="max-w-[1600px] mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <button 
            onClick={() => router.push(`/super-admin/organizations/${organizationId}/events`)}
            className="flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-all uppercase text-[10px] font-black tracking-[0.2em]"
          >
            <ArrowLeft size={14} /> Return to Organization Node
          </button>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            Super <span className="text-orange-600">Deep-Dive</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setSelectedSlot(null); // Ensure fresh form
              setIsSlotModalOpen(true);
            }}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20"
          >
            <Zap size={14} fill="black" /> Deploy Slot
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Edit3 size={14} /> Edit Node
          </button>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-6 py-3 bg-red-950/20 hover:bg-red-600 border border-red-900/50 text-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Trash2 size={14} /> Purge Node
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden group">
            <div className="h-[450px] relative overflow-hidden bg-zinc-900">
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                      idx === currentImgIdx ? "opacity-60 scale-100" : "opacity-0 scale-110"
                    }`}
                    alt=""
                  />
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-800 font-black tracking-widest">NO MEDIA DETECTED</div>
              )}
              
              <div className="absolute bottom-10 right-10 flex gap-2 z-20">
                {images.map((_, i) => (
                  <div key={i} className={`h-1.5 transition-all duration-500 rounded-full ${i === currentImgIdx ? "w-8 bg-orange-600" : "w-2 bg-zinc-700"}`} />
                ))}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-10 z-10">
                <span className="px-4 py-1 bg-orange-600 text-[10px] font-black uppercase tracking-widest rounded-lg mb-4 inline-block">
                  {event?.category || "Infrastructure"}
                </span>
                <h2 className="text-6xl font-black uppercase tracking-tighter leading-none">{event?.title}</h2>
              </div>
            </div>
            
            <div className="p-10 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-zinc-900">
                <DetailItem icon={<Calendar size={18}/>} label="Deployment Date" value={event?.date} />
                <DetailItem icon={<MapPin size={18}/>} label="Location" value={event?.locationName || "Remote Node"} />
                <DetailItem icon={<Users size={18}/>} label="Capacity" value={`${event?.capacity} Max`} />
                <DetailItem icon={<Ticket size={18} className="text-orange-500"/>} label="Base Unit Price" value={`Rs. ${event?.price || 0}`} />
            </div>

            <div className="px-10 pb-6 flex items-center gap-4">
               <div className="flex items-center gap-3 bg-zinc-900/30 px-4 py-2 rounded-xl border border-zinc-800/50">
                 <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">GPS_LAT</span>
                 <span className="text-[10px] font-mono text-zinc-500">{event?.latitude || "0.00"}</span>
               </div>
               <div className="flex items-center gap-3 bg-zinc-900/30 px-4 py-2 rounded-xl border border-zinc-800/50">
                 <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest">GPS_LONG</span>
                 <span className="text-[10px] font-mono text-zinc-500">{event?.longitude || "0.00"}</span>
               </div>
               {event?.latitude && event?.longitude && (
                 <a 
                   href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="text-orange-500 hover:text-white transition-colors"
                 >
                   <Navigation size={16} />
                 </a>
               )}
            </div>

            <div className="px-10 pb-10">
               <p className="text-zinc-500 leading-relaxed font-medium italic border-l-2 border-orange-600 pl-6">
                "{event?.description}"
               </p>
            </div>
          </div>

          <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-900">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-orange-600 mb-8 flex items-center gap-2">
                <Clock size={16} /> Active Operational Slots
             </h3>
             <SlotList 
                eventId={eventId} 
                tenantId={organizationId} 
                price={event?.price || 0}
                onEdit={(slot) => {
                  setSelectedSlot(slot);
                  setIsSlotModalOpen(true);
                }}
             />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <AnalyticsCard title="Registry Utilization" value="75%" sub="Active Payload" color="text-orange-500" />

          <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-900 relative overflow-hidden group">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">Projected Revenue</h3>
            <div className="flex items-end gap-2 h-24 mb-6">
                {[30, 60, 45, 90, 70, 40, 85].map((h, i) => (
                  <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-zinc-900 group-hover:bg-orange-600/20 transition-all rounded-t-md relative">
                     <div className="absolute bottom-0 w-full bg-orange-600 h-1 rounded-full opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
            </div>
            <div className="flex justify-between items-center">
               <span className="text-3xl font-black italic tracking-tighter">Rs.{(event?.price || 0) * (event?.capacity || 0) * 0.75}</span>
               <TrendingUp className="text-orange-500" />
            </div>
          </div>

          <div className="bg-orange-600 p-8 rounded-[2.5rem] text-black shadow-[0_0_40px_rgba(234,88,12,0.2)]">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-black text-orange-600 rounded-xl">
                    <Zap size={20} fill="currentColor" />
                </div>
                <h4 className="font-black uppercase tracking-widest text-[10px]">Primary Resource</h4>
             </div>
             <p className="text-xl font-black uppercase tracking-tighter leading-tight">
                Assigned Specialist: <br />
                {event?.trainerId ? (trainers.find(t => t.id === event.trainerId)?.name || "Resource Active") : "Unassigned"}
             </p>
          </div>
        </div>
      </div>

      <CreateEventModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        tenantId={organizationId}
        initialData={event || undefined} 
        trainers={trainers} 
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={event?.title || ""}
        loading={isDeleting}
      />

      <CreateSlotModal 
        isOpen={isSlotModalOpen}
        onClose={() => {
          setIsSlotModalOpen(false);
          setSelectedSlot(null);
        }}
        eventId={eventId}
        tenantId={organizationId}
        trainerId={event?.trainerId || ""}
        defaultCapacity={event?.capacity || 0}
        initialData={selectedSlot}
      />
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: any }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-zinc-600 uppercase text-[8px] font-black tracking-widest">
        {icon} {label}
      </div>
      <p className="text-sm font-bold text-zinc-200">{value || "---"}</p>
    </div>
  );
}

function AnalyticsCard({ title, value, sub, color }: any) {
  return (
    <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-900">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">{title}</p>
      <h3 className={`text-5xl font-black italic tracking-tighter ${color}`}>{value}</h3>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">{sub}</p>
    </div>
  );
}