"use client";

import { 
  ChevronRight, Users, UserCog, 
  Calendar, Trash2, ShieldCheck, 
  Fingerprint, Activity 
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import DeleteModal from "./DeleteModal";

export default function OrganizationTable({ 
  tenants, 
  onDeleteConfirm,
  isDeleting 
}: { 
  tenants: any[], 
  onDeleteConfirm: (id: string) => Promise<void>,
  isDeleting: boolean
}) {
  const [selectedOrg, setSelectedOrg] = useState<{id: string, name: string} | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-[2rem] border border-zinc-800/50 bg-zinc-900/20 backdrop-blur-md">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-zinc-800/50 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black bg-zinc-900/40">
              <th className="px-8 py-6">Identity & Organization</th>
              <th className="px-6 py-6">Access Hash</th>
              <th className="px-6 py-6 text-center">Service Metrics</th>
              <th className="px-6 py-6">Network Status</th>
              <th className="px-8 py-6 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {tenants.map((org) => (
              <tr key={org.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-400 group-hover:text-orange-500 transition-all shadow-lg">
                      <span className="font-black text-lg">{org.name?.[0] || 'O'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-base tracking-tight">{org.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck size={10} className="text-blue-500" />
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{org.adminEmail}</p>
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-5">
                  <div className="group/hash relative inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-lg cursor-help">
                    <Fingerprint size={14} className="text-orange-600" />
                    <span className="text-[11px] font-mono text-zinc-500 group-hover/hash:hidden tracking-widest">••••••••</span>
                    <span className="text-[11px] font-mono text-orange-500 hidden group-hover/hash:block">
                      {org.password || 'SECURED'}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center group/metric">
                      <p className="text-[10px] font-black text-zinc-600 uppercase group-hover/metric:text-zinc-400 transition-colors">Trainers</p>
                      <p className="text-sm font-bold text-zinc-300">{org.trainerCount || 0}</p>
                    </div>
                    <div className="text-center group/metric">
                      <p className="text-[10px] font-black text-zinc-600 uppercase group-hover/metric:text-zinc-400 transition-colors">Users</p>
                      <p className="text-sm font-bold text-zinc-300">{org.userCount || 0}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active Node</span>
                  </div>
                </td>

                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => setSelectedOrg({ id: org.id, name: org.name })}
                      className="p-2.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Decommission Node"
                    >
                      <Trash2 size={18} />
                    </button>

                    <Link 
                      href={`/super-admin/organizations/${org.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-xl shadow-black/40"
                    >
                      Management Hub <ChevronRight size={14} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteModal 
        isOpen={!!selectedOrg}
        onClose={() => setSelectedOrg(null)}
        orgName={selectedOrg?.name || ""}
        loading={isDeleting}
        onConfirm={async () => {
          if (selectedOrg) {
            await onDeleteConfirm(selectedOrg.id);
            setSelectedOrg(null);
          }
        }}
      />
    </>
  );
}