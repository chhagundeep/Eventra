"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Trash2, Shield, Mail, User } from "lucide-react";

interface OrganizationUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OrganizationTableProps {
  tenantId: string; // This fixes the error in your screenshot
}

export default function OrganizationTable({ tenantId }: OrganizationTableProps) {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    // Listen to the specific sub-collection for this tenant
    const q = query(collection(db, `tenants/${tenantId}/users`));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OrganizationUser[];
      
      setUsers(userList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  if (loading) return <div className="p-10 text-zinc-500 animate-pulse">Initializing Data Stream...</div>;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Operator</th>
            <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Access Level</th>
            <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-20 text-center text-zinc-600 italic text-sm">
                No operators found in this node infrastructure.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="group border-b border-zinc-900 hover:bg-white/[0.02] transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-zinc-400 group-hover:border-orange-600 transition-colors">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{user.name}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1">
                        <Mail size={10} /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/10 border border-orange-600/20 text-orange-500 text-[10px] font-black uppercase tracking-tighter">
                    <Shield size={12} />
                    {user.role || "Operator"}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <button className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}