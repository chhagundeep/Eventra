"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If not logged in, go to login
      if (!user) router.push("/login");
      // If logged in but NOT an admin, kick them out
      else if (role !== "admin") router.push("/login");
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  return <>{children}</>;
}