"use client";

import React from "react";
import { 
  LayoutDashboard, Building2, Users, Calendar, 
  Settings, LogOut, Zap, X, GraduationCap, 
  ClipboardList, Search, UserCircle 
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation"; 
import Link from "next/link";

const ROLE_MENUS = {
  "super-admin": [
    { name: "Overview", icon: LayoutDashboard, path: "/super-admin" },
    { name: "Organizations", icon: Building2, path: "/super-admin/organizations" },
    { name: "Platform Users", icon: Users, path: "/super-admin/platform-users" },
    { name: "Schedule", icon: Calendar, path: "/super-admin/schedule" },
  ],
  "admin": [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { name: "Staff Management", icon: GraduationCap, path: "/admin/trainers" },
    { name: "Organization Users", icon: Users, path: "/admin/users" },
    { name: "Events Manager", icon: Calendar, path: "/admin/events" },
  ],
  "trainer": [
    { name: "My Schedule", icon: Calendar, path: "/trainer/schedule" },
    { name: "Attendance", icon: ClipboardList, path: "/trainer/attendance" },
    { name: "Clients", icon: Users, path: "/trainer/clients" },
  ],
  "user": [
    { name: "Explore Events", icon: Search, path: "/user/explore" },
    { name: "My Bookings", icon: Calendar, path: "/user/bookings" },
    { name: "Profile", icon: UserCircle, path: "/user/profile" },
  ],
};

export default function Sidebar({ onClose, role = "super-admin" }: { onClose?: () => void, role?: keyof typeof ROLE_MENUS }) {
  const pathname = usePathname();
  const router = useRouter(); 

  // Guard: Ensure menuItems is never undefined if role is null/invalid
  const activeRole = role || "super-admin";
  const menuItems = ROLE_MENUS[activeRole] || ROLE_MENUS["super-admin"];

  const handleLogout = async () => {
    try {
      await signOut(auth); 
      router.replace("/"); 
      if (onClose) onClose();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-zinc-800/50">
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/40">
            <Zap size={20} color="white" fill="white" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase italic leading-none">
            Eventra
          </span>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-zinc-500 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="px-10 pb-4">
        <span className="text-[9px] font-black text-orange-600/60 uppercase tracking-[0.4em]">
          {/* FIXED: Added a fallback string 'Guest' in case role is null */}
          {(role || "Guest").replace("-", " ")} Mode
        </span>
      </div>

      <nav className="flex-1 px-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                isActive 
                  ? "bg-orange-600 text-white shadow-xl shadow-orange-900/20" 
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 3 : 2} />
              {item.name}
            </Link>
          );
        })}

        {(role === "super-admin" || role === "admin") && (
          <>
            <div className="pt-8 pb-2 px-4 text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">
              System
            </div>
            <Link
              href={`/${role}/config`}
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
                pathname.includes("config") 
                  ? "bg-orange-600 text-white" 
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              <Settings size={18} />
              Config
            </Link>
          </>
        )}
      </nav>

      <div className="p-6 border-t border-zinc-800/50">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm text-zinc-600 hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          <LogOut size={18} />
          Terminate Session
        </button>
      </div>
    </div>
  );
}