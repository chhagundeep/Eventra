import { ChevronRight, Users, UserCog, Calendar, Trash2 } from "lucide-react";
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
      <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-900/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 font-black">
              <th className="px-6 py-5">Organization</th>
              <th className="px-6 py-5">Tier</th>
              <th className="px-6 py-5">Trainers</th>
              <th className="px-6 py-5">Users</th>
              <th className="px-6 py-5">Events</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {tenants.map((org) => (
              <tr key={org.id} className="group hover:bg-orange-600/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-500">
                      <span className="font-bold">{org.name?.[0] || 'O'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{org.name}</p>
                      <p className="text-[10px] text-zinc-500 lowercase">{org.adminEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                    org.plan === 'Enterprise' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {org.plan}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-400 text-xs">
                   <div className="flex items-center gap-1"><UserCog size={14}/> {org.trainerCount || 0}</div>
                </td>
                <td className="px-6 py-4 text-zinc-400 text-xs">
                   <div className="flex items-center gap-1"><Users size={14}/> {org.userCount || 0}</div>
                </td>
                <td className="px-6 py-4 text-zinc-400 text-xs">
                   <div className="flex items-center gap-1"><Calendar size={14}/> {org.eventCount || 0}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Active</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Delete Trigger */}
                    <button 
                      onClick={() => setSelectedOrg({ id: org.id, name: org.name })}
                      className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Terminate Organization"
                    >
                      <Trash2 size={16} />
                    </button>

                    <Link 
                      href={`/super-admin/organizations/${org.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                      Manage <ChevronRight size={14} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
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