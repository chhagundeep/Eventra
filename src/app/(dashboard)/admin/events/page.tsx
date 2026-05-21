"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Calendar, Loader2, ChevronRight, Trash2, MapPin, Users, Ticket
} from "lucide-react";
import CreateEventModal from "@/components/modals/CreateEventModal";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import { db } from "@/lib/firebase";
import { collection, query, doc, deleteDoc, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { EventraEvent, Trainer, trainerFromFirestoreDoc } from "@/types";
import toast from "react-hot-toast";

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

// --- SUB-COMPONENT: SLIDESHOW EVENT CARD ---
function EventCard({ event, onManage, onDelete }: { 
  event: EventraEvent; 
  onManage: (id: string) => void; 
  onDelete: (id: string, title: string) => void; 
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const images = Array.isArray(event.images) ? event.images : [];

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="group relative bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-orange-500/40 hover:shadow-2xl flex flex-col h-full">
      
      {/* IMAGE PANEL SECTION */}
      <div className="h-52 relative overflow-hidden bg-zinc-900">
        {images.length > 0 ? (
          <>
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  idx === currentIdx ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full">
                {images.map((_, dotIdx) => (
                  <div 
                    key={dotIdx}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      dotIdx === currentIdx ? "bg-orange-500 w-3" : "bg-zinc-500"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
            No Media Payload
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60" />
        
        <div className="absolute top-5 left-6 z-20">
          <span className="px-3 py-1 bg-orange-600 text-[9px] font-black uppercase tracking-widest text-white rounded-lg shadow-lg">
            {event.category || "General"}
          </span>
        </div>
      </div>

      {/* METADATA SECTION */}
      <div className="px-7 pb-8 relative z-10 space-y-4 bg-zinc-950 flex-grow">
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none pt-6 line-clamp-1">
          {event.title}
        </h3>
        
        {/* UPDATED 2x2 GRID FOR LOCATION INCLUSION */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-900">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-orange-600" />
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Date</p>
              <p className="text-[10px] font-bold text-zinc-300">{event.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-orange-600" />
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Location</p>
              <p className="text-[10px] font-bold text-zinc-300 truncate max-w-[100px]">{event.locationName || "Remote"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-orange-600" />
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Payload</p>
              <p className="text-[10px] font-bold text-zinc-300">{event.capacity} Max</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Ticket size={14} className="text-orange-600" />
            <div className="space-y-0.5">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Credit</p>
              <p className="text-[10px] font-black text-white">Rs.{event.price || 0}</p>
            </div>
          </div>
        </div>

        <p className="text-zinc-500 text-xs italic font-medium line-clamp-2 leading-relaxed h-8">
          "{event.description}"
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button 
            onClick={() => onManage(event.id!)} 
            className="flex-grow bg-white hover:bg-orange-600 text-black hover:text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/btn"
          >
            Manage Node <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => onDelete(event.id!, event.title)} 
            className="p-4 bg-zinc-900 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-colors border border-zinc-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventsManagerPage() {
  const router = useRouter();
  const { tenantId } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{id: string, title: string} | null>(null);
  
  const [events, setEvents] = useState<EventraEvent[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    setLoading(true);

    const trainersRef = collection(db, "tenants", tenantId, "trainers");
    const unsubTrainers = onSnapshot(trainersRef, (snap) => {
      setTrainers(
        snap.docs.map((d) =>
          trainerFromFirestoreDoc(d.id, d.data() as Record<string, unknown>)
        )
      );
    });

    const eventsRef = collection(db, "tenants", tenantId, "events");
    const q = query(eventsRef, orderBy("createdAt", "desc"));
    const unsubEvents = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventraEvent)));
      setLoading(false);
    });

    return () => {
      unsubTrainers();
      unsubEvents();
    };
  }, [tenantId]);

  const handleDeleteRequest = (id: string, title: string) => {
    setEventToDelete({ id, title });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete || !tenantId) return;
    setIsDeleting(true);

    try {
      const targetEvent = events.find(e => e.id === eventToDelete.id);
      
      if (targetEvent?.images && targetEvent.images.length > 0) {
        const publicIds = targetEvent.images.map(url => extractIdFromUrl(url)).filter(Boolean) as string[];
        if (publicIds.length > 0) {
          await fetch("/api/admin/delete-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicIds }),
          });
        }
      }

      await Promise.all([
        deleteDoc(doc(db, "tenants", tenantId, "events", eventToDelete.id)),
        deleteDoc(doc(db, "publicEvents", eventToDelete.id))
      ]);
      
      toast.success("Node successfully purged from infrastructure.");
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("Purge protocol failed.");
    } finally {
      setIsDeleting(false);
      setEventToDelete(null);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-black">
      <Loader2 className="animate-spin text-orange-600" size={40} />
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER STATISTICS */}
      <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[2rem] flex items-center gap-5 min-w-[240px]">
          <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-600/20">
            <Calendar size={28} />
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Active Nodes</p>
            <p className="text-3xl font-black text-white">{events.length}</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-orange-600/20"
        >
          <Plus size={20} strokeWidth={3} /> Deploy Node
        </button>
      </div>

      {/* INFRASTRUCTURE GRID */}
      <div className="space-y-8">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Event Infrastructure</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.length > 0 ? (
            events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onManage={(id) => router.push(`/admin/events/${id}`)} 
                onDelete={handleDeleteRequest} 
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
              <p className="text-zinc-600 font-black uppercase tracking-widest text-sm">No Active Nodes Detected</p>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <CreateEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantId={tenantId || ""}
        trainers={trainers}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={eventToDelete?.title || ""}
        loading={isDeleting}
      />
    </div>
  );
}