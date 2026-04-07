"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Plus, Clock, TrendingUp, Download, RefreshCw, CheckCircle2 
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function SuperAdminSchedule() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper for "Today" logic
  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const q = query(collection(db, "publicEvents"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const exportToCSV = () => {
    const headers = ["Event Name", "Category", "Date", "Location"];
    const rows = events.map(event => [
      `"${event.title}"`, `"${event.category}"`, `"${event.date}"`, `"${event.location || 'N/A'}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `platform_report_${monthName}_${year}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-6 space-y-6">
      
      {showToast && (
        <div className="fixed top-5 right-5 z-[100] animate-in slide-in-from-right duration-300">
          <div className="bg-zinc-900 border border-orange-600/50 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <CheckCircle2 className="text-orange-500" size={20} />
            <div>
              <p className="text-[10px] font-black uppercase">Sync Successful</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase">Database aligned with G-Cal</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">
            Schedule <span className="text-orange-600">Timeline</span>
          </h2>
          <button 
            onClick={() => { setIsSyncing(true); setTimeout(() => { setIsSyncing(false); setShowToast(true); }, 1500); }}
            className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase text-zinc-400 hover:text-orange-500 transition-colors"
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin text-orange-600" : ""} />
            {isSyncing ? "Syncing..." : "Sync Google Calendar"}
          </button>
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto">
          <button onClick={exportToCSV} className="flex-1 lg:flex-none px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
            <Download size={12} /> Export
          </button>
          <button className="flex-1 lg:flex-none px-5 py-2.5 bg-orange-600 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
            <Plus size={12} /> New Event
          </button>
        </div>
      </div>

      {/* Analytics - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Live Events" value={events.length.toString()} change="Realtime" icon={<CalendarIcon size={14}/>} />
        <MetricCard label="Uptime" value="99.9%" change="Live" icon={<Clock size={14}/>} />
        <MetricCard label="Nodes" value="48" change="Stable" icon={<TrendingUp size={14}/>} />
        <MetricCard label="Load" value="14ms" change="Low" icon={<div className="text-emerald-500 text-xs">◈</div>} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Calendar Section - Responsive & Non-Scrollable */}
        <div className="xl:col-span-8">
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[1.5rem] p-4 md:p-6 backdrop-blur-xl">
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter">
                  {monthName} <span className="text-orange-600">{year}</span>
                </h3>
                <div className="flex bg-black p-1 rounded-lg border border-zinc-800">
                  <button onClick={prevMonth} className="p-1.5 hover:bg-zinc-800 rounded transition-colors"><ChevronLeft size={16}/></button>
                  <button onClick={nextMonth} className="p-1.5 hover:bg-zinc-800 rounded transition-colors"><ChevronRight size={16}/></button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-[2px] w-6 bg-orange-600" />
                <span className="text-[10px] font-[1000] uppercase tracking-[0.2em] text-white">
                  Today is {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
              </div>
            </div>

            {/* Grid Container - w-full ensures no scroll */}
            <div className="w-full">
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[9px] font-black uppercase text-zinc-600 pb-2">{day}</div>
                ))}
                
                {Array.from({ length: 35 }).map((_, i) => {
                  const dayNum = i - firstDayOfMonth + 1;
                  const isValidDay = dayNum > 0 && dayNum <= daysInMonth;
                  const dateString = `${year}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  
                  const isToday = isValidDay && dateString === todayDateString;
                  const dayEvents = events.filter(e => e.date === dateString);

                  return (
                    <div key={i} className={`min-h-[70px] md:min-h-[90px] rounded-lg border p-1.5 transition-all group relative
                      ${isValidDay ? 'bg-zinc-900/40 border-zinc-800/50' : 'opacity-0 pointer-events-none'}
                      ${isToday ? 'border-orange-600 ring-1 ring-orange-600/40 bg-orange-600/5' : 'hover:border-zinc-700'}
                    `}>
                      {isValidDay && (
                        <>
                          <span className={`text-[10px] font-black ${isToday ? 'text-orange-500' : 'text-zinc-500'} group-hover:text-white`}>
                            {dayNum}
                          </span>
                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 2).map((event, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => router.push(`/admin/events/${event.id}`)}
                                className="w-full text-left bg-orange-600/10 border-l-2 border-orange-600 p-0.5 rounded-sm transition-colors"
                              >
                                <p className="text-[7px] font-black uppercase truncate text-white">{event.title}</p>
                              </button>
                            ))}
                            {dayEvents.length > 2 && (
                              <p className="text-[6px] font-bold text-zinc-600 text-center">+{dayEvents.length - 2} more</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Compact */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[1.5rem] p-5">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4">Service Health</h3>
            <div className="space-y-3">
               <CategoryRow label="Enterprise Nodes" percentage="64%" color="bg-orange-600" />
               <CategoryRow label="Standard Nodes" percentage="36%" color="bg-zinc-700" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change, icon }: any) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl hover:bg-zinc-800/40 transition-all">
      <div className="flex justify-between items-center mb-2">
        <div className="text-zinc-500">{icon}</div>
        <span className="text-[7px] font-black px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">{change}</span>
      </div>
      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-0.5">{label}</p>
      <h4 className="text-xl font-black italic tracking-tighter">{value}</h4>
    </div>
  );
}

function CategoryRow({ label, percentage, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-1 w-1 rounded-full ${color}`} />
        <span className="text-[8px] font-black text-zinc-500 uppercase">{label}</span>
      </div>
      <span className="text-[8px] font-black">{percentage}</span>
    </div>
  );
}