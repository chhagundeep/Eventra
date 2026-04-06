"use client";

import { useState, useEffect } from "react";
import PublicNavbar from "@/components/PublicNavbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Sync the 'dark' class with the root <html> element for Tailwind
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-[#0f0f0f]">
      {/* Navbar stays at the top of every public page */}
      <PublicNavbar isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />
      
      <main className="w-full min-h-[calc(100vh-80px)]">
        {children}
      </main>
    </div>
  );
}