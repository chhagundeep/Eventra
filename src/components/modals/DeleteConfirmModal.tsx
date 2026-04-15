"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, title, loading }: DeleteModalProps) {
  
  // 1. Scroll Lock & Keyboard Listeners
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !loading) onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, loading, onClose]);

  if (typeof window === "undefined") return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-zinc-950 border border-zinc-800/50 w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl shadow-red-900/10 pointer-events-auto"
            >
              {/* Warning Icon */}
              <div className="w-20 h-20 bg-red-500/5 rounded-3xl flex items-center justify-center text-red-500 border border-red-500/10 mx-auto animate-pulse">
                <AlertTriangle size={36} strokeWidth={2.5} />
              </div>
              
              {/* Text Content */}
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Terminate Node?</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed px-4">
                  You are about to decommission <span className="text-red-500">{title}</span>. All data associated with this entry will be purged from the registry.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <button 
                  disabled={loading}
                  onClick={onConfirm}
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale shadow-lg shadow-red-900/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Executing Purge...
                    </>
                  ) : (
                    "Confirm Termination"
                  )}
                </button>
                
                <button 
                  disabled={loading}
                  onClick={onClose}
                  className="w-full bg-zinc-900/50 text-zinc-500 hover:text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all border border-transparent hover:border-zinc-800"
                >
                  Abort Mission
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}