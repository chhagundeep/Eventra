"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // Added for clean stacking
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: React.ReactNode;
  orgName: string;
  loading?: boolean;
  isRestricted?: boolean;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Terminate Record?",
  description,
  orgName,
  loading,
  isRestricted = false,
}: DeleteModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Handle Escape Key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [loading, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop with Framer Motion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && onClose()}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative bg-[#0a0a0a] border ${
              isRestricted ? "border-amber-500/20" : "border-white/10"
            } p-8 rounded-[2.5rem] max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden`}
          >
            {/* Thematic Glow */}
            <div className={`absolute -top-24 -left-24 h-48 w-48 blur-[80px] opacity-20 ${
              isRestricted ? "bg-amber-600" : "bg-red-600"
            }`} />

            <div className="flex items-center gap-4 mb-6 relative">
              <div className={`p-3 rounded-2xl ${
                isRestricted ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
              }`}>
                {isRestricted ? <AlertTriangle size={24} /> : <Trash2 size={24} />}
              </div>
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
                  {isRestricted ? "Action Blocked" : title}
                </h3>
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">
                  Security Protocol
                </p>
              </div>
            </div>

            <div className="text-zinc-400 mb-8 text-sm leading-relaxed relative">
              {description ? (
                description
              ) : (
                <>
                  {isRestricted ? (
                    <>
                      The record for <span className="text-white font-bold">{orgName}</span> is currently 
                      linked to active processes and cannot be removed.
                    </>
                  ) : (
                    <>
                      Are you sure you want to delete{" "}
                      <span className="text-orange-600 font-black">{orgName}</span>? 
                      This action is irreversible and will purge all associated data.
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 justify-end relative">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                {isRestricted ? "Acknowledge" : "Cancel"}
              </button>

              {!isRestricted && (
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-red-600 text-white font-black hover:bg-red-500 active:scale-95 transition-all uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-3 shadow-lg shadow-red-900/20"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Purging
                    </>
                  ) : (
                    "Terminate"
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}