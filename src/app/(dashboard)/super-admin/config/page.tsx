"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, Zap, Globe, Database, 
  Save, AlertTriangle, Cpu, Activity, Clock, 
  Gamepad2, Music, BookOpen, Languages, Camera, 
  Shirt, Leaf, Dumbbell, Dog, Palette, 
  Trophy, DollarSign, Briefcase, Plane, Car, 
  Accessibility, Hammer
} from "lucide-react";
import { db } from "@/lib/firebase"; 
import { 
  doc, 
  writeBatch, 
  serverTimestamp, 
  collection, 
  getDocs 
} from "firebase/firestore";

const CATEGORY_DATA = [
  { id: "gaming", name: "Gaming", iconName: "Gamepad2", description: "E-sports and gaming events.", searchTags: ["esports", "streaming", "pc"] },
  { id: "music", name: "Music", iconName: "Music", description: "Concerts and music lessons.", searchTags: ["live", "instruments", "vocals"] },
  { id: "book", name: "Book", iconName: "BookOpen", description: "Reading clubs and author meets.", searchTags: ["literature", "writing", "library"] },
  { id: "language", name: "Language", iconName: "Languages", description: "Language exchange and learning.", searchTags: ["polyglot", "translation", "culture"] },
  { id: "photography", name: "Photography", iconName: "Camera", description: "Visual arts and editing classes.", searchTags: ["editing", "dslr", "portfolio"] },
  { id: "fashion", name: "Fashion", iconName: "Shirt", description: "Style and apparel design.", searchTags: ["apparel", "design", "modeling"] },
  { id: "nature", name: "Nature", iconName: "Leaf", description: "Outdoor adventures and conservation.", searchTags: ["hiking", "eco", "wildlife"] },
  { id: "fitness", name: "Fitness", iconName: "Dumbbell", description: "Health and physical training.", searchTags: ["gym", "workout", "cardio"] },
  { id: "animal", name: "Animal", iconName: "Dog", description: "Pet meets and animal welfare.", searchTags: ["pets", "veterinary", "adoption"] },
  { id: "arts", name: "Arts", iconName: "Palette", description: "Visual and creative expressions.", searchTags: ["painting", "sculpture", "gallery"] },
  { id: "sports", name: "Sports", iconName: "Trophy", description: "Competitive athletic events.", searchTags: ["football", "basketball", "athlete"] },
  { id: "finance", name: "Finance", iconName: "DollarSign", description: "Wealth management and markets.", searchTags: ["trading", "investment", "crypto"] },
  { id: "technology", name: "Technology", iconName: "Cpu", description: "Gadgets, AI, and hardware.", searchTags: ["hardware", "coding", "robotics"] },
  { id: "business", name: "Business", iconName: "Briefcase", description: "Entrepreneurship and networking.", searchTags: ["startup", "corporate", "marketing"] },
  { id: "travel", name: "Travel", iconName: "Plane", description: "Tourism and exploration.", searchTags: ["vacation", "backpacking", "hotel"] },
  { id: "cars", name: "Cars", iconName: "Car", description: "Automotive and motorsports.", searchTags: ["racing", "luxury", "ev"] },
  { id: "dance", name: "Dance", iconName: "Accessibility", description: "Movement and performance arts.", searchTags: ["zumba", "salsa", "hiphop"] },
  { id: "workshop", name: "Workshop", iconName: "Hammer", description: "Skill-building and DIY projects.", searchTags: ["craft", "learning", "skills"] }
];

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [latency, setLatency] = useState(12);
  
  const [config, setConfig] = useState({
    maintenanceMode: false,
    newRegistration: true,
    baseUrl: "https://eventra-saas.v1",
    apiLimit: "10,000 req/hr"
  });

  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: "02:45 PM", action: "System Initialized", status: "SUCCESS", user: "Kernel_Root" },
    { id: 2, time: "01:20 PM", action: "Node Migration", status: "COMPLETED", user: "System_Kernel" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * (25 - 10 + 1) + 10));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDeploy = async () => {
    setIsSaving(true);
    const batch = writeBatch(db);

    try {
      // 1. CLEANUP PHASE: Wipe existing collection
      const snapshot = await getDocs(collection(db, "categories"));
      snapshot.docs.forEach((oldDoc) => {
        batch.delete(oldDoc.ref);
      });

      // 2. SEED PHASE: Batch set new data
      CATEGORY_DATA.forEach((cat) => {
        const docRef = doc(db, "categories", cat.id);
        batch.set(docRef, {
          name: cat.name,
          iconName: cat.iconName,
          description: cat.description,
          isActive: true,
          updatedAt: serverTimestamp(),
          searchTags: cat.searchTags, 
        });
      });

      await batch.commit();

      const newLog = { 
        id: Date.now(), 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        action: "Atomic Wipe & Sync", 
        status: "DEPLOYED", 
        user: "SuperAdmin_RA" 
      };
      setAuditLogs([newLog, ...auditLogs.slice(0, 4)]);
      alert(`System Sync Complete: ${CATEGORY_DATA.length} categories live.`);
    } catch (error) {
      console.error("Deployment failed:", error);
      alert("Deployment Error: Database Kernel Sync failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none mb-3 md:mb-4">
            System <span className="text-orange-600">Config</span>
          </h2>
          <p className="text-[8px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] flex items-center gap-2">
            <Cpu size={12} className="text-orange-600" />
            Kernel Version 4.0.2 // Eventra Core
          </p>
        </div>
        <button 
          onClick={handleDeploy}
          disabled={isSaving}
          className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-orange-600 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 hover:scale-105 transition-all disabled:opacity-50"
        >
          {isSaving ? <Activity className="animate-spin" size={16} /> : <><Save size={16} /> Deploy Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Navigation */}
        <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <ConfigTab id="general" label="Engine" icon={<Globe size={18}/>} active={activeTab === "general"} onClick={setActiveTab} />
          <ConfigTab id="security" label="Auth" icon={<Shield size={18}/>} active={activeTab === "security"} onClick={setActiveTab} />
          <ConfigTab id="database" label="Nodes" icon={<Database size={18}/>} active={activeTab === "database"} onClick={setActiveTab} />
          <ConfigTab id="api" label="API" icon={<Zap size={18}/>} active={activeTab === "api"} onClick={setActiveTab} />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 backdrop-blur-xl min-h-[400px]">
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <section>
                  <h3 className="text-lg md:text-xl font-black italic tracking-tight mb-6 uppercase">Global Directives</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <ConfigToggle 
                      title="Maintenance Mode" 
                      desc="Redirect all traffic to a 503 status page globally." 
                      enabled={config.maintenanceMode}
                      onToggle={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                    />
                    <ConfigToggle 
                      title="Tenant Reg" 
                      desc="Allow new organizations to create accounts." 
                      enabled={config.newRegistration}
                      onToggle={() => setConfig({...config, newRegistration: !config.newRegistration})}
                    />
                  </div>
                </section>
                <hr className="border-zinc-800/50" />
                <section>
                  <h3 className="text-lg md:text-xl font-black italic tracking-tight mb-6 uppercase">Real-Time Audit Logs</h3>
                  <div className="space-y-3">
                    {auditLogs.map(log => (
                      <AuditEntry key={log.id} {...log} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h3 className="text-lg md:text-xl font-black italic tracking-tight uppercase">Permission Matrix</h3>
                <div className="overflow-x-auto border border-zinc-800 rounded-2xl bg-black/40">
                  <table className="w-full text-left text-[10px] md:text-xs min-w-[400px]">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/50">
                        <th className="p-4 font-black uppercase text-zinc-500">Feature Node</th>
                        <th className="p-4 font-black uppercase text-orange-600 text-center">Super</th>
                        <th className="p-4 font-black uppercase text-zinc-300 text-center">Org</th>
                        <th className="p-4 font-black uppercase text-zinc-300 text-center">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      <PermissionRow feature="System Config" roles={[true, false, false]} />
                      <PermissionRow feature="Billing" roles={[true, true, false]} />
                      <PermissionRow feature="Events" roles={[true, true, true]} />
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "database" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h3 className="text-lg md:text-xl font-black italic tracking-tight uppercase">Database Topology</h3>
                <div className="p-4 md:p-6 bg-orange-600/10 border border-orange-600/30 rounded-xl md:rounded-2xl mb-4">
                  <p className="text-[10px] md:text-xs font-bold text-orange-500 uppercase flex items-center gap-2">
                    <Database size={14} /> Batch Ready: {CATEGORY_DATA.length} Global Nodes
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="p-4 md:p-6 bg-black/40 border border-zinc-800 rounded-xl md:rounded-2xl">
                    <p className="text-[10px] font-black text-orange-500 uppercase mb-2">Primary Node</p>
                    <p className="text-base md:text-lg font-bold">us-central1 (Firestore)</p>
                    <p className="text-[10px] md:text-xs text-zinc-500 mt-1">Multi-tenant root structure.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-orange-600/5 border border-orange-600/20 p-4 md:p-6 rounded-xl md:rounded-2xl flex items-start gap-4">
                  <AlertTriangle className="text-orange-500 shrink-0" size={18} />
                  <p className="text-[10px] md:text-xs text-zinc-400 font-medium leading-relaxed">
                    <strong className="text-white">Kernel Warning:</strong> Tier: <span className="text-orange-500 uppercase font-black">Firebase Blaze</span>. Active scaling is enabled.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <MetricSelector label="Throughput" value={`${latency * 42} r/m`} />
                  <MetricSelector label="Limit" value={config.apiLimit.split(' ')[0]} />
                  <MetricSelector label="Latency" value={`${latency}ms`} />
                </div>
              </div>
            )}
          </div>

          {/* Status Footer */}
          <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-2xl md:rounded-[2rem] p-4 md:p-6 flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`h-10 w-10 md:h-12 md:w-12 bg-black rounded-lg md:rounded-xl border border-zinc-800 flex items-center justify-center ${latency > 20 ? 'text-orange-500' : 'text-emerald-500'}`}>
                <Activity size={20} className={latency > 20 ? 'animate-pulse' : ''} />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase">Health Status</p>
                <p className="text-[10px] md:text-xs font-bold text-white uppercase italic">
                  {latency > 20 ? "High Load" : "Nominal"} // {latency}ms
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components remains the same as your previous structure
function PermissionRow({ feature, roles }: { feature: string, roles: boolean[] }) {
  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="p-4 font-bold text-zinc-400 italic truncate max-w-[120px] md:max-w-none">{feature}</td>
      {roles.map((r, i) => (
        <td key={i} className="p-4">
          <div className={`h-2 w-2 rounded-full mx-auto ${r ? 'bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.6)]' : 'bg-zinc-800'}`} />
        </td>
      ))}
    </tr>
  );
}

function AuditEntry({ time, action, status, user }: any) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-black/40 border border-zinc-800/50 rounded-xl hover:border-zinc-700 transition-all gap-3">
      <div className="flex items-center gap-3 md:gap-4">
        <Clock size={14} className="text-zinc-600 shrink-0" />
        <div>
          <p className="text-[9px] md:text-[10px] font-black text-white uppercase">{action}</p>
          <p className="text-[8px] md:text-[9px] text-zinc-500 font-bold uppercase">{user} • {time}</p>
        </div>
      </div>
      <span className="text-[8px] md:text-[9px] font-black px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-400 self-end sm:self-auto">
        {status}
      </span>
    </div>
  );
}

function ConfigTab({ label, icon, active, onClick, id }: any) {
  return (
    <button 
      onClick={() => onClick(id)}
      className={`flex items-center gap-3 md:gap-4 px-5 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all whitespace-nowrap min-w-max lg:min-w-0 lg:w-full ${
        active 
          ? "bg-orange-600 text-white shadow-xl shadow-orange-900/20" 
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="tracking-tight uppercase text-[10px] md:text-[11px] font-black">{label}</span>
    </button>
  );
}

function ConfigToggle({ title, desc, enabled, onToggle }: any) {
  return (
    <div className="p-4 md:p-6 bg-black/40 border border-zinc-800/50 rounded-xl md:rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-all gap-4">
      <div className="space-y-1">
        <p className="text-[10px] md:text-[11px] font-black uppercase text-white tracking-wide italic">{title}</p>
        <p className="text-[8px] md:text-[10px] text-zinc-600 font-medium leading-tight max-w-[140px] md:max-w-[200px]">{desc}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`w-9 h-5 md:w-10 md:h-5 shrink-0 rounded-full transition-all relative ${enabled ? 'bg-orange-600' : 'bg-zinc-800'}`}
      >
        <div className={`absolute top-1 h-3 w-3 bg-white rounded-full transition-all ${enabled ? 'left-5 md:left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function MetricSelector({ label, value }: any) {
  return (
    <div className="bg-black/40 border border-zinc-800 rounded-xl md:rounded-2xl p-4 md:p-6 text-center hover:border-orange-600/50 transition-all">
      <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-[0.2em]">{label}</p>
      <p className="text-lg md:text-xl font-black italic text-white tracking-tighter">{value}</p>
    </div>
  );
}