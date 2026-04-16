"use client";

import React, { useEffect, useState, use } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  orderBy,
  deleteDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { EventraEvent, Trainer } from "@/types";
import { 
  Plus, 
  ArrowLeft, 
  Search,
  Loader2,
  Trash2,
  Edit3,
  ChevronRight,
  MapPin,
  Calendar,
  Users,
  Ticket,
  Activity
} from "lucide-react";
import Link from "next/link";
import CreateEventModal from "@/components/modals/CreateEventModal";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

// --- SUB-COMPONENT: REFINED SLIDESHOW ---
function EventSlideshow({ images }: { images: string[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
        <Activity className="text-zinc-800 animate-pulse" size={40} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt="Event visual"
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
                dotIdx === currentIdx 
                  ? "bg-orange-500 w-3" 
                  : "bg-zinc-500"
              }`}
            />
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
    </div>
  );
}

export default function OrganizationEventsPage({ params }: PageProps) {
  const { id: organizationId } = use(params);
  
  const [events, setEvents] = useState<EventraEvent[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [orgName, setOrgName] = useState("Organization Node");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventraEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{id: string, title: string} | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const orgDoc = await getDoc(doc(db, "tenants", organizationId));
      if (orgDoc.exists()) setOrgName(orgDoc.data().name);

      const eventsRef = collection(db, "tenants", organizationId, "events");
      const q = query(eventsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedEvents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EventraEvent[];
      setEvents(fetchedEvents);

      const trainersRef = collection(db, "tenants", organizationId, "trainers");
      const tSnapshot = await getDocs(trainersRef);
      setTrainers(tSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trainer)));
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "tenants", organizationId, "events", eventToDelete.id));
      await deleteDoc(doc(db, "publicEvents", eventToDelete.id));
      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Deletion failed:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 font-sans selection:bg-orange-600 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div className="space-y-4">
            <Link 
              href="/super-admin/organizations" 
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <ArrowLeft size={14} strokeWidth={3} /> Return to Cluster
            </Link>
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-2">
                {orgName} <span className="text-orange-600">Node</span>
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-zinc-500 text-[10px] font-bold tracking-widest flex items-center gap-2 bg-zinc-900/50 px-3 py-1 rounded-full border border-white/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                  Registry: <span className="text-zinc-300 font-mono">{organizationId}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-600 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="SEARCH EVENTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900/80 border border-white/10 rounded-xl py-4 pl-12 pr-6 text-[10px] font-bold tracking-widest focus:border-orange-600 outline-none transition-all w-full sm:w-64"
              />
            </div>
            <button 
              onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
              className="bg-orange-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
            >
              <Plus size={16} strokeWidth={4} /> Deploy Event
            </button>
          </div>
        </div>

        {/* --- EVENT GRID --- */}
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-6">
            <Loader2 className="animate-spin text-orange-600" size={48} strokeWidth={3} />
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Infrastructure...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {filteredEvents.map((event) => (
              <div 
                key={event.id}
                className="group bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-3 hover:border-orange-600/30 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-600/5 flex flex-col"
              >
                <div className="aspect-[4/3] rounded-[2rem] overflow-hidden relative mb-6 bg-zinc-900 flex-shrink-0">
                  <EventSlideshow images={event.images || []} />
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-orange-600 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">
                      {event.category || "General"}
                    </span>
                  </div>
                </div>

                <div className="px-4 pb-4 space-y-6 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none group-hover:text-orange-500 transition-colors line-clamp-1">
                      {event.title}
                    </h3>

                    {/* UPDATED 2x2 METADATA GRID WITH LOCATION */}
                    <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-5">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-orange-600" />
                        <div className="space-y-0.5">
                          <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Date</p>
                          <p className="text-[10px] font-bold font-mono">{event.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-orange-600" />
                        <div className="space-y-0.5">
                          <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Location</p>
                          <p className="text-[10px] font-bold truncate max-w-[80px]">{event.locationName || "Remote"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-orange-600" />
                        <div className="space-y-0.5">
                          <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Payload</p>
                          <p className="text-[10px] font-bold">{event.capacity} Max</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ticket size={14} className="text-orange-600" />
                        <div className="space-y-0.5">
                          <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest">Credit</p>
                          <p className="text-[10px] font-black text-white">Rs.{event.price || "0"}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-zinc-500 text-[11px] font-medium italic leading-relaxed line-clamp-2 px-1">
                      "{event.description || "No description provided for this node."}"
                    </p>
                  </div>

                  {/* ACTION ROW */}
                  <div className="flex items-center gap-1.5 pt-4">
                    <Link 
                      href={`/super-admin/organizations/${organizationId}/events/${event.id}`}
                      className="flex-1 bg-white text-black py-4 px-2 rounded-2xl font-black uppercase text-[10px] tracking-[0.1em] hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2 group/btn min-w-0"
                    >
                      <span className="truncate">Manage Node</span>
                      <ChevronRight size={14} strokeWidth={3} className="shrink-0 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                    
                    <button 
                      onClick={() => { setSelectedEvent(event); setIsModalOpen(true); }}
                      className="bg-zinc-900/50 p-4 rounded-2xl text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 transition-all border border-white/5 flex items-center justify-center shrink-0"
                    >
                      <Edit3 size={18} />
                    </button>

                    <button 
                      onClick={() => {
                        setEventToDelete({ id: event.id!, title: event.title });
                        setIsDeleteModalOpen(true);
                      }}
                      className="bg-zinc-900/50 p-4 rounded-2xl text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5 flex items-center justify-center shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateEventModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); fetchData(); }}
        tenantId={organizationId}
        trainers={trainers}
        initialData={selectedEvent}
      />

      <div className="relative z-[100]">
        <DeleteConfirmModal 
          isOpen={isDeleteModalOpen}
          loading={deleteLoading}
          title={eventToDelete?.title ?? "Event"}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
}