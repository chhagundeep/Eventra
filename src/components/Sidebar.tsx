"use client";

import React from "react";
import { LayoutDashboard, Building2, Users, Calendar, Settings, LogOut, Zap, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { usePathname } from "next/navigation";

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        .sidebar-container { width: 280px; background-color: #0f172a; min-height: 100vh; display: flex; flex-direction: column; padding: 40px 24px; position: sticky; top: 0; }
        .logo-section { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; padding-left: 8px; }
        .nav-list { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .nav-item { display: flex; align-items: center; gap: 16px; padding: 14px 20px; border-radius: 16px; color: #94a3b8; cursor: pointer; text-decoration: none; font-weight: 700; font-size: 14px; transition: all 0.2s; }
        .nav-item:hover { background-color: #1e293b; color: white; }
        .nav-active { background-color: #1e293b; color: #f97316 ! from-orange-500; }
        .logout-btn { display: flex; align-items: center; gap: 12px; padding: 14px 20px; color: #64748b; font-weight: 700; font-size: 14px; cursor: pointer; border: none; background: none; margin-top: auto; border-radius: 16px; transition: 0.2s; }
        .logout-btn:hover { background-color: #7f1d1d20; color: #ef4444; }
      `}</style>

      <aside className="sidebar-container">
        <div className="logo-section">
          <div style={{ backgroundColor: '#f97316', padding: '8px', borderRadius: '12px' }}>
            <Zap size={20} color="white" fill="white" />
          </div>
          <span style={{ fontSize: '24px', fontWeight: '900', color: 'white', letterSpacing: '-1.5px' }}>eventra</span>
        </div>

        <nav className="nav-list">
          <div className={`nav-item ${pathname === '/super-admin' ? 'nav-active' : ''}`}><LayoutDashboard size={20} /> Overview</div>
          <div className="nav-item"><Building2 size={20} /> Organizations</div>
          <div className="nav-item"><Users size={20} /> Platform Users</div>
          <div className="nav-item"><Calendar size={20} /> Schedule</div>
          <div style={{ color: '#475569', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '20px', paddingLeft: '20px' }}>System</div>
          <div className="nav-item"><Settings size={20} /> Config</div>
        </nav>

        <button onClick={() => signOut(auth)} className="logout-btn">
          <LogOut size={20} /> Terminate Session
        </button>
      </aside>
    </>
  );
}