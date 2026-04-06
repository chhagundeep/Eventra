"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Loader2, Tag, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

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
  trainer: any | null;
  onClose: () => void;
  onSuccess: () => void;
  tenantId?: string; // Prop passed from Organization page
}

export default function EditTrainerDrawer({ 
  isOpen, 
  trainer, 
  onClose, 
  onSuccess, 
  tenantId: propsTenantId 
}: EditTrainerDrawerProps) {
  const { tenantId: authTenantId } = useAuth();
  
  // Logic: Use passed prop (Admin view) or fallback to auth (Gym Owner view)
  const effectiveTenantId = propsTenantId || authTenantId;

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

  // 1. Load Categories and Initialize Trainer Data
  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch categories once if list is empty
        if (availableCategories.length === 0) {
          const snap = await getDocs(collection(db, "categories"));
          setAvailableCategories(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        }

        if (trainer) {
          setFormData({
            name: trainer.name || "",
            email: trainer.email || "",
            phone: trainer.phone || "",
          });
          setSelectedCategories(trainer.categories || []);
          
          // Set initial preview to current Cloudinary image if it exists
          if (trainer.imgId) {
            setImagePreview(`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_500/${trainer.imgId}`);
          } else {
            setImagePreview(null);
          }
          setSelectedFile(null);
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
    if (!effectiveTenantId || !trainer) return;

    setLoading(true);
    const oldImgId = trainer.imgId;

    try {
      let finalImgId = oldImgId;

      // 1. Image Upload Logic (if changed)
      if (selectedFile) {
        finalImgId = await uploadToCloudinary(selectedFile);
      }

      // 2. Firestore Update Path
      const trainerDocRef = doc(db, "tenants", effectiveTenantId, "trainers", trainer.id);
      await updateDoc(trainerDocRef, {
        ...formData,
        specialization: selectedCategories.join(", "),
        categories: selectedCategories,
        imgId: finalImgId,
        updatedAt: new Date().toISOString()
      });

      // 3. API Cleanup for Cloudinary (Delete old image if replaced)
      if (selectedFile && oldImgId) {
        try {
            await fetch("/api/admin/delete-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicIds: [oldImgId] }),
            });
        } catch (error) {
            console.warn("Cleanup warning: Old image could not be removed from Cloudinary storage.");
        }
      }

      toast.success("Profile updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to sync changes with the database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[102]" 
          />
          <motion.div 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[480px] bg-[#050505] border-l border-white/5 z-[103] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Edit Profile</h2>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-2">Modify Staff Credentials</p>
              </div>
              <button onClick={onClose} className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
              {/* Photo Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Identity Visual</label>
                <div className="relative h-44 w-full rounded-[2rem] border-2 border-dashed border-white/5 hover:border-orange-600/50 transition-all flex flex-col items-center justify-center overflow-hidden bg-zinc-900/30 group">
                  {imagePreview ? (
                    <img src={imagePreview} className="h-full w-full object-cover transition-transform group-hover:scale-105" alt="Preview" />
                  ) : (
                    <div className="text-zinc-600 text-xs font-bold uppercase flex flex-col items-center gap-3">
                        <Upload size={24} />
                        <span>Upload Photo</span>
                    </div>
                  )}
                  <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {selectedFile && (
                  <p className="text-[9px] text-orange-500 font-black uppercase text-center tracking-tighter">New asset ready for synchronization</p>
                )}
              </div>

              {/* Categories Section */}
              <div className="space-y-5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Tag size={12} className="text-orange-600" /> Skillsets & Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.name)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                        selectedCategories.includes(cat.name)
                          ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-900/20"
                          : "bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid gap-6">
                {[
                  { label: "Legal Name", key: "name", type: "text" },
                  { label: "Email Address", key: "email", type: "email" },
                  { label: "Phone Number", key: "phone", type: "tel" },
                ].map((f) => (
                  <div key={f.key} className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{f.label}</label>
                    <input 
                      required 
                      type={f.type} 
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:border-orange-600/50 focus:outline-none transition-all placeholder:text-zinc-700" 
                      value={(formData as any)[f.key]}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} 
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-6 pb-12">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-orange-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-orange-900/20 active:scale-95"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Update Credentials</>}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}