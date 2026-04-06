"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import Link from "next/link";
import { ChevronRight, Calendar } from "lucide-react";

export default function EventraMainPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // Keeping your existing Firebase logic
    const q = query(collection(db, "publicEvents"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-[#FAFAFA] dark:bg-zinc-950 min-h-screen pb-20 transition-colors">
      
      {/* --- HERO SECTION: BUTTERFLY INSPIRED --- */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-32 border-b border-zinc-100 dark:border-zinc-900">
        <div className="max-w-3xl">
          <p className="text-[#B39577] font-bold uppercase tracking-[0.2em] text-[10px] mb-4">
            Multi-Tenant Event Infrastructure
          </p>
          
          {/* Using the Serif font for that luxury "Butterfly" feel */}
          <h1 className="font-serif text-5xl md:text-8xl font-black text-zinc-900 dark:text-white leading-[0.9] italic tracking-tighter">
            Memorable <br /> 
            <span className="text-transparent" style={{ WebkitTextStroke: '1px #18181b' }}>Experiences</span>
            <span className="text-[#B39577]">.</span>
          </h1>
          
          <p className="text-zinc-500 dark:text-zinc-400 mt-8 text-lg max-w-lg font-medium leading-relaxed">
            Discover professional workshops and training nodes. Seamlessly managed, elegantly delivered.
          </p>
          
          <div className="mt-10 flex gap-4">
            <button className="bg-[#B39577] text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#a38567] transition-all shadow-xl shadow-stone-200 dark:shadow-none">
              Explore Now
            </button>
          </div>
        </div>
      </section>

      {/* --- EVENT GRID: RECOMMENDED NODES --- */}
      <section className="max-w-7xl mx-auto px-6 mt-20">
        <div className="flex items-baseline justify-between mb-12">
          <h2 className="font-serif text-3xl font-black italic tracking-tighter text-zinc-900 dark:text-white">
            Recommended Nodes
          </h2>
          <Link href="/events" className="text-[#B39577] text-xs font-bold uppercase tracking-widest flex items-center gap-1 hover:underline">
            See All <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {events.map((event) => (
            <Link 
              href={`/events/${event.id}`} 
              key={event.id} 
              className="group flex flex-col"
            >
              {/* Image Container with Butterfly rounded style */}
              <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-zinc-200 dark:bg-zinc-900 mb-6 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-stone-200 dark:group-hover:shadow-none">
                <img 
                  src={event.images?.[0] || "/api/placeholder/400/600"} 
                  alt={event.title} 
                  className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
                />
                
                {/* Clean floating tag */}
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                   <p className="text-[9px] font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
                     {event.tenantId || "Live Node"}
                   </p>
                </div>
              </div>

              {/* Typography transformation */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#B39577] text-[10px] font-black uppercase tracking-[0.15em]">
                    {event.category || "General"}
                  </span>
                  <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-bold">
                    <Calendar size={12} />
                    {event.date || "2026"}
                  </div>
                </div>

                <h3 className="font-serif text-xl font-black italic text-zinc-900 dark:text-zinc-100 group-hover:text-[#B39577] transition-colors line-clamp-1">
                  {event.title}
                </h3>
                
                <p className="text-zinc-900 dark:text-white font-bold text-sm tracking-tight">
                  ₹{event.price || "TBA"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}