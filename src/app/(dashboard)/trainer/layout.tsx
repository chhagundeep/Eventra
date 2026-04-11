"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";

/**
 * TrainerLayout - Secure wrapper for all trainer-specific routes.
 * Ensures that non-trainers are redirected to login and 
 * provides a consistent UI structure with the Sidebar.
 */
export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is finished loading and there is no user, or the user is not a trainer
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "trainer") {
        // Prevent admins or users from accessing the trainer console
        router.push("/login"); 
      }
    }
  }, [user, role, loading, router]);

  // Show a full-screen loading state while checking permissions
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-orange-600 animate-spin" />
        <p className="text-zinc-500 font-black uppercase text-[10px] tracking-widest italic">
          Authenticating Trainer Portal...
        </p>
      </div>
    );
  }

  // If the user isn't a trainer, return null to prevent content flash while redirecting
  if (role !== "trainer") {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* 1. Sidebar Navigation - Role-aware component */}
      <Sidebar role="trainer" />

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Scrollable container for dashboard pages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {children}
        </div>
        
        {/* Optional: Simple footer or system status indicator */}
        <div className="absolute bottom-4 right-8 pointer-events-none">
          <p className="text-[9px] text-zinc-800 font-bold uppercase tracking-[0.3em]">
            Eventra Management System // Secure Node
          </p>
        </div>
      </main>
    </div>
  );
}