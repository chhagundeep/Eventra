"use client";

import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a]">
      {children}
    </div>
  );
}