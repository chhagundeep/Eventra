"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, Loader2, CheckCircle2, Copy, Check, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Category } from "@/types";

const generateTempPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TR-"; 
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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

interface AddTrainerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string; // Add this prop to receive ID from params
}

export default function AddTrainerDrawer({ isOpen, onClose, onSuccess, tenantId }: AddTrainerDrawerProps) {
  // Removed useAuth hook dependency for tenantId to ensure it uses the URL param
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedPass, setGeneratedPass] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const q = query(
          collection(db, "categories"), 
          where("isActive", "==", true),
          orderBy("name", "asc")
        );
        const snap = await getDocs(q);
        const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[];
        setAvailableCategories(cats);
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    if (isOpen) fetchCats();
  }, [isOpen]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
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

  const handleCopy = () => {
    if (generatedPass) {
      navigator.clipboard.writeText(generatedPass);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return alert("Critical Error: No Tenant ID provided from the organization view.");
    if (selectedCategoryIds.length === 0) return alert("Please select at least one category.");

    setLoading(true);
    const tempPassword = generateTempPassword();

    try {
      let finalImageUrl = ""; 
      if (selectedFile) {
        finalImageUrl = await uploadToCloudinary(selectedFile);
      }

      const response = await fetch("/api/admin/create-trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: tempPassword,
          tenantId, 
          specialties: selectedCategoryIds,
          image: finalImageUrl,
          role: "trainer",
          status: "Active",
          createdBy: auth.currentUser?.uid || "system_admin",
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to onboard staff");
      }

      setGeneratedPass(tempPassword);
    } catch (error: any) {
      alert("Error: " + error.message);
      console.error("Error adding trainer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalClose = () => {
    setGeneratedPass(null);
    setImagePreview(null);
    setSelectedFile(null);
    setSelectedCategoryIds([]);
    setFormData({ name: "", email: "", phone: "" });
    onSuccess();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-y-0 right-0 w-full max-w-[450px] bg-[#0a0a0a] border-l border-zinc-800 z-[101] flex flex-col shadow-2xl">
            
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Onboard Staff</h2>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            {!generatedPass ? (
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Profile Photo</label>
                  <div className="relative h-32 w-full rounded-2xl border-2 border-dashed border-zinc-800 hover:border-orange-600 transition-all flex flex-col items-center justify-center overflow-hidden bg-zinc-900/20">
                    {imagePreview ? (
                      <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                    ) : (
                      <Upload className="text-zinc-600" size={24} />
                    )}
                    <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Tag size={12} className="text-orange-600" /> Assignment Categories
                    </label>
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">
                      {selectedCategoryIds.length} Selected
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1 scrollbar-hide">
                    {availableCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryToggle(cat.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all border ${
                          selectedCategoryIds.includes(cat.id)
                            ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-900/20"
                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

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
                  <button type="submit" disabled={loading} className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Authorize & Generate Access"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <CheckCircle2 size={48} className="text-orange-600" />
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Staff Authorized</h3>
                  <p className="text-xs text-zinc-500 mt-2 font-medium">Provide these credentials to the trainer for login.</p>
                </div>
                <div className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center justify-between">
                  <p className="text-2xl font-mono font-bold text-white tracking-tighter">{generatedPass}</p>
                  <button onClick={handleCopy} className="p-3 bg-zinc-800 rounded-xl hover:text-orange-600 transition-colors">
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                <button onClick={handleFinalClose} className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-900/20">Done</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}