"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import {
  extractTenantId,
  matchesPlatformTab,
  normalizeUserRole,
  platformUserMergeKey,
  userDisplayName,
  type PlatformUserTab,
} from "@/lib/organizationUsers";

interface PlatformUserRow {
  id: string;
  uid: string;
  tenantNodeId: string | null;
  orgName: string;
  status: string;
  email: string;
  name: string;
  role: string;
  fullPath: string;
}

function isRootUsersPath(path: string) {
  return path.split("/").length === 2;
}

function mergeRows(existing: PlatformUserRow, incoming: PlatformUserRow): PlatformUserRow {
  const keep = isRootUsersPath(existing.fullPath) ? existing : incoming;
  const other = keep === existing ? incoming : existing;

  return {
    ...other,
    ...keep,
    uid: keep.uid || other.uid,
    name: keep.name || other.name,
    email: keep.email !== "No Email" ? keep.email : other.email,
    orgName:
      keep.orgName !== "Mobile app (no org linked)" ? keep.orgName : other.orgName,
    tenantNodeId: keep.tenantNodeId || other.tenantNodeId,
    fullPath: keep.fullPath,
    role: keep.role,
  };
}

export default function PlatformUsers() {
  const [activeTab, setActiveTab] = useState<PlatformUserTab>("admins");
  const [rootUsers, setRootUsers] = useState<PlatformUserRow[]>([]);
  const [tenantTrainers, setTenantTrainers] = useState<PlatformUserRow[]>([]);
  const [tenantSubUsers, setTenantSubUsers] = useState<PlatformUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasMounted, setHasMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<PlatformUserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orgNames, setOrgNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const resolveOrgName = async (tenantId: string | null): Promise<string> => {
    if (!tenantId) return "Mobile app (no org linked)";
    if (orgNames[tenantId]) return orgNames[tenantId];
    try {
      const tenantSnap = await getDoc(doc(db, "tenants", tenantId));
      const name = tenantSnap.exists()
        ? (tenantSnap.data().name as string) || "Unnamed Org"
        : "Unnamed Org";
      setOrgNames((prev) => ({ ...prev, [tenantId]: name }));
      return name;
    } catch {
      return "Unnamed Org";
    }
  };

  useEffect(() => {
    if (!hasMounted) return;

    setLoading(true);
    let rootReady = false;
    let trainersReady = false;
    let subUsersReady = false;

    const maybeDone = () => {
      if (rootReady && trainersReady && subUsersReady) setLoading(false);
    };

    const unsubRoot = onSnapshot(
      collection(db, "users"),
      async (snapshot) => {
        const rows: PlatformUserRow[] = [];
        for (const docSnap of snapshot.docs) {
          const raw = docSnap.data() as Record<string, unknown>;
          const role = normalizeUserRole(raw);
          if (role === "super_admin") continue;

          const tenantId = extractTenantId(raw);
          const uid = (typeof raw.uid === "string" && raw.uid) || docSnap.id;
          rows.push({
            id: docSnap.id,
            uid,
            tenantNodeId: tenantId,
            orgName: await resolveOrgName(tenantId),
            status: String(raw.status || "active").toLowerCase(),
            email: typeof raw.email === "string" ? raw.email : "No Email",
            name: userDisplayName(raw),
            role,
            fullPath: docSnap.ref.path,
          });
        }
        setRootUsers(rows);
        rootReady = true;
        maybeDone();
      },
      (err) => {
        console.error("Root users load failed:", err);
        rootReady = true;
        maybeDone();
      }
    );

    const unsubTrainers = onSnapshot(
      collectionGroup(db, "trainers"),
      async (snapshot) => {
        const rows: PlatformUserRow[] = [];
        for (const docSnap of snapshot.docs) {
          if (docSnap.ref.path.split("/").length !== 4) continue;
          const raw = docSnap.data() as Record<string, unknown>;
          const tenantId = docSnap.ref.path.split("/")[1];
          const uid = (typeof raw.uid === "string" && raw.uid) || docSnap.id;
          rows.push({
            id: docSnap.id,
            uid,
            tenantNodeId: tenantId,
            orgName: await resolveOrgName(tenantId),
            status: String(raw.status || "active").toLowerCase(),
            email: typeof raw.email === "string" ? raw.email : "No Email",
            name: userDisplayName(raw),
            role: "trainer",
            fullPath: docSnap.ref.path,
          });
        }
        setTenantTrainers(rows);
        trainersReady = true;
        maybeDone();
      },
      (err) => {
        console.error("Tenant trainers load failed:", err);
        trainersReady = true;
        maybeDone();
      }
    );

    const unsubSubUsers = onSnapshot(
      collectionGroup(db, "users"),
      async (snapshot) => {
        const rows: PlatformUserRow[] = [];
        for (const docSnap of snapshot.docs) {
          if (docSnap.ref.path.split("/").length !== 4) continue;
          const raw = docSnap.data() as Record<string, unknown>;
          const tenantId = docSnap.ref.path.split("/")[1];
          const uid = (typeof raw.uid === "string" && raw.uid) || docSnap.id;
          rows.push({
            id: docSnap.id,
            uid,
            tenantNodeId: tenantId,
            orgName: await resolveOrgName(tenantId),
            status: String(raw.status || "active").toLowerCase(),
            email: typeof raw.email === "string" ? raw.email : "No Email",
            name: userDisplayName(raw),
            role: normalizeUserRole(raw),
            fullPath: docSnap.ref.path,
          });
        }
        setTenantSubUsers(rows);
        subUsersReady = true;
        maybeDone();
      },
      (err) => {
        console.error("Tenant sub-users load failed:", err);
        subUsersReady = true;
        maybeDone();
      }
    );

    return () => {
      unsubRoot();
      unsubTrainers();
      unsubSubUsers();
    };
  }, [hasMounted]);

  const mergeForTab = (tab: PlatformUserTab): PlatformUserRow[] => {
    const merged = new Map<string, PlatformUserRow>();

    const add = (row: PlatformUserRow) => {
      if (!matchesPlatformTab(row.role, tab)) return;

      const key = platformUserMergeKey(row.uid, row.email, row.fullPath);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, row);
        return;
      }
      merged.set(key, mergeRows(existing, row));
    };

    rootUsers.forEach(add);

    if (tab === "trainers") {
      tenantTrainers.forEach(add);
    }

    if (tab === "admins" || tab === "users") {
      tenantSubUsers.forEach((row) => {
        if (tab === "admins" && row.role === "admin") add(row);
        if (tab === "users" && row.role === "user") add(row);
      });
    }

    return Array.from(merged.values()).sort((a, b) =>
      (a.name || a.email).localeCompare(b.name || b.email)
    );
  };

  const usersData = useMemo(
    () => mergeForTab(activeTab),
    [rootUsers, tenantTrainers, tenantSubUsers, activeTab]
  );

  const tabCounts = useMemo(
    () => ({
      admins: mergeForTab("admins").length,
      trainers: mergeForTab("trainers").length,
      users: mergeForTab("users").length,
    }),
    [rootUsers, tenantTrainers, tenantSubUsers]
  );

  const handleToggleStatus = async (user: PlatformUserRow) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, user.fullPath), { status: newStatus });
      toast.success(`Node updated: ${newStatus}`);
    } catch (error) {
      toast.error("Status toggle failed");
    }
  };

  const handleDelete = async () => {
    if (!userToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, userToDelete.fullPath));
      toast.success("Record deleted from Firestore");
      setIsModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Delete failed — check Firestore rules or try Firebase Console");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = usersData.filter(
    (u) =>
      (u.orgName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.tenantNodeId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.uid?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (!hasMounted) return null;

  return (
    <div className="relative min-h-screen bg-black text-zinc-400 p-4 md:p-8 font-sans">
      {isModalOpen && userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h2 className="text-white text-lg font-black uppercase mb-4">Delete Firestore record</h2>
            <p className="text-zinc-500 text-xs mb-4">
              Removes only this document (not Firebase Auth):
            </p>
            <p className="text-[10px] font-mono text-orange-400 mb-6 break-all">{userToDelete.fullPath}</p>
            <p className="text-zinc-400 text-sm mb-6">
              <span className="text-white font-bold">{userToDelete.name || "No name"}</span>
              <br />
              {userToDelete.email}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setUserToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 bg-zinc-800 py-3 rounded-xl font-bold uppercase text-[10px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold uppercase text-[10px] disabled:opacity-50"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
          Platform <span className="text-orange-600">Nodes</span>
        </h2>
        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-2">
          Root users + tenant sub-collections (merged only when same UID or email)
        </p>
      </div>

      <div className="relative mb-10 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
        <input
          className="w-full bg-zinc-900/40 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-xs text-white outline-none focus:border-orange-600/40"
          placeholder="Filter by Org, Name, Email, Tenant ID or UID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex bg-zinc-900/40 p-1 rounded-2xl border border-zinc-800 mb-8">
        {(["admins", "trainers", "users"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === t ? "bg-orange-600 text-white shadow-lg" : "text-zinc-600"
            }`}
          >
            {t} ({tabCounts[t]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center uppercase text-[10px] tracking-[0.5em]">Syncing Stream...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest">
          No {activeTab} in this stream
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/5">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/60 border-b border-zinc-800">
              <tr>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-zinc-500">
                  Organization Entity
                </th>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-zinc-500">
                  {activeTab} Stream
                </th>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-zinc-500 text-center">
                  Status
                </th>
                <th className="px-8 py-4 text-[9px] font-black uppercase text-zinc-500 text-right">
                  Control
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {filtered.map((user) => (
                <tr
                  key={platformUserMergeKey(user.uid, user.email, user.fullPath)}
                  className="hover:bg-zinc-900/40 transition-colors"
                >
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-[11px] uppercase tracking-wide">
                        {user.orgName}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-600 mt-0.5">
                        {user.tenantNodeId || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-[11px]">
                        {user.name || user.email}
                      </span>
                      <span className="text-zinc-300 font-medium text-[10px]">{user.email}</span>
                      <span className="text-[8px] font-mono text-zinc-600 mt-0.5 tracking-tighter">
                        UID: {user.uid}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-700 mt-1 break-all">
                        {user.fullPath}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user)}
                      className={`mx-auto flex items-center gap-2 px-3 py-1 rounded-full border text-[8px] font-black uppercase transition-all ${
                        user.status === "active"
                          ? "bg-orange-500/5 border-orange-500/30 text-orange-500"
                          : "bg-zinc-800 border-zinc-700 text-zinc-600"
                      }`}
                    >
                      <div
                        className={`h-1 w-1 rounded-full ${
                          user.status === "active" ? "bg-orange-500" : "bg-zinc-600"
                        }`}
                      />
                      {user.status}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setUserToDelete(user);
                        setIsModalOpen(true);
                      }}
                      className="text-zinc-700 hover:text-red-500 transition-colors"
                      aria-label="Delete user record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
