"use client";

import React, { useEffect, useState, use, useRef } from "react";
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
  Activity,
  Filter,
  XCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CreateEventModal from "@/components/modals/CreateEventModal";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

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
  
  // HUD TOGGLE STATE
  const [isHudOpen, setIsHudOpen] = useState(false);

  // UPDATED MULTI-FILTER STATE (With Date Range)
  const [filters, setFilters] = useState({
    title: "",
    dateFrom: "",
    dateTo: "",
    location: "",
    payload: "",
    credit: ""
  });

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

  // UPDATED FILTER LOGIC: HANDLING DATE RANGE
  const filteredEvents = events.filter(event => {
    const matchTitle = event.title.toLowerCase().includes(filters.title.toLowerCase());
    const matchLocation = (event.locationName || "Remote").toLowerCase().includes(filters.location.toLowerCase());
    const matchPayload = event.capacity?.toString().includes(filters.payload);
    const matchCredit = event.price?.toString().includes(filters.credit);

    // Date Range Logic
    let matchDateRange = true;
    if (filters.dateFrom || filters.dateTo) {
      const eventDate = new Date(event.date);
      if (filters.dateFrom) {
        matchDateRange = matchDateRange && eventDate >= new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        matchDateRange = matchDateRange && eventDate <= new Date(filters.dateTo);
      }
    }

    return matchTitle && matchLocation && matchPayload && matchCredit && matchDateRange;
  });

  const resetFilters = () => setFilters({ title: "", dateFrom: "", dateTo: "", location: "", payload: "", credit: "" });
  const hasActiveFilters = Object.values(filters).some(val => val !== "");

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 font-sans selection:bg-orange-600 overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div className="space-y-4">
            <Link href="/super-admin/organizations" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-500 transition-colors text-[10px] font-black uppercase tracking-[0.2em]">
              <ArrowLeft size={14} strokeWidth={3} /> Return to Cluster
            </Link>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] mb-2">
              {orgName} <span className="text-orange-600">Events</span>
            </h1>
          </div>

          <div className="flex gap-4">
            {/* TOGGLE BUTTON */}
            <button 
              onClick={() => setIsHudOpen(!isHudOpen)}
              className={`px-6 py-4 rounded-xl border font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${isHudOpen ? 'bg-zinc-800 border-white/20' : 'bg-transparent border-white/5 text-zinc-500'}`}
            >
              <Filter size={14} /> {isHudOpen ? "Close Filters" : "Open Filters"}
              {isHudOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button 
              onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
              className="bg-orange-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-95"
            >
              <Plus size={16} strokeWidth={4} /> Deploy Event
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE HUD */}
        <AnimatePresence>
          {isHudOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-zinc-900/30 border border-white/5 p-8 rounded-[2.5rem] space-y-8 mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Parameter Filtering</span>
                  </div>
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="text-orange-500 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase transition-all">
                      <XCircle size={14} /> Purge Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                  {/* Title */}
                  <div className="space-y-2 group">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Identity</p>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors" size={14} />
                      <input type="text" placeholder="TITLE..." value={filters.title} onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))} className="bg-black border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[9px] font-bold tracking-widest focus:border-orange-600 outline-none w-full transition-all" />
                    </div>
                  </div>

                  {/* Date From */}
                  <div className="space-y-2 group">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">From Date</p>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors pointer-events-none" size={14} />
                      <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))} className="bg-black border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[9px] font-bold tracking-widest focus:border-orange-600 outline-none w-full color-scheme-dark" />
                    </div>
                  </div>

                  {/* Date To */}
                  <div className="space-y-2 group">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">To Date</p>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors pointer-events-none" size={14} />
                      <input type="date" value={filters.dateTo} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))} className="bg-black border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[9px] font-bold tracking-widest focus:border-orange-600 outline-none w-full color-scheme-dark" />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2 group">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Vector</p>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors" size={14} />
                      <input type="text" placeholder="LOCATION..." value={filters.location} onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))} className="bg-black border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[9px] font-bold tracking-widest focus:border-orange-600 outline-none w-full" />
                    </div>
                  </div>

                  {/* Payload */}
                  <div className="space-y-2 group">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Payload</p>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors" size={14} />
                      <input type="text" placeholder="CAPACITY..." value={filters.payload} onChange={(e) => setFilters(prev => ({ ...prev, payload: e.target.value }))} className="bg-black border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[9px] font-bold tracking-widest focus:border-orange-600 outline-none w-full" />
                    </div>
                  </div>

                  {/* Credit */}
                  <div className="space-y-2 group">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Credit</p>
                    <div className="relative">
                      <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors" size={14} />
                      <input type="text" placeholder="PRICE..." value={filters.credit} onChange={(e) => setFilters(prev => ({ ...prev, credit: e.target.value }))} className="bg-black border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[9px] font-bold tracking-widest focus:border-orange-600 outline-none w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EVENT GRID */}
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-6">
            <Loader2 className="animate-spin text-orange-600" size={48} strokeWidth={3} />
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Nodes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event) => (
                <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={event.id} className="group bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-3 hover:border-orange-600/30 transition-all duration-500 flex flex-col">
                  <div className="aspect-[4/3] rounded-[2rem] overflow-hidden relative mb-6 bg-zinc-900">
                    <EventSlideshow images={event.images || []} />
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-orange-600 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                        {event.category || "General"}
                      </span>
                    </div>
                  </div>

                  <div className="px-4 pb-4 space-y-6 flex-grow flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black uppercase tracking-tighter leading-none group-hover:text-orange-500 transition-colors line-clamp-1">{event.title}</h3>

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
                        {/* RESTORED COLUMNS */}
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
                        &quot;{event.description || "No description provided."}&quot;
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-4">
                      <Link href={`/super-admin/organizations/${organizationId}/events/${event.id}`} className="flex-1 bg-white text-black py-4 px-2 rounded-2xl font-black uppercase text-[10px] tracking-[0.1em] hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2 group/btn min-w-0">
                        <span className="truncate">Manage Node</span>
                        <ChevronRight size={14} strokeWidth={3} className="shrink-0 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                      <button onClick={() => { setSelectedEvent(event); setIsModalOpen(true); }} className="bg-zinc-900/50 p-4 rounded-2xl text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 transition-all border border-white/5 shrink-0">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => { setEventToDelete({ id: event.id!, title: event.title }); setIsDeleteModalOpen(true); }} className="bg-zinc-900/50 p-4 rounded-2xl text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5 shrink-0">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <CreateEventModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchData(); }} tenantId={organizationId} trainers={trainers} initialData={selectedEvent} />
      <DeleteConfirmModal isOpen={isDeleteModalOpen} loading={deleteLoading} title={eventToDelete?.title ?? "Event"} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} />

      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.5;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}