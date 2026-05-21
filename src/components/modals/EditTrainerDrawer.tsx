"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Loader2, Tag, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, collection, writeBatch } from "firebase/firestore";
import { getCategories } from "@/lib/eventService";
import { useAuth } from "@/hooks/useAuth";
import { Category, Trainer, trainerDisplayName } from "@/types";
import toast from "react-hot-toast";

/**
 * Helper to handle image persistence to Cloudinary
 */
const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "eventra_preset");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Cloudinary Upload Failed");
  const data = await res.json();
  return data.secure_url; 
};

interface EditTrainerDrawerProps {
  isOpen: boolean;
  trainer: Trainer | null;
  onClose: () => void;
  onSuccess: () => void;
  tenantId?: string;
}

export default function EditTrainerDrawer({ 
  isOpen, 
  trainer, 
  onClose, 
  onSuccess, 
  tenantId: propsTenantId 
}: EditTrainerDrawerProps) {
  const { tenantId: authTenantId } = useAuth();
  const effectiveTenantId = propsTenantId || authTenantId;

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    price: "",
  });

  // --- INITIALIZE & CLEANUP DATA ---
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        // Fetch available categories for the selection list
        if (availableCategories.length === 0) {
          const cats = await getCategories();
          if (isMounted) {
            setAvailableCategories(cats);
          }
        }

        // Fill form with current trainer data
        if (trainer && isMounted) {
          setFormData({
            name: trainerDisplayName(trainer),
            email: trainer.email || "",
            phone: trainer.phone || "",
            experience: trainer.experience || "",
            price: trainer.price !== undefined ? String(trainer.price) : "",
          });
          
          /**
           * Standardized Logic: 
           * We prioritize 'categories' but check 'specialties' for backward compatibility.
           */
          const initialCategories = trainer.categories || (trainer as any).specialties || [];
          setSelectedCategoryIds(initialCategories);
          
          setImagePreview(trainer.image || null);
          setSelectedFile(null);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    if (isOpen) {
      initData();
    } else {
      // Clear state on close to prevent data flicker for the next item
      setFormData({ name: "", email: "", phone: "", experience: "", price: "" });
      setImagePreview(null);
      setSelectedCategoryIds([]);
    }

    return () => { isMounted = false; };
  }, [isOpen, trainer]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  /**
   * ATOMIC BATCH UPDATE:
   * Synchronizes changes across the global user profile and the tenant staff record.
   */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveTenantId || !trainer) return toast.error("Tenant isolation context missing");
    if (selectedCategoryIds.length === 0) return toast.error("Select at least one specialty");

    const personalPrice = Number.parseFloat(formData.price);
    if (formData.price.trim() === "" || Number.isNaN(personalPrice) || personalPrice < 0) {
      return toast.error("Enter a valid personal training price (0 or greater)");
    }

    setLoading(true);
    const batch = writeBatch(db);

    try {
      let finalImageUrl = trainer.image;

      // Handle image update if a new file was chosen
      if (selectedFile) {
        finalImageUrl = await uploadToCloudinary(selectedFile);
      }

      // 1. Sync Global User Profile
      const userRef = doc(db, "users", trainer.uid);
      batch.update(userRef, {
        trainer_name: formData.name,
        email: formData.email,
        experience: formData.experience,
      });

      // 2. Sync Tenant-Specific Staff Record
      const trainerDocRef = doc(db, "tenants", effectiveTenantId, "trainers", trainer.id);
      
      batch.update(trainerDocRef, {
        trainer_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        experience: formData.experience,
        price: personalPrice,
        /**
         * MANDATORY FIX: 
         * Using 'categories' key exclusively to prevent 'specialities' column creation.
         */
        categories: selectedCategoryIds, 
        image: finalImageUrl,
        updatedAt: new Date().toISOString()
      });

      await batch.commit();

      toast.success("Staff profile synchronized successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Update failed:", error);
      toast.error("Failed to sync changes to the cluster.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[102]" 
          />
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[480px] bg-[#050505] border-l border-white/5 z-[103] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Edit Profile</h2>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-2">Modify Staff Credentials</p>
              </div>
              <button onClick={onClose} className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              {/* Image Upload */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Identity Visual</label>
                <div className="relative h-44 w-full rounded-[2.5rem] border-2 border-dashed border-white/5 hover:border-orange-600/50 transition-all flex flex-col items-center justify-center overflow-hidden bg-zinc-900/30 group">
                  {imagePreview ? (
                    <img src={imagePreview} className="h-full w-full object-cover transition-transform group-hover:scale-105" alt="Preview" />
                  ) : (
                    <Upload size={24} className="text-zinc-600" />
                  )}
                  <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              {/* Specialties/Categories Selection */}
              <div className="space-y-5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} className="text-orange-600" /> Categories
                  </label>
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">
                    {selectedCategoryIds.length} Selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto p-1 scrollbar-hide">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.id)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                        selectedCategoryIds.includes(cat.id)
                          ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-900/20"
                          : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid gap-6">
                {[
                  { label: "Display Name", key: "name", type: "text" },
                  { label: "Email Address", key: "email", type: "email" },
                  { label: "Phone Number", key: "phone", type: "tel" },
                  { label: "Experience", key: "experience", type: "text" },
                  { label: "Personal Training Price", key: "price", type: "number" },
                ].map((f) => (
                  <div key={f.key} className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{f.label}</label>
                    <input 
                      required 
                      type={f.type}
                      min={f.type === "number" ? 0 : undefined}
                      step={f.type === "number" ? "0.01" : undefined}
                      placeholder={f.type === "number" ? "e.g. 75" : undefined}
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:border-orange-600/50 focus:outline-none transition-all" 
                      value={(formData as any)[f.key]}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} 
                    />
                  </div>
                ))}
              </div>

              {/* Submit Action */}
              <div className="pt-6 pb-12">
                <button 
                  type="submit" disabled={loading} 
                  className="w-full bg-orange-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Push Updates</>}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}