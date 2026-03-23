// components/DeleteModal.tsx
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orgName: string;
  loading?: boolean; 
}

export default function DeleteModal({ isOpen, onClose, onConfirm, orgName, loading }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111111] border border-white/10 p-6 rounded-xl max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2 italic uppercase">Terminate Organization?</h3>
        <p className="text-zinc-400 mb-6 text-sm">
          Are you sure you want to delete <span className="text-orange-600 font-black">{orgName}</span>? This will purge all associated trainers, users, and event data.
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-orange-600 text-white font-black hover:bg-orange-700 transition uppercase text-xs tracking-widest disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Purging...
              </>
            ) : (
              "Terminate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}