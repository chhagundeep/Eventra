// components/DeleteModal.tsx
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orgName: string;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, orgName }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111111] border border-white/10 p-6 rounded-xl max-w-sm w-full shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-2">Terminate Organization?</h3>
        <p className="text-gray-400 mb-6">
          Are you sure you want to delete <span className="text-orange-600 font-semibold">{orgName}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700 transition"
          >
            Terminate
          </button>
        </div>
      </div>
    </div>
  );
}