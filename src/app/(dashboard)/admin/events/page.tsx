"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Calendar, 
  Loader2, 
  Users, 
  Ticket, 
  MoreHorizontal, 
  Image as ImageIcon,
  ChevronRight
} from "lucide-react";
import CreateEventModal from "@/components/modals/CreateEventModal";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { EventraEvent } from "@/types";

// --- SUB-COMPONENT: SLIDESHOW EVENT CARD ---
function EventCard({ event }: { event: any }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Normalizes data: checks for 'images' array first, falls back to 'imageUrl' string
  const images = Array.isArray(event.images) && event.images.length > 0 
    ? event.images 
    : (event.imageUrl ? [event.imageUrl] : []);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % images.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden group hover:border-orange-600/50 transition-all flex flex-col h-full relative">
      {/* IMAGE SLIDESHOW SECTION */}
      <div className="h-56 relative overflow-hidden bg-zinc-950">
        {images.length > 0 ? (
          images.map((img: string, idx: number) => (
            <img
              key={idx}
              src={img}
              alt={`${event.title} - ${idx}`}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                idx === currentIdx ? "opacity-70 scale-100" : "opacity-0 scale-110"
              }`}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-800">
            <ImageIcon size={48} />
          </div>
        )}

        {/* NAVIGATION DOTS (Carousel UI) */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/5">
            {images.map((_: any, i: number) => (
              <div 
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIdx ? "w-4 bg-orange-600" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10" />
        
        {/* Floating Badges */}
        <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
          <span className="px-4 py-1.5 bg-orange-600 text-white text-[10px] font-black uppercase tracking-tighter rounded-full shadow-lg">
            {event.category?.replace('-', ' ') || 'General'}
          </span>
          {images.length > 1 && (
            <span className="px-2.5 py-1 bg-zinc-950/80 backdrop-blur-md text-white text-[9px] font-bold rounded-lg border border-white/10">
              {currentIdx + 1} / {images.length}
            </span>
          )}
        </div>
      </div>
      
      {/* CONTENT SECTION */}
      <div className="p-7 flex flex-col flex-grow space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-white leading-tight group-hover:text-orange-500 transition-colors">
            {event.title}
          </h3>
          <button className="text-zinc-600 hover:text-white p-2 hover:bg-zinc-800 rounded-full transition-all">
            <MoreHorizontal size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4 text-zinc-500 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-orange-500" />
            {event.date}
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-blue-500" />
            {event.capacity} Max
          </div>
        </div>

        <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed italic">
          "{event.description || 'No description available for this node.'}"
        </p>

        <div className="pt-5 mt-auto border-t border-zinc-800/50 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Pass Price</span>
            <span className="text-xl font-black text-white">${event.price || 0}</span>
          </div>
          <div className="flex items-center gap-3">
             <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-2xl text-[11px] font-bold transition-all active:scale-95">
               Edit
             </button>
             <button className="bg-orange-600 hover:bg-orange-700 text-white p-2.5 rounded-2xl transition-all active:scale-95">
               <ChevronRight size={18} strokeWidth={3} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function EventsManagerPage() {
  const { tenantId, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<EventraEvent[]>([]);
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrainers = useCallback(async () => {
    if (!tenantId) return;
    try {
      const trainersRef = collection(db, "tenants", tenantId, "trainers");
      const trainerSnap = await getDocs(trainersRef);
      const trainerList = trainerSnap.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name 
      }));
      setTrainers(trainerList);
    } catch (error) {
      console.error("Error fetching trainers:", error);
    }
  }, [tenantId]);

  const fetchEvents = useCallback(async () => {
    if (!tenantId) return;
    try {
      const eventsRef = collection(db, "tenants", tenantId, "events");
      const q = query(eventsRef, orderBy("createdAt", "desc"));
      const eventSnap = await getDocs(q);
      
      const fetchedEvents = eventSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as EventraEvent[];
      
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, [tenantId]);

  useEffect(() => {
    const loadAllData = async () => {
      if (!tenantId && !user) return; 
      setLoading(true);
      try {
        await Promise.all([fetchTrainers(), fetchEvents()]);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [tenantId, user, fetchTrainers, fetchEvents]);

  const handleModalOpen = () => {
    fetchTrainers();
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchEvents();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER STATS SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-6">
        <div className="flex flex-wrap gap-4 w-full">
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[2rem] flex items-center gap-5 min-w-[240px] backdrop-blur-md">
            <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-600/20">
              <Calendar size={28} />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Live Nodes</p>
              <p className="text-3xl font-black text-white">{events.length}</p>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[2rem] flex items-center gap-5 min-w-[240px] backdrop-blur-md">
            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-600/20">
              <Users size={28} />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Total Bookings</p>
              <p className="text-3xl font-black text-white">0</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleModalOpen}
          className="group bg-orange-600 hover:bg-orange-500 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-2xl shadow-orange-900/40 active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> 
          Deploy Event
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* MAIN FEED */}
        <div className="xl:col-span-8 space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Active Nodes</h2>
            <div className="h-[2px] flex-grow bg-zinc-900 mt-2" />
          </div>

          {events.length === 0 ? (
            <div className="h-[500px] border-2 border-dashed border-zinc-800 rounded-[4rem] bg-zinc-950/50 flex flex-col items-center justify-center text-center p-10">
              <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <ImageIcon className="text-zinc-700" size={40} />
              </div>
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter">No Events Deployed</h3>
              <p className="text-zinc-500 mt-2 max-w-xs">Your event management hub is currently offline. Deploy a node to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] p-10 space-y-8 sticky top-6 backdrop-blur-xl">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">System Spotlight</h2>
              <p className="text-zinc-500 text-xs mt-1 font-bold uppercase tracking-widest">Real-time Node Analytics</p>
            </div>
            
            <div className="aspect-[4/5] rounded-[2.5rem] bg-zinc-950 border border-zinc-900 relative overflow-hidden flex flex-col items-center justify-center group">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent opacity-50" />
               <div className="relative z-10 flex flex-col items-center">
                  <div className="w-20 h-20 bg-orange-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Ticket className="text-orange-600" size={36} />
                  </div>
                  <p className="text-white font-black text-lg uppercase tracking-tighter">Awaiting Signal</p>
                  <p className="text-zinc-500 text-[10px] mt-2 font-bold uppercase tracking-widest px-8 text-center leading-relaxed">
                    Once users start booking tickets, their activity will appear in this spotlight.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <CreateEventModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        tenantId={tenantId || ""}
        trainers={trainers}
      />
    </div>
  );
}