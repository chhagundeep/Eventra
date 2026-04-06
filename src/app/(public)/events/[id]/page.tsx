"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Calendar, MapPin, Share2, Star } from "lucide-react";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      const docRef = doc(db, "publicEvents", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEvent(docSnap.data());
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  if (loading) return <div className="h-screen bg-[#0f0f0f] flex items-center justify-center text-white font-black tracking-widest uppercase italic">Loading...</div>;
  if (!event) return <div className="h-screen bg-[#0f0f0f] flex items-center justify-center text-white">Event not found</div>;

  const mainImage = event.images?.[0] || "";

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* HERO SECTION */}
      <div className="relative w-full h-[500px] overflow-hidden">
        {/* Fixed: Use double quotes in url template for safe image loading */}
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-30"
          style={{ backgroundImage: `url("${mainImage}")` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />

        <div className="relative max-w-7xl mx-auto h-full flex items-center px-8 md:px-16 gap-10">
          <div className="hidden md:block w-72 h-[400px] rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border border-white/10 group">
            <img src={mainImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          </div>

          <div className="flex flex-col gap-4 max-w-2xl">
            <div className="bg-[#f84464] text-[10px] font-black uppercase tracking-widest w-fit px-3 py-1.5 rounded-md">
              {event.category || "Live Event"}
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none uppercase italic">
              {event.title}
            </h1>

            <div className="flex items-center gap-4 text-zinc-300 mt-2">
              <div className="flex items-center gap-1.5">
                <Star className="text-[#f84464] fill-[#f84464]" size={20} />
                <span className="font-black text-xl italic">8.9/10</span>
                <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest ml-1">(Verified Node)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4 text-zinc-400">
               <div className="flex items-center gap-3 text-sm font-bold">
                  <Calendar size={18} className="text-[#f84464]" />
                  <span className="uppercase tracking-tight">{event.date || "Scheduled Soon"}</span>
               </div>
               <div className="flex items-center gap-3 text-sm font-bold">
                  <MapPin size={18} className="text-[#f84464]" />
                  <span className="uppercase tracking-tight">{event.location || "Location via Organizer"}</span>
               </div>
            </div>

            <button className="mt-8 bg-[#f84464] hover:bg-[#ff4d6d] text-white w-fit px-14 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-[#f84464]/40 transform active:scale-95">
              Book Tickets
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL SECTION */}
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
           <h3 className="text-2xl font-black uppercase italic mb-6 border-b border-[#f84464] w-fit pr-8 pb-2">About the Event</h3>
           <p className="text-zinc-400 leading-relaxed text-base font-medium">
             {event.description || "Detailed session structure and training outcomes provided by the organizer."}
           </p>
        </div>

        <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-zinc-800 h-fit shadow-xl">
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Official Host</p>
           <h4 className="font-black text-xl text-[#f84464] uppercase italic tracking-tighter">{event.tenantId}</h4>
           <div className="h-0.5 w-10 bg-zinc-800 my-4" />
           <p className="text-xs text-zinc-400 leading-relaxed italic">Authorized training node powered by the Eventra multi-tenant architecture.</p>
           
           <button className="mt-8 pt-8 border-t border-zinc-800 flex items-center gap-4 group w-full">
              <div className="p-3 bg-zinc-800 rounded-full text-white group-hover:bg-[#f84464] transition-colors">
                <Share2 size={20} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">Share Event</p>
           </button>
        </div>
      </div>
    </div>
  );
}