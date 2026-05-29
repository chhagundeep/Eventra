// src/components/PublicNavbar.tsx
"use client";

import Link from "next/link";
import { Search, ChevronDown, Menu, Sun, Moon } from "lucide-react";
import Logo from "@/components/Logo";

// 1. Define the props interface
interface PublicNavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
}

// 2. Accept the props in the function arguments
export default function PublicNavbar({ isDark, toggleTheme }: PublicNavbarProps) {
  return (
    <header className={`w-full border-b sticky top-0 z-[100] transition-colors duration-300 ${
      isDark ? "bg-[#1a1a1a] border-zinc-800" : "bg-white border-zinc-200"
    }`}>
      {/* --- TOP BAR --- */}
      <div className="max-w-7xl mx-auto h-16 px-4 md:px-8 flex items-center justify-between gap-8">
        <Logo
          href="/"
          size={40}
          textClassName={`text-2xl font-black tracking-tighter italic ${isDark ? "text-white" : "text-[#333]"}`}
        />

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#f84464]">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Search for Movies, Events, Plays, Sports and Activities"
            className={`w-full h-10 pl-10 pr-4 rounded-md text-sm outline-none transition-all border ${
              isDark 
                ? "bg-[#2b2b2b] border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500" 
                : "bg-white border-zinc-200 text-black placeholder:text-zinc-400 focus:border-zinc-300"
            }`}
          />
        </div>

        {/* Location, Theme Toggle & Actions */}
        <div className="flex items-center gap-4">
          {/* THEME TOGGLE BUTTON */}
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-zinc-800 text-yellow-400" : "hover:bg-zinc-100 text-zinc-600"}`}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className={`flex items-center gap-1 text-sm font-medium hover:opacity-80 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
            Jagraon <ChevronDown size={14} className="mt-0.5" />
          </button>
          
          <Link href="/login">
            <button className="bg-[#f84464] text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-[#ff4d6d] transition-all">
              Sign in
            </button>
          </Link>

          <button className={isDark ? "text-zinc-400" : "text-zinc-600"}>
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* --- SUB BAR (Categories) --- */}
      <div className={`h-10 w-full px-4 md:px-8 border-b transition-colors ${
        isDark ? "bg-[#252525] border-zinc-800" : "bg-[#f5f5f5] border-zinc-200"
      }`}>
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between text-[13px] font-medium">
          <div className={`flex items-center gap-6 ${isDark ? "text-zinc-400" : "text-zinc-700"}`}>
            <Link href="#" className="hover:text-[#f84464]">Workshops</Link>
            <Link href="#" className="hover:text-[#f84464]">Events</Link>
            <Link href="#" className="hover:text-[#f84464]">Plays</Link>
            <Link href="#" className="hover:text-[#f84464]">Sports</Link>
          </div>
        </div>
      </div>
    </header>
  );
}