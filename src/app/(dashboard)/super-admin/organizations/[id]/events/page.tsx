"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, ArrowLeft, Search, Plus, 
  Clock, MapPin, Tag, MoreVertical, 
  Edit2, Trash2 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";

// Components
import CreateEventModal from "@/components/modals/CreateEventModal";
import DeleteModal from "@/components/DeleteModal"; 

export default function SuperAdminOrgEvents() {
  const params = useParams();
  const id = params.id as string; // This is the tenantId from the URL
  const router = useRouter();
  
  const [events, setEvents] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Constants for Cloudinary (Adjust cloud name if different)
  const CLOUD_NAME = "dfxae9jrx"; 
  const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_500/`;

  useEffect(() => {
    if (!id) return;

    // 1. Listen to Events for this specific Tenant
    const eventsRef = collection(db, "tenants", id, "events");
    const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventData);
      setLoading(false);
    }, (error) => {
      toast.error("Failed to sync events");
      setLoading(false);
    });

    // 2. Fetch Trainers for the Modal (to assign to events)
    const fetchTrainers = async () => {
      try {
        const tRef = collection(db, "tenants", id, "trainers");
        const snap = await getDocs(tRef);
        setTrainers(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
      } catch (err) {
        console.error("Error fetching trainers:", err);
      }
    };

    fetchTrainers();
    return () => unsubEvents();
  }, [id]);

  const handleDeleteConfirm = async () => {
    if (!selectedEvent || !id) return;
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, "tenants", id, "events", selectedEvent.id));
      toast.success("Event removed successfully");
      setIsDeleteOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      toast.error("Error: Could not delete event");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredEvents = events.filter(e => 
    e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Modal Layer */}
      <CreateEventModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }} 
        tenantId={id}
        trainers={trainers}
        initialData={selectedEvent}
      />
      
      <DeleteModal 
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        orgName={selectedEvent?.title || "this event"}
        loading={deleteLoading}
        title="Remove Event Deployment?"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
              Organization <span className="text-orange-600">Events</span>
            </h2>
            <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">
              Deep Dive / ID: {id?.slice(0, 12)}...
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-orange-900/20"
        >
          <Plus size={18} strokeWidth={3} /> Create New Event
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
        <input 
          type="text"
          placeholder="Filter events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-orange-600/50 w-full backdrop-blur-md transition-all"
        />
      </div>

      {/* Grid of Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-4">
               <div className="h-1 w-32 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="h-full w-1/2 bg-orange-600" />
               </div>
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Fetching Event Nodes...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 border-2 border-dashed border-zinc-800 rounded-[3.5rem] text-center">
              <Calendar size={48} className="mx-auto text-zinc-800 mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No events found for this organization</p>
            </motion.div>
          ) : (
            filteredEvents.map((event) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={event.id}
                className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2.5rem] group hover:border-orange-600/30 transition-all relative overflow-visible backdrop-blur-sm shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-zinc-800 rounded-2xl flex items-center justify-center text-orange-500 overflow-hidden border border-zinc-700/50 shadow-inner">
                      {event.images?.[0] ? (
                        <img src={event.images[0]} alt={event.title} className="h-full w-full object-cover" />
                      ) : (
                        <Calendar size={28} />
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-white text-lg tracking-tight truncate max-w-[140px]">
                        {event.title || "Untitled Node"}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag size={12} className="text-orange-500" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{event.category || "General"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setActiveMenuId(activeMenuId === event.id ? null : event.id)}
                      className="p-2 text-zinc-600 hover:text-white transition-colors bg-zinc-800/50 rounded-xl"
                    >
                      <MoreVertical size={20} />
                    </button>

                    {activeMenuId === event.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                        <div className="absolute right-0 mt-2 w-48 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
                          <button 
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsModalOpen(true);
                              setActiveMenuId(null);
                            }}
                            className="flex items-center gap-3 w-full p-3 text-[10px] font-black uppercase text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
                          >
                            <Edit2 size={14} className="text-orange-600" /> Modify Event
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsDeleteOpen(true);
                              setActiveMenuId(null);
                            }}
                            className="flex items-center gap-3 w-full p-3 text-[10px] font-black uppercase text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 size={14} /> Remove Node
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <div className="h-8 w-8 rounded-xl bg-black/20 flex items-center justify-center border border-zinc-800/50">
                        <Clock size={14} className="text-orange-500/50" />
                    </div>
                    <span className="text-xs font-medium">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <div className="h-8 w-8 rounded-xl bg-black/20 flex items-center justify-center border border-zinc-800/50">
                        <MapPin size={14} className="text-orange-500/50" />
                    </div>
                    <span className="text-xs font-medium truncate">{event.location || "Organization Venue"}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}