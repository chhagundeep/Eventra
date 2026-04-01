import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, loading }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-[2.5rem] p-10 space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20 mx-auto">
          <AlertTriangle size={32} />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Terminate Node?</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
            You are about to decommission <span className="text-white">{title}</span>. This action is irreversible.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <button 
            disabled={loading}
            onClick={onConfirm}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Confirm Termination"}
          </button>
          <button 
            onClick={onClose}
            className="w-full bg-zinc-900 text-zinc-400 hover:text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
          >
            Abort Mission
          </button>
        </div>
      </div>
    </div>
  );
}