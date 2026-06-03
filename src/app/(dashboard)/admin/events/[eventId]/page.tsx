"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft, Users, Calendar, Clock, MapPin, 
  TrendingUp, Ticket, Edit3, Trash2, Zap, Tag, Navigation
} from "lucide-react";
import toast from "react-hot-toast";

// Modals
import CreateEventModal from "@/components/modals/CreateEventModal";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import CreateSlotModal from "@/components/modals/CreateSlotModal";

// Sub-components
import SlotList from "@/components/slots/SlotList";
import { EventraEvent, Trainer, trainerFromFirestoreDoc, trainerDisplayName } from "@/types";
import { useDashboardTheme } from "@/contexts/DashboardThemeContext";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

// --- HELPER: CLOUDINARY ID EXTRACTION ---
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

export default function AdminEventDetailPage({ params }: PageProps) {
  const { eventId } = use(params);
  const router = useRouter();
  const { tenantId } = useAuth();
  const { isDark } = useDashboardTheme();
  
  const [event, setEvent] = useState<EventraEvent | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]); 
  const [categoryLabel, setCategoryLabel] = useState<string>("General");
  const [loading, setLoading] = useState(true);
  
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Categories to map the ID to a readable Name
  const fetchCategoryName = useCallback(async (catId: string) => {
    try {
      const catRef = collection(db, "categories");
      const q = query(catRef, where("id", "==", catId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setCategoryLabel(snap.docs[0].data().name);
      } else {
        setCategoryLabel(catId); 
      }
    } catch (error) {
      console.error("Category lookup failed", error);
    }
  }, []);

  // 2. Real-time Event Listener & Trainers Fetch
  useEffect(() => {
    if (!tenantId || !eventId) return;

    const fetchTrainers = async () => {
      const tRef = collection(db, "tenants", tenantId, "trainers");
      const snap = await getDocs(tRef);
      setTrainers(
        snap.docs.map((d) =>
          trainerFromFirestoreDoc(d.id, d.data() as Record<string, unknown>)
        )
      );
    };
    fetchTrainers();

    const eventRef = doc(db, "tenants", tenantId, "events", eventId);
    const unsubscribe = onSnapshot(eventRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as EventraEvent;
        setEvent(data);
        if (data?.category) fetchCategoryName(data.category);
      } else {
        router.push(`/admin/events`);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId, eventId, router, fetchCategoryName]);

  // 3. Slideshow Timer
  useEffect(() => {
    const images = event?.images || [];
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % images.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [event?.images]);

  // 4. Purge Protocol
  const handleConfirmDelete = async () => {
    if (!tenantId || !eventId || !event) return;
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
        deleteDoc(doc(db, "tenants", tenantId, "events", eventId)),
        deleteDoc(doc(db, "publicEvents", eventId))
      ]);
      
      toast.success("Event infrastructure decommissioned.");
      router.push(`/admin/events`);
    } catch (error) {
      toast.error("Decommission protocol failed.");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) return (
    <div className={`h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-zinc-50"}`}>
      <Zap className="animate-pulse text-orange-600" size={40} />
    </div>
  );

  const images = event?.images || [];
  const assignedTrainerIds =
    event?.trainerIds && event.trainerIds.length > 0
      ? event.trainerIds
      : event?.trainerId
        ? [event.trainerId]
        : [];
  const headTrainerId = event?.headTrainerId || event?.trainerId || "";
  const assignedTrainerNames = assignedTrainerIds
    .map((id) => trainerDisplayName(trainers.find((t) => t.id === id) ?? {}))
    .filter(Boolean);

  return (
    <div className={`min-h-screen p-4 lg:p-8 font-sans animate-in fade-in duration-700 ${isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"}`}>
      {/* ACTION BAR */}
      <div className="max-w-[1600px] mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <button 
            onClick={() => router.push(`/admin/events`)}
            className="flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-all uppercase text-[10px] font-black tracking-[0.2em]"
          >
            <ArrowLeft size={14} /> Back to Cluster
          </button>
          <h1 className={`text-4xl font-black uppercase tracking-tighter italic ${isDark ? "text-white" : "text-zinc-900"}`}>
            Event <span className="text-orange-600">Nodes</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSlotModalOpen(true)}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-orange-900/20"
          >
            <Zap size={14} fill="white" /> Deploy Slot
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
              isDark
                ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white"
                : "bg-zinc-200 hover:bg-zinc-300 border-zinc-300 text-zinc-900"
            }`}
          >
            <Edit3 size={14} /> Modify
          </button>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border hover:text-white ${
              isDark
                ? "bg-red-950/20 hover:bg-red-600 text-red-500 border-red-900/50"
                : "bg-red-100 hover:bg-red-600 text-red-700 border-red-300"
            }`}
          >
            <Trash2 size={14} /> Purge
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-8 space-y-8">
          <div className={`rounded-[3rem] overflow-hidden border ${isDark ? "bg-zinc-950 border-zinc-900" : "bg-white border-zinc-200"}`}>
            <div className="h-[500px] relative overflow-hidden bg-zinc-900">
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ${
                      idx === currentImgIdx ? "opacity-100 scale-100" : "opacity-0 scale-110"
                    }`}
                    alt=""
                  />
                ))
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-800 font-black tracking-widest">NULL MEDIA</div>
              )}
              
              <div className="absolute bottom-10 right-10 flex gap-2 z-20">
                {images.map((_, i) => (
                  <div key={i} className={`h-1.5 transition-all duration-500 rounded-full ${i === currentImgIdx ? "w-8 bg-orange-600" : "w-2 bg-zinc-400 dark:bg-zinc-700"}`} />
                ))}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />
              <div className="absolute bottom-12 left-12 z-10 space-y-4">
                <span className="px-4 py-1.5 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl inline-flex items-center gap-2">
                  <Tag size={12} /> {categoryLabel}
                </span>
                <h2
                  id="event-detail-photo-title"
                  style={{ color: "#ffffff" }}
                  className="text-7xl font-black uppercase tracking-tighter leading-none drop-shadow-lg"
                >
                  {event?.title}
                </h2>
              </div>
            </div>
            
            {/* CORE DETAILS GRID */}
            <div className={`p-12 grid grid-cols-2 md:grid-cols-4 gap-10 border-t ${isDark ? "border-zinc-900" : "border-zinc-200"}`}>
                <DetailItem isDark={isDark} icon={<Calendar size={18}/>} label="Schedule" value={event?.date} />
                <DetailItem isDark={isDark} icon={<MapPin size={18}/>} label="Node Location" value={event?.locationName || "Location TBD"} />
                <DetailItem isDark={isDark} icon={<Users size={18}/>} label="Max Payload" value={`${event?.capacity} Pax`} />
                <DetailItem isDark={isDark} icon={<Ticket size={18} className="text-orange-500"/>} label="Access Fee" value={`Rs. ${event?.price || 0}`} />
            </div>

            {/* GPS TELEMETRY BAR */}
            <div className="px-12 pb-8 flex flex-wrap items-center gap-6">
               <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"}`}>
                 <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">LAT</span>
                 <span className={`text-xs font-mono ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{event?.latitude || "0.0000"}</span>
               </div>
               <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-100 border-zinc-200"}`}>
                 <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">LONG</span>
                 <span className={`text-xs font-mono ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{event?.longitude || "0.0000"}</span>
               </div>
               {event?.latitude && event?.longitude && (
                 <a 
                   href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center gap-2 text-orange-500 hover:text-orange-400 transition-colors text-[10px] font-black uppercase tracking-widest"
                 >
                   <Navigation size={14} /> View On Map
                 </a>
               )}
            </div>

            <div className="px-12 pb-12">
               <p className="text-zinc-500 text-lg leading-relaxed font-medium italic border-l-4 border-orange-600 pl-8">
                "{event?.description}"
               </p>
            </div>
          </div>

          {/* SLOTS SECTION */}
          <div className={`p-10 rounded-[3rem] border ${isDark ? "bg-zinc-950 border-zinc-900" : "bg-white border-zinc-200"}`}>
             <h3 className="text-xs font-black uppercase tracking-[0.4em] text-orange-600 mb-10 flex items-center gap-3">
                <Clock size={18} /> Available Time Windows
             </h3>
             <SlotList 
               eventId={eventId} 
               tenantId={tenantId || ""} 
               price={event?.price || 0} 
               onEdit={() => {}}
             />
          </div>
        </div>

        {/* SIDEBAR ANALYTICS */}
        <div className="lg:col-span-4 space-y-6">
          <AnalyticsCard isDark={isDark} title="Active Load" value="82%" sub="Booking Ratio" color="text-orange-500" />

          <div className={`p-8 rounded-[2.5rem] border ${isDark ? "bg-zinc-950 border-zinc-900" : "bg-white border-zinc-200"}`}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6">Revenue Forecast</h3>
            <div className="flex justify-between items-end">
                <span className={`text-4xl font-black italic tracking-tighter ${isDark ? "text-white" : "text-zinc-900"}`}>
                  Rs.{(event?.price || 0) * (event?.capacity || 0) * 10}
                </span>
                <TrendingUp className="text-orange-600 mb-1" size={24} />
            </div>
          </div>

          <div className="bg-orange-600 p-8 rounded-[2.5rem] text-black shadow-xl shadow-orange-900/10">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-black text-orange-600 rounded-xl">
                    <Zap size={18} fill="currentColor" />
                </div>
                <h4 className="font-black uppercase tracking-widest text-[10px]">Command Lead</h4>
             </div>
             <p className="text-2xl font-black uppercase tracking-tighter leading-tight">
                {headTrainerId
                  ? trainerDisplayName(
                      trainers.find((t) => t.id === headTrainerId) ?? {}
                    ) || "Lead Assigned"
                  : "Awaiting Assignment"}
             </p>
             {assignedTrainerNames.length > 0 && (
               <p className="mt-3 text-xs font-bold uppercase tracking-wider text-black/80">
                 Team: {assignedTrainerNames.join(", ")}
               </p>
             )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      <CreateEventModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        tenantId={tenantId || ""}
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
        onClose={() => setIsSlotModalOpen(false)}
        eventId={eventId}
        tenantId={tenantId || ""}
        trainerId={headTrainerId}
        defaultCapacity={event?.capacity || 0}
      />
    </div>
  );
}

function DetailItem({ icon, label, value, isDark }: { icon: React.ReactNode, label: string, value: any, isDark: boolean }) {
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 uppercase text-[9px] font-black tracking-widest ${isDark ? "text-zinc-600" : "text-zinc-500"}`}>
        {icon} {label}
      </div>
      <p className={`text-base font-bold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{value || "---"}</p>
    </div>
  );
}

function AnalyticsCard({ title, value, sub, color, isDark }: { title: string, value: string, sub: string, color: string, isDark: boolean }) {
  return (
    <div className={`p-8 rounded-[2.5rem] border ${isDark ? "bg-zinc-950 border-zinc-900" : "bg-white border-zinc-200"}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-3">{title}</p>
      <h3 className={`text-6xl font-black italic tracking-tighter ${color}`}>{value}</h3>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-3">{sub}</p>
    </div>
  );
}