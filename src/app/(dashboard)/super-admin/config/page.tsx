"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, Shield, Zap, Globe, Database, 
  Save, AlertTriangle, Cpu, Activity, Clock
} from "lucide-react";

// NOTE: When ready for Firebase, uncomment these:
// import { db } from "@/lib/firebase"; 
// import { doc, updateDoc, onSnapshot, collection, addDoc } from "firebase/firestore";

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [latency, setLatency] = useState(12);
  
  // --- DYNAMIC STATE ---
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

  // 1. DYNAMIC HEARTBEAT (Simulates live infrastructure)
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * (25 - 10 + 1) + 10));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. SAVE CHANGES & LOG AUDIT
  const handleDeploy = async () => {
    setIsSaving(true);
    
    // Simulate API/Firebase Latency
    setTimeout(() => {
      setIsSaving(false);
      
      // Add a fresh log to the top of the list
      const newLog = { 
        id: Date.now(), 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        action: "Global Config Update", 
        status: "DEPLOYED", 
        user: "SuperAdmin_RA" 
      };
      setAuditLogs([newLog, ...auditLogs.slice(0, 4)]);
      
      // In a real app, you would perform your updateDoc here.
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none mb-4">
            System <span className="text-orange-600">Config</span>
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] flex items-center gap-2">
            <Cpu size={12} className="text-orange-600" />
            Kernel Version 4.0.2 // Eventra Core
          </p>
        </div>
        <button 
          onClick={handleDeploy}
          disabled={isSaving}
          className="px-8 py-4 bg-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-orange-900/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSaving ? "Syncing..." : <><Save size={16} /> Deploy Changes</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <ConfigTab id="general" label="Platform Engine" icon={<Globe size={18}/>} active={activeTab === "general"} onClick={setActiveTab} />
          <ConfigTab id="security" label="Auth & Security" icon={<Shield size={18}/>} active={activeTab === "security"} onClick={setActiveTab} />
          <ConfigTab id="database" label="Firestore Nodes" icon={<Database size={18}/>} active={activeTab === "database"} onClick={setActiveTab} />
          <ConfigTab id="api" label="API Orchestration" icon={<Zap size={18}/>} active={activeTab === "api"} onClick={setActiveTab} />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] p-10 backdrop-blur-xl min-h-125">
            
            {/* PLATFORM ENGINE / GENERAL */}
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <section>
                  <h3 className="text-xl font-black italic tracking-tight mb-6 uppercase">Global Directives</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ConfigToggle 
                      title="Maintenance Mode" 
                      desc="Redirect all traffic to a 503 status page globally." 
                      enabled={config.maintenanceMode}
                      onToggle={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                    />
                    <ConfigToggle 
                      title="New Tenant Registration" 
                      desc="Allow new organizations to create accounts." 
                      enabled={config.newRegistration}
                      onToggle={() => setConfig({...config, newRegistration: !config.newRegistration})}
                    />
                  </div>
                </section>

                <hr className="border-zinc-800/50" />

                <section>
                  <h3 className="text-xl font-black italic tracking-tight mb-6 uppercase">Real-Time Audit Logs</h3>
                  <div className="space-y-3">
                    {auditLogs.map(log => (
                      <AuditEntry key={log.id} {...log} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* AUTH & SECURITY */}
            {activeTab === "security" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h3 className="text-xl font-black italic tracking-tight uppercase">Permission Matrix</h3>
                <div className="overflow-hidden border border-zinc-800 rounded-2xl bg-black/40">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/50">
                        <th className="p-4 font-black uppercase text-zinc-500">Feature Node</th>
                        <th className="p-4 font-black uppercase text-orange-600">Super Admin</th>
                        <th className="p-4 font-black uppercase text-zinc-300">Org Admin</th>
                        <th className="p-4 font-black uppercase text-zinc-300">User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      <PermissionRow feature="System Config" roles={[true, false, false]} />
                      <PermissionRow feature="Billing & Invoices" roles={[true, true, false]} />
                      <PermissionRow feature="Event Management" roles={[true, true, true]} />
                      <PermissionRow feature="User Deletion" roles={[true, false, false]} />
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FIRESTORE NODES */}
            {activeTab === "database" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h3 className="text-xl font-black italic tracking-tight uppercase">Database Topology</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-black/40 border border-zinc-800 rounded-2xl">
                        <p className="text-[10px] font-black text-orange-500 uppercase mb-2">Primary Node</p>
                        <p className="text-lg font-bold">us-central1 (Firestore)</p>
                        <p className="text-xs text-zinc-500 mt-1">Multi-tenant sub-collections enabled.</p>
                    </div>
                    <div className="p-6 bg-black/40 border border-zinc-800 rounded-2xl">
                        <p className="text-[10px] font-black text-emerald-500 uppercase mb-2">Backups</p>
                        <p className="text-lg font-bold">Daily Snapshot</p>
                        <p className="text-xs text-zinc-500 mt-1">Retention period: 30 days.</p>
                    </div>
                </div>
              </div>
            )}

            {/* API ORCHESTRATION */}
            {activeTab === "api" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-orange-600/5 border border-orange-600/20 p-6 rounded-2xl flex items-start gap-4">
                  <AlertTriangle className="text-orange-500 shrink-0" />
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                    <strong className="text-white">Kernel Warning:</strong> Adjusting rate limits affects the real-time performance of all tenant nodes. Current Tier: <span className="text-orange-500 uppercase font-black">Firebase Blaze</span>.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-xl font-black italic tracking-tight uppercase">Resource Allocation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricSelector label="Active Throughput" value={`${latency * 42} req/m`} />
                    <MetricSelector label="Pro Tier Limit" value={config.apiLimit} />
                    <MetricSelector label="Global Latency" value={`${latency}ms`} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Infrastructure Health Footer */}
          <div className="bg-zinc-900/10 border border-zinc-800/50 rounded-4xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 bg-black rounded-xl border border-zinc-800 flex items-center justify-center transition-colors ${latency > 20 ? 'text-orange-500' : 'text-emerald-500'}`}>
                <Activity size={24} className={latency > 20 ? 'animate-pulse' : ''} />
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Node-01 Health Status</p>
                <p className="text-xs font-bold text-white uppercase tracking-tight">
                  {latency > 20 ? "High Latency Detected" : "All Systems Nominal"} // {latency}ms
                </p>
              </div>
            </div>
            <div className="flex gap-1 h-8 items-end">
              {[4, 7, 5, 9, 6, 8, 5, 10, 8, 7].map((h, i) => (
                <div key={i} className={`w-1 rounded-full transition-all duration-500 ${latency > 20 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ height: `${h * 10}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function PermissionRow({ feature, roles }: { feature: string, roles: boolean[] }) {
  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="p-4 font-bold text-zinc-400 italic">{feature}</td>
      {roles.map((r, i) => (
        <td key={i} className="p-4 text-center">
          <div className={`h-2 w-2 rounded-full mx-auto ${r ? 'bg-orange-500 shadow-[0_0_8px_rgba(234,88,12,0.6)]' : 'bg-zinc-800'}`} />
        </td>
      ))}
    </tr>
  );
}

function AuditEntry({ time, action, status, user }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-black/40 border border-zinc-800/50 rounded-xl group hover:border-zinc-600 transition-all animate-in slide-in-from-top-2">
      <div className="flex items-center gap-4">
        <Clock size={14} className="text-zinc-600" />
        <div>
          <p className="text-[10px] font-black text-white uppercase tracking-wider">{action}</p>
          <p className="text-[9px] text-zinc-500 font-bold uppercase">{user} • {time}</p>
        </div>
      </div>
      <span className="text-[9px] font-black px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-400 group-hover:text-orange-500 transition-colors">
        {status}
      </span>
    </div>
  );
}

function ConfigTab({ label, icon, active, onClick, id }: any) {
  return (
    <button 
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
        active 
          ? "bg-orange-600 text-white shadow-xl shadow-orange-900/20" 
          : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
      }`}
    >
      {icon}
      <span className="tracking-tight uppercase text-[11px] font-black">{label}</span>
    </button>
  );
}

function ConfigToggle({ title, desc, enabled, onToggle }: any) {
  return (
    <div className="p-6 bg-black/40 border border-zinc-800/50 rounded-2xl flex items-center justify-between hover:border-zinc-700 transition-all">
      <div className="space-y-1">
        <p className="text-[11px] font-black uppercase text-white tracking-wide italic">{title}</p>
        <p className="text-[10px] text-zinc-600 font-medium leading-tight max-w-50">{desc}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`w-10 h-5 rounded-full transition-all relative ${enabled ? 'bg-orange-600' : 'bg-zinc-800'}`}
      >
        <div className={`absolute top-1 h-3 w-3 bg-white rounded-full transition-all ${enabled ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  );
}

function MetricSelector({ label, value }: any) {
  return (
    <div className="bg-black/40 border border-zinc-800 rounded-2xl p-6 text-center group hover:border-orange-600/50 transition-all">
      <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 group-hover:text-orange-500 tracking-[0.2em]">{label}</p>
      <p className="text-xl font-black italic text-white tracking-tighter">{value}</p>
    </div>
  );
}