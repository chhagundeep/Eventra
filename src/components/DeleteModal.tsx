interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string; // Customizable title
  description?: React.ReactNode; // Customizable message
  orgName: string;
  loading?: boolean;
}

export default function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Terminate Record?", 
  description,
  orgName, 
  loading 
}: DeleteModalProps) {
  if (!isOpen) return null;

  // Handle clicking the background overlay to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity"
      onClick={handleOverlayClick}
    >
      <div className="bg-[#111111] border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl transform transition-all scale-100">
        <h3 className="text-xl font-black text-white mb-2 italic uppercase tracking-tight">
          {title}
        </h3>
        
        <div className="text-zinc-400 mb-6 text-sm leading-relaxed">
          {description ? description : (
            <>
              Are you sure you want to delete <span className="text-orange-600 font-black">{orgName}</span>? 
              This action is irreversible and will purge all associated data.
            </>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-orange-600 text-white font-black hover:bg-orange-700 active:scale-95 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-orange-900/20"
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