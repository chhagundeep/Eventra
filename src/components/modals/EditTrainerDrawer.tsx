"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

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
  return data.public_id;
};

interface EditTrainerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trainer: any; // The trainer data passed from the table row
}

export default function EditTrainerDrawer({ isOpen, onClose, onSuccess, trainer }: EditTrainerDrawerProps) {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    specialization: "",
  });

  // Pre-fill data when the drawer opens with a specific trainer
  useEffect(() => {
    if (trainer) {
      setFormData({
        name: trainer.name || "",
        phone: trainer.phone || "",
        specialization: trainer.specialization || "",
      });
      // Set preview if they already have an imgId (using Cloudinary URL format)
      if (trainer.imgId) {
        setImagePreview(`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${trainer.imgId}`);
      }
    }
  }, [trainer]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !trainer.id) return;

    setLoading(true);

    try {
      let finalImgId = trainer.imgId;

      // Only upload if a new image was picked
      if (selectedFile) {
        finalImgId = await uploadToCloudinary(selectedFile);
      }

      const trainerRef = doc(db, "tenants", tenantId, "trainers", trainer.id);
      
      await updateDoc(trainerRef, {
        ...formData,
        imgId: finalImgId,
        updatedAt: new Date().toISOString(),
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating trainer:", error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-y-0 right-0 w-full max-w-[450px] bg-[#0a0a0a] border-l border-zinc-800 z-[101] flex flex-col">
            
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Update Profile</h2>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {/* Profile Image Section */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Update Photo</label>
                <div className="relative h-32 w-full rounded-2xl border-2 border-dashed border-zinc-800 hover:border-orange-600 transition-all flex flex-col items-center justify-center overflow-hidden bg-zinc-900/20 group">
                  {imagePreview ? (
                    <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                  ) : (
                    <Upload className="text-zinc-600 group-hover:text-orange-600" size={24} />
                  )}
                  <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>

              {/* READ-ONLY FIELDS */}
              <div className="space-y-4 opacity-60">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Email (Locked)</label>
                  <input disabled value={trainer.email} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-zinc-500 cursor-not-allowed" />
                </div>
              </div>

              {/* EDITABLE FIELDS */}
              <div className="grid gap-5">
                {[
                  { label: "Full Name", key: "name", type: "text" },
                  { label: "Phone Number", key: "phone", type: "tel" },
                  { label: "Specialization", key: "specialization", type: "text" },
                ].map((f) => (
                  <div key={f.key} className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{f.label}</label>
                    <input 
                      required 
                      type={f.type} 
                      value={(formData as any)[f.key]}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-600 outline-none transition-colors" 
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} 
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}