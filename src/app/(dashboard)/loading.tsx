import { Loader2 } from "lucide-react";

export default function DashboardLoader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#050505] space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-orange-600/20 blur-2xl animate-pulse rounded-full" />
        <Loader2 className="h-12 w-12 animate-spin text-orange-600 relative" />
      </div>
      <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">
        Synchronizing Eventra Infrastructure...
      </p>
    </div>
  );
}