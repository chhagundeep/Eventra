"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "eventra-dashboard-theme";

type DashboardThemeContextValue = {
  isDark: boolean;
  toggleTheme: () => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light") setIsDark(false);
    else if (stored === "dark") setIsDark(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dashboard-light", !isDark);
    return () => document.body.classList.remove("dashboard-light");
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <DashboardThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div
        className={`min-h-full transition-colors duration-300 ${isDark ? "dark" : ""}`}
        data-dashboard-theme
        suppressHydrationWarning
      >
        {children}
      </div>
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  }
  return ctx;
}

/** Defaults to dark when outside admin/super-admin theme provider (e.g. trainer sidebar). */
export function useDashboardThemeOptional() {
  return useContext(DashboardThemeContext) ?? { isDark: true, toggleTheme: () => {} };
}

export function DashboardThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme } = useDashboardTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all w-full ${
        isDark
          ? "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"
          : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
      } ${className}`}
    >
      {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
      {isDark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
