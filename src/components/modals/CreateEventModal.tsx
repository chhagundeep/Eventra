"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // Add this
import { X, Loader2, Upload, Trash2, ChevronDown } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { createEvent, updateEvent } from "@/lib/eventService";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { EventraEvent } from "@/types";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  trainers: { id: string; name: string }[];
  initialData?: EventraEvent | null;
}

interface Category {
  id: string;
  name: string;
}

const extractIdFromUrl = (url: string) => {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathWithExtension = parts[1].replace(/^v\d+\//, '');
    return pathWithExtension.split('.')[0];
  } catch (error) {
    return null;
  }
};

export default function CreateEventModal({ 
  isOpen, 
  onClose, 
  tenantId, 
  trainers, 
  initialData 
}: CreateEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false); // To handle SSR/Client mismatch
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    category: "",
    capacity: 20,
    price: 0,
    trainerId: "",
    images: [] as string[],
    status: "active" as "active" | "completed" | "cancelled"
  });

  // Handle Mounting and Scroll Lock
  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Fetch Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const q = query(collection(db, "categories"), where("isActive", "==", true));
        const querySnapshot = await getDocs(q);
        const cats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setDbCategories(cats);
        
        if (!initialData && cats.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: cats[0].id }));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    if (isOpen) fetchCategories();
  }, [isOpen, initialData]);

  // Sync Form Data
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        date: initialData.date || "",
        category: initialData.category || "",
        capacity: initialData.capacity || 20,
        price: initialData.price || 0,
        trainerId: initialData.trainerId || "",
        images: initialData.images || [],
        status: initialData.status || "active"
      });
    } else if (!isOpen) {
      setFormData({ 
        title: "", description: "", date: "", 
        category: dbCategories[0]?.id || "", capacity: 20, price: 0, 
        trainerId: "", images: [], status: "active"
      });
    }
  }, [initialData, isOpen, dbCategories]);

  // Prevent rendering if not open or not on client
  if (!isOpen || !mounted) return null;

  const handleNumberChange = (field: string, value: string) => {
    const num = value === "" ? 0 : Number(value);
    setFormData(prev => ({ ...prev, [field]: num }));
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trainerId) return alert("Please select a trainer.");
    if (formData.images.length === 0) return alert("Upload at least one image.");

    setLoading(true);
    try {
      if (initialData?.id) {
        const originalImages = initialData.images || [];
        const imagesToRemove = originalImages.filter(url => !formData.images.includes(url));

        if (imagesToRemove.length > 0) {
          const publicIds = imagesToRemove.map(url => extractIdFromUrl(url)).filter(Boolean);
          await fetch("/api/admin/delete-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicIds }),
          });
        }
        await updateEvent(tenantId, initialData.id, formData);
      } else {
        await createEvent(tenantId, { ...formData, createdAt: serverTimestamp() });
      }
      onClose();
    } catch (error) {
      alert("Deployment failed.");
    } finally {
      setLoading(false);
    }
  };

  // RENDER PORTAL
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-[#09090b] border border-white/10 w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/20 flex-shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
              {initialData ? "Update Event Node" : "Deploy New Event"}
            </h2>
            <p className="text-orange-600/70 text-[9px] font-black uppercase tracking-[0.3em] mt-2">
              Organization Node: {tenantId.slice(0, 12)}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form 
          id="event-form"
          onSubmit={handleSubmit} 
          className="flex-1 min-h-0 p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Event Title</label>
                <input 
                  required 
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Category</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white appearance-none cursor-pointer focus:border-orange-600 outline-none"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {dbCategories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-zinc-950">{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Trainer</label>
                  <div className="relative">
                    <select 
                      required
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white appearance-none cursor-pointer focus:border-orange-600 outline-none"
                      value={formData.trainerId}
                      onChange={(e) => setFormData({...formData, trainerId: e.target.value})}
                    >
                      <option value="" disabled>Choose</option>
                      {trainers.map(t => <option key={t.id} value={t.id} className="bg-zinc-950">{t.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Price (Rs.)</label>
                  <input type="number" className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none" value={formData.price || ""} onChange={(e) => handleNumberChange("price", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Capacity</label>
                  <input type="number" className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none" value={formData.capacity} onChange={(e) => handleNumberChange("capacity", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Schedule Date</label>
                <input type="date" required className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white [color-scheme:dark] outline-none" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Media ({formData.images.length}/4)</label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 group bg-zinc-900">
                      <img src={url} className="w-full h-full object-cover" alt="Preview" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute inset-0 flex items-center justify-center bg-red-600/80 text-white opacity-0 group-hover:opacity-100">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 4 && (
                    <CldUploadWidget 
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={(result: any) => {
                        if (result.info?.secure_url) {
                          setFormData(prev => ({ ...prev, images: [...prev.images, result.info.secure_url] }));
                        }
                      }}
                    >
                      {({ open }) => (
                        <button type="button" onClick={() => open()} className="aspect-video border-2 border-dashed border-white/5 rounded-2xl bg-white/5 flex flex-col items-center justify-center hover:border-orange-600 transition-all">
                          <Upload className="text-zinc-600" size={20} />
                        </button>
                      )}
                    </CldUploadWidget>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Description</label>
                <textarea 
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white h-[120px] resize-none outline-none" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 md:p-8 bg-zinc-900/30 border-t border-white/5 flex-shrink-0">
          <button 
            form="event-form"
            type="submit" 
            disabled={loading} 
            className="w-full bg-orange-600 hover:bg-orange-500 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] text-white transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (initialData ? "Apply Changes" : "Deploy Event")}
          </button>
        </div>
      </div>
    </div>,
    document.body // This target ensures it's at the root of the page
  );
}