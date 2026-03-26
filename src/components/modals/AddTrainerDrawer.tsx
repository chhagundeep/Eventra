"use client";

import React, { useState } from "react";
import { X, Upload, Loader2, CheckCircle2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";

const generateTempPassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TR-"; 
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// --- NEW: CLOUDINARY UPLOAD HELPER ---
const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  // Using the preset you just created in the screenshot
  formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "eventra_preset");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Cloudinary Upload Failed");
  const data = await res.json();
  return data.public_id; // returns something like "Eventra/abc123xyz"
};

interface AddTrainerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTrainerDrawer({ isOpen, onClose, onSuccess }: AddTrainerDrawerProps) {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Track the actual file
  const [generatedPass, setGeneratedPass] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); // Save file for upload
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
    if (!tenantId) return alert("No Tenant ID found.");

    setLoading(true);
    const tempPassword = generateTempPassword();

    try {
      let finalImgId = "sample_avatar";

      // --- STEP 1: UPLOAD TO CLOUDINARY ---
      if (selectedFile) {
        try {
          finalImgId = await uploadToCloudinary(selectedFile);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          // Fallback to default avatar if upload fails
        }
      }

      // --- STEP 2: SAVE TO FIRESTORE ---
      const trainersRef = collection(db, "tenants", tenantId, "trainers");
      
      await addDoc(trainersRef, {
        ...formData,
        role: "Trainer",
        password: tempPassword,
        imgId: finalImgId, // This is now the real Cloudinary ID!
        status: "Active",
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid,
      });

      setGeneratedPass(tempPassword);
    } catch (error) {
      console.error("Error adding trainer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalClose = () => {
    setGeneratedPass(null);
    setImagePreview(null);
    setSelectedFile(null);
    onSuccess();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-y-0 right-0 w-full max-w-[450px] bg-[#0a0a0a] border-l border-zinc-800 z-[101] flex flex-col">
            
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-white italic uppercase">Onboard Staff</h2>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>

            {!generatedPass ? (
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
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

                <div className="grid gap-5">
                  {[
                    { label: "Full Name", key: "name", type: "text" },
                    { label: "Email Address", key: "email", type: "email" },
                    { label: "Phone Number", key: "phone", type: "tel" },
                    { label: "Specialization", key: "specialization", type: "text" },
                  ].map((f) => (
                    <div key={f.key} className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">{f.label}</label>
                      <input required type={f.type} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-600 outline-none" 
                             onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} />
                    </div>
                  ))}
                </div>

                <div className="p-6 border-t border-zinc-800">
                  <button type="submit" disabled={loading} className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Authorize & Generate Access"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <CheckCircle2 size={40} className="text-orange-600" />
                <h3 className="text-xl font-bold text-white uppercase italic">Staff Authorized</h3>
                <div className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between">
                  <p className="text-xl font-mono font-bold text-white">{generatedPass}</p>
                  <button onClick={handleCopy} className="p-3 bg-zinc-800 rounded-xl hover:text-orange-600">
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <button onClick={handleFinalClose} className="w-full py-4 bg-white text-black rounded-xl font-bold">Done</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}