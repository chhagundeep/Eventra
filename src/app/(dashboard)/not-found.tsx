import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
      <h2 className="text-6xl font-black text-orange-600 mb-4 uppercase italic">404</h2>
      <p className="text-zinc-500 uppercase tracking-widest text-xs mb-8">Node Not Found in Infrastructure</p>
      <Link href="/super-admin" className="px-8 py-3 bg-white text-black font-black uppercase text-[10px] rounded-xl hover:bg-orange-600 hover:text-white transition-all">
        Return to Control Center
      </Link>
    </div>
  );
}