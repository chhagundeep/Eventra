"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Loader2, Tag, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
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
  return data.public_id; // Returning the public_id
};

interface EditTrainerDrawerProps {
  isOpen: boolean;
  trainer: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTrainerDrawer({ isOpen, trainer, onClose, onSuccess }: EditTrainerDrawerProps) {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [availableCategories, setAvailableCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const snap = await getDocs(collection(db, "categories"));
        setAvailableCategories(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));

        if (trainer) {
          setFormData({
            name: trainer.name || "",
            email: trainer.email || "",
            phone: trainer.phone || "",
          });
          setSelectedCategories(trainer.categories || []);
          // Reset file states when opening a new trainer
          setSelectedFile(null);
          setImagePreview(null);
        }
      } catch (err) {
        console.error("Error initializing edit drawer:", err);
      }
    };
    if (isOpen) initData();
  }, [isOpen, trainer]);

  const handleCategoryToggle = (catName: string) => {
    setSelectedCategories(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !trainer) return;

    setLoading(true);
    const oldImgId = trainer.imgId; // Store the old ID to delete later

    try {
      let finalImgId = oldImgId;

      // 1. If a new file is selected, upload it
      if (selectedFile) {
        finalImgId = await uploadToCloudinary(selectedFile);
      }

      // 2. Update Firestore
      const trainerDocRef = doc(db, "tenants", tenantId, "trainers", trainer.id);
      await updateDoc(trainerDocRef, {
        ...formData,
        specialization: selectedCategories.join(", "),
        categories: selectedCategories,
        imgId: finalImgId,
      });

      // 3. Clean up Cloudinary: If we uploaded a new image, delete the old one
      if (selectedFile && oldImgId) {
        console.log("Cleaning up old trainer image:", oldImgId);
        await fetch("/api/admin/delete-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicIds: [oldImgId] }),
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update staff member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[102]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-y-0 right-0 w-full max-w-[450px] bg-[#0a0a0a] border-l border-zinc-800 z-[103] flex flex-col">
            
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Edit Staff Member</h2>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              {/* Profile Photo */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Update Photo</label>
                <div className="relative h-32 w-full rounded-2xl border-2 border-dashed border-zinc-800 hover:border-orange-600 transition-all flex flex-col items-center justify-center overflow-hidden bg-zinc-900/20">
                  {imagePreview ? (
                    <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                  ) : (
                    <div className="text-zinc-600 text-xs font-bold uppercase flex flex-col items-center gap-2">
                        <Upload size={20} />
                        <span>Change Image</span>
                    </div>
                  )}
                  <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {selectedFile && (
                    <p className="text-[9px] text-orange-500 font-bold uppercase text-center">New image pending save</p>
                )}
              </div>

              {/* Specialization Selection */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Tag size={12} className="text-orange-600" /> Categories / Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.name)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                        selectedCategories.includes(cat.name)
                          ? "bg-orange-600 border-orange-600 text-white"
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Fields */}
              <div className="grid gap-5">
                {[
                  { label: "Full Name", key: "name", type: "text" },
                  { label: "Email Address", key: "email", type: "email" },
                  { label: "Phone Number", key: "phone", type: "tel" },
                ].map((f) => (
                  <div key={f.key} className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{f.label}</label>
                    <input 
                      required 
                      type={f.type} 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-600 outline-none transition-colors" 
                      value={(formData as any)[f.key]}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} 
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 pb-8">
                <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
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