"use client";

import React from "react";
import { LayoutDashboard, Building2, Users, Calendar, Settings, LogOut, Zap } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard, path: "/super-admin" },
    { name: "Organizations", icon: Building2, path: "/super-admin/organizations" },
    { name: "Platform Users", icon: Users, path: "/super-admin/users" },
    { name: "Schedule", icon: Calendar, path: "/super-admin/schedule" },
  ];

  return (
    // ADDED bg-[#0a0a0a] HERE TO FIX THE DOUBLE LOOK
    <div className="flex flex-col h-full p-6 bg-[#0a0a0a] border-r border-zinc-800/50">
      {/* Branding */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="h-9 w-9 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/40">
          <Zap size={20} color="white" fill="white" />
        </div>
        <span className="text-xl font-black tracking-tighter text-white uppercase italic">Eventra</span>
      </div>

      {/* Nav Links */}
      <nav className="space-y-1.5 flex-1">
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

        <div className="pt-8 pb-2 px-4 text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">
          System
        </div>

        <Link
          href="/super-admin/config"
          onClick={onClose}
          className="flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100 transition-all"
        >
          <Settings size={18} />
          Config
        </Link>
      </nav>

      {/* Logout */}
      <button 
        onClick={() => signOut(auth)} 
        className="flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm text-zinc-600 hover:bg-red-500/10 hover:text-red-500 transition-all mt-auto"
      >
        <LogOut size={18} />
        Terminate Session
      </button>
    </div>
  );
}