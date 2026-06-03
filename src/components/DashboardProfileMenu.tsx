"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, Sun, Moon, UserCircle, ChevronLeft, Upload, Loader2 } from "lucide-react";
import { signOut, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardTheme } from "@/contexts/DashboardThemeContext";
import toast from "react-hot-toast";

function initialsFromUser(displayName: string | null | undefined, email: string | null | undefined) {
  const source = displayName?.trim() || email?.split("@")[0] || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

type PanelView = "menu" | "profile";

export default function DashboardProfileMenu({
  isDark,
  fallbackLabel = "User",
}: {
  isDark: boolean;
  fallbackLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PanelView>("menu");
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [editName, setEditName] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { user, tenantId } = useAuth();
  const { isDark: themeIsDark, toggleTheme } = useDashboardTheme();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setView("menu");
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const openPanel = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setView("menu");
    setOpen(true);
  };

  const openProfileEdit = () => {
    setEditName(user?.displayName?.trim() || user?.email?.split("@")[0] || "");
    setEditPhotoUrl(user?.photoURL || "");
    setView("profile");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/");
      setOpen(false);
      setView("menu");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSaveProfile = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Name is required.");
      return;
    }
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      toast.error("Not signed in.");
      return;
    }

    setSaving(true);
    try {
      const photo = editPhotoUrl.trim() || null;
      await updateProfile(firebaseUser, {
        displayName: trimmed,
        photoURL: photo,
      });
      const profileFields = {
        name: trimmed,
        displayName: trimmed,
        photoURL: photo || "",
      };
      await updateDoc(doc(db, "users", firebaseUser.uid), profileFields);
      if (tenantId) {
        await setDoc(
          doc(db, "tenants", tenantId, "users", firebaseUser.uid),
          profileFields,
          { merge: true }
        );
      }
      toast.success("Profile updated.");
      setOpen(false);
      setView("menu");
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    user?.displayName?.trim() || user?.email?.split("@")[0] || fallbackLabel;
  const initials = initialsFromUser(user?.displayName, user?.email);
  const previewPhoto = editPhotoUrl;
  const previewInitials = initialsFromUser(
    view === "profile" ? editName : user?.displayName,
    user?.email
  );

  const menuBtn = isDark
    ? "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
    : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900";

  const panelClass = `rounded-2xl border shadow-2xl p-4 ${
    isDark ? "bg-[#0a0a0a] border-zinc-800" : "bg-white border-zinc-200"
  }`;

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-600 border ${
    isDark
      ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
      : "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400"
  }`;

  const panel =
    open && mounted ? (
      <div
        ref={rootRef}
        role="menu"
        className={`${panelClass} ${view === "profile" ? "w-80" : "w-64"}`}
        style={{
          position: "fixed",
          top: menuPos.top,
          right: menuPos.right,
          zIndex: 99999,
        }}
      >
        {view === "menu" ? (
          <>
            <div
              className={`flex items-center gap-3 pb-4 mb-2 border-b ${
                isDark ? "border-zinc-800" : "border-zinc-200"
              }`}
            >
              <div className="h-12 w-12 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-sm overflow-hidden shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <p
                className={`font-bold text-sm truncate ${isDark ? "text-white" : "text-zinc-900"}`}
                title={displayName}
              >
                {displayName}
              </p>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                role="menuitem"
                onClick={openProfileEdit}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all w-full ${menuBtn}`}
              >
                <UserCircle size={18} />
                Profile
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={toggleTheme}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all w-full ${menuBtn}`}
              >
                {themeIsDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
                {themeIsDark ? "Light Mode" : "Dark Mode"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm text-zinc-600 hover:bg-red-500/10 hover:text-red-500 transition-all"
              >
                <LogOut size={18} />
                Terminate Session
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setView("menu")}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-4 ${menuBtn}`}
            >
              <ChevronLeft size={14} /> Back
            </button>

            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="h-20 w-20 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-white text-lg overflow-hidden">
                {previewPhoto ? (
                  <img src={previewPhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  previewInitials
                )}
              </div>
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                onSuccess={(result: { info?: { secure_url?: string } }) => {
                  const url = result.info?.secure_url;
                  if (url) setEditPhotoUrl(url);
                }}
              >
                {({ open: openUpload }) => (
                  <button
                    type="button"
                    onClick={() => openUpload()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      isDark
                        ? "border-zinc-700 text-zinc-400 hover:border-orange-600"
                        : "border-zinc-300 text-zinc-600 hover:border-orange-600"
                    }`}
                  >
                    <Upload size={14} /> Change photo
                  </button>
                )}
              </CldUploadWidget>
            </div>

            <div className="space-y-2 mb-4">
              <label
                className={`text-[10px] font-black uppercase tracking-widest ml-1 ${
                  isDark ? "text-zinc-500" : "text-zinc-600"
                }`}
              >
                Display name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass}
                placeholder="Your name"
              />
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveProfile}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Save profile
            </button>
          </>
        )}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? (setOpen(false), setView("menu")) : openPanel())}
        aria-expanded={open}
        aria-haspopup="menu"
        className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-xs shadow-[0_0_15px_rgba(234,88,12,0.3)] overflow-hidden shrink-0"
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
