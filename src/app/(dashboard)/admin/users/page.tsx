"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { Trash2, Shield, Mail, User, Search, Loader2, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  isAppMemberRole,
  normalizeUserRole,
  shouldIncludeRootUser,
  userDisplayName,
} from "@/lib/organizationUsers";

interface OrganizationUser {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  role: string;
  status?: string;
  source?: "tenant" | "root" | "trainer";
}

type RoleFilter = "all" | "admin" | "trainer" | "user";

function docToUser(
  id: string,
  data: Record<string, unknown>,
  source: OrganizationUser["source"]
): OrganizationUser {
  return {
    id,
    uid: (typeof data.uid === "string" && data.uid) || id,
    name: userDisplayName(data),
    email: typeof data.email === "string" ? data.email : "",
    role: normalizeUserRole(data),
    status: typeof data.status === "string" ? data.status : undefined,
    source,
  };
}

function mergeUser(map: Map<string, OrganizationUser>, entry: OrganizationUser) {
  const key = entry.uid || entry.id;
  if (!key) return;

  const existing = map.get(key);
  if (!existing) {
    map.set(key, entry);
    return;
  }

  const roleRank = (r: string) =>
    r === "admin" ? 3 : r === "trainer" ? 2 : isAppMemberRole(r) ? 1 : 0;
  const role =
    roleRank(entry.role) >= roleRank(existing.role) ? entry.role : existing.role;

  map.set(key, {
    ...existing,
    ...entry,
    role,
    name: entry.name || existing.name,
    email: entry.email || existing.email,
    source: entry.source || existing.source,
  });
}

function roleBadgeClass(role: string) {
  switch (role) {
    case "admin":
      return "bg-orange-600/10 border-orange-600/20 text-orange-500";
    case "trainer":
      return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    default:
      if (isAppMemberRole(role)) {
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      }
      return "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";
  }
}

export default function OrganizationUsersPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  useEffect(() => {
    if (authLoading) return;

    if (!tenantId) {
      setUsers([]);
      setLoading(false);
      setError("No organization is linked to your account. Contact a platform administrator.");
      return;
    }

    setLoading(true);
    setError(null);

    const merged = new Map<string, OrganizationUser>();
    let pending = 3;
    let hadError = false;

    const finishSource = () => {
      pending -= 1;
      if (pending === 0) {
        const list = Array.from(merged.values()).sort((a, b) =>
          (a.name || a.email || "").localeCompare(b.name || b.email || "")
        );
        setUsers(list);
        setLoading(false);
        if (hadError && list.length === 0) {
          setError("Could not load users. Check your connection and permissions.");
        }
      }
    };

    const ingest = (
      snapshot: QuerySnapshot<DocumentData>,
      source: OrganizationUser["source"]
    ) => {
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        mergeUser(merged, docToUser(docSnap.id, data, source));
      });
      finishSource();
    };

    const onErr = (label: string, err: unknown) => {
      console.error(`Failed to load ${label}:`, err);
      hadError = true;
      finishSource();
    };

    const unsubs = [
      onSnapshot(
        query(collection(db, "tenants", tenantId, "users")),
        (snap) => ingest(snap, "tenant"),
        (err) => onErr("tenant users", err)
      ),
      onSnapshot(
        query(collection(db, "tenants", tenantId, "trainers")),
        (snap) => ingest(snap, "trainer"),
        (err) => onErr("trainers", err)
      ),
      // Root `users` — all roles (admin, trainer, user); mobile members often have no tenantId
      onSnapshot(
        collection(db, "users"),
        (snap) => {
          snap.docs.forEach((docSnap) => {
            const data = docSnap.data() as Record<string, unknown>;
            if (!shouldIncludeRootUser(data, tenantId)) return;
            mergeUser(merged, docToUser(docSnap.id, data, "root"));
          });
          finishSource();
        },
        (err) => onErr("root users", err)
      ),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [tenantId, authLoading]);

  const matchesRoleFilter = (user: OrganizationUser) => {
    if (roleFilter === "all") return true;
    if (roleFilter === "user") return isAppMemberRole(user.role);
    return user.role === roleFilter;
  };

  const filteredUsers = users.filter((user) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      (user.name || "").toLowerCase().includes(term) ||
      (user.email || "").toLowerCase().includes(term);
    return matchesSearch && matchesRoleFilter(user);
  });

  const counts = {
    all: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    trainer: users.filter((u) => u.role === "trainer").length,
    user: users.filter((u) => isAppMemberRole(u.role)).length,
  };

  if (authLoading || loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 pt-20 lg:pt-8 min-h-screen bg-black">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-zinc-900/40 p-5 lg:p-8 rounded-[1.5rem] lg:rounded-[2.5rem] border border-zinc-800/50 shadow-2xl">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight italic uppercase">
            Organization Users
          </h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Web admins, trainers &amp; mobile app members
          </p>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-orange-600 transition-all w-full"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["admin", "Admins"],
            ["trainer", "Trainers"],
            ["user", "App users"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setRoleFilter(key)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              roleFilter === key
                ? "bg-orange-600 text-white"
                : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white"
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Operator
                </th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Access Level
                </th>
                <th className="p-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-20 text-center text-zinc-600 italic text-sm">
                    {searchQuery || roleFilter !== "all"
                      ? "No users match your filters."
                      : "No users found in this organization yet."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.uid || user.id}
                    className="group border-b border-zinc-900 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-zinc-400 group-hover:border-orange-600 transition-colors">
                          {user.role === "trainer" ? (
                            <GraduationCap size={18} />
                          ) : (
                            <User size={18} />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">
                            {user.name || user.email?.split("@")[0] || "Unknown"}
                          </div>
                          <div className="text-xs text-zinc-500 flex items-center gap-1">
                            <Mail size={10} /> {user.email || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter ${roleBadgeClass(user.role)}`}
                      >
                        <Shield size={12} />
                        {isAppMemberRole(user.role) ? "user" : user.role}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        type="button"
                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                        aria-label="Remove user"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
