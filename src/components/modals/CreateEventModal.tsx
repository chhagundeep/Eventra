"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Upload, Trash2, ChevronDown } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { createEvent, updateEvent } from "@/lib/eventService";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, serverTimestamp, orderBy } from "firebase/firestore";
import { EventraEvent, Category, Trainer } from "@/types";
import toast from "react-hot-toast";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  trainers: Trainer[]; // Now uses the full Trainer type for better consistency
  initialData?: EventraEvent | null;
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
  trainers = [], 
  initialData 
}: CreateEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // 1. Fetch Categories and handle initial selection
  useEffect(() => {
    async function fetchCategories() {
      try {
        const q = query(
          collection(db, "categories"), 
          where("isActive", "==", true),
          orderBy("name", "asc")
        );
        const querySnapshot = await getDocs(q);
        const cats = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        setDbCategories(cats);
        
        // Auto-select first category only if creating new AND category isn't set yet
        if (!initialData && cats.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: cats[0].id }));
        }
      } catch (error) {
        console.error("Category Fetch Error:", error);
      }
    }
    if (isOpen) fetchCategories();
  }, [isOpen]); // Removed initialData and formData.category from dependencies to prevent infinite loop

  // 2. Optimized Form Initialization: Preserves data during state updates
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
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
    } else {
      // For NEW events, only set defaults for empty fields to avoid wiping user input
      setFormData(prev => ({
        ...prev,
        category: prev.category || (dbCategories.length > 0 ? dbCategories[0].id : ""),
        trainerId: prev.trainerId || (trainers.length > 0 ? trainers[0].id : ""),
      }));
    }
  }, [isOpen, initialData, dbCategories.length, trainers.length]);

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
    if (!formData.category) return toast.error("Select a valid category.");
    if (!formData.trainerId) return toast.error("Assigned staff (Trainer) is required.");
    if (formData.images.length === 0) return toast.error("Visual assets are required.");

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
        toast.success("Event node updated.");
      } else {
        await createEvent(tenantId, { ...formData, createdAt: serverTimestamp() });
        toast.success("New event deployed.");
        // Clear form after success if it's a new event
        setFormData({ title: "", description: "", date: "", category: "", capacity: 20, price: 0, trainerId: "", images: [], status: "active" });
      }
      onClose();
    } catch (error) {
      console.error("Sync Error:", error);
      toast.error("Database synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#09090b] border border-white/10 w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/20">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              {initialData ? "Update Event Node" : "Deploy New Event"}
            </h2>
            <p className="text-orange-600/70 text-[9px] font-black uppercase tracking-[0.3em] mt-2">
              Cluster ID: {tenantId.slice(0, 12)}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-3 bg-white/5 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form id="event-form" onSubmit={handleSubmit} className="flex-1 min-h-0 p-8 space-y-8 overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Event Title</label>
                <input 
                  required 
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-orange-600 outline-none transition-all placeholder:text-zinc-700"
                  placeholder="Operational Title..."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">System Category</label>
                  <div className="relative">
                    <select 
                      required
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white appearance-none cursor-pointer focus:border-orange-600 outline-none"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="" disabled>Select Sector</option>
                      {dbCategories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-zinc-950">{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Assigned Trainer</label>
                  <div className="relative">
                    <select 
                      required
                      className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white appearance-none cursor-pointer focus:border-orange-600 outline-none"
                      value={formData.trainerId}
                      onChange={(e) => setFormData({...formData, trainerId: e.target.value})}
                    >
                      <option value="" disabled>Select Staff</option>
                      {trainers.length > 0 ? (
                        trainers.map((t) => (
                          <option key={t.id} value={t.id} className="bg-zinc-950">
                            {t.name} {/* Corrected: Now uses 'name' which matches our Trainer type */}
                          </option>
                        ))
                      ) : (
                        <option disabled className="bg-zinc-950 italic">No trainers found</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fee (INR)</label>
                  <input type="number" className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none" value={formData.price || ""} onChange={(e) => handleNumberChange("price", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Slot Capacity</label>
                  <input type="number" className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none" value={formData.capacity} onChange={(e) => handleNumberChange("capacity", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Launch Date</label>
                <input type="date" required className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white [color-scheme:dark] outline-none" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Visual Assets ({formData.images.length}/4)</label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 group bg-zinc-900 shadow-inner">
                      <img src={url} className="w-full h-full object-cover" alt="Preview" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute inset-0 flex items-center justify-center bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <button type="button" onClick={() => open()} className="aspect-video border-2 border-dashed border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center hover:border-orange-600 hover:bg-orange-600/5 transition-all group">
                          <Upload className="text-zinc-600 group-hover:text-orange-600 transition-colors" size={24} />
                          <span className="text-[8px] font-black text-zinc-700 group-hover:text-orange-600 uppercase mt-2">Initialize Upload</span>
                        </button>
                      )}
                    </CldUploadWidget>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Event Directive (Description)</label>
                <textarea 
                  placeholder="Operational brief, logistics, and requirements..."
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white h-[140px] resize-none outline-none focus:border-orange-600 placeholder:text-zinc-700" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 bg-zinc-900/30 border-t border-white/5">
          <button 
            form="event-form"
            type="submit" 
            disabled={loading} 
            className="w-full bg-orange-600 hover:bg-orange-500 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] text-white transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-900/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (initialData ? "Synchronize Updates" : "Deploy Live Node")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}