"use client";

import React, { useEffect, useState } from "react";
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

// --- HELPER: Extract Cloudinary Public ID from URL ---
const extractIdFromUrl = (url: string) => {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathWithExtension = parts[1].replace(/^v\d+\//, '');
    return pathWithExtension.split('.')[0];
  } catch (error) {
    console.error("ID Extraction failed:", error);
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

  // 1. Fetch Dynamic Categories from Firestore
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
        
        // Default to first category if creating a new node
        if (!initialData && cats.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: cats[0].id }));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }

    if (isOpen) fetchCategories();
  }, [isOpen, initialData]);

  // 2. Sync Form with Initial Data (Edit Mode)
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
      // Reset form on close
      setFormData({ 
        title: "", description: "", date: "", 
        category: dbCategories[0]?.id || "", capacity: 20, price: 0, 
        trainerId: "", images: [], status: "active"
      });
    }
  }, [initialData, isOpen, dbCategories]);

  if (!isOpen) return null;

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
        // --- EDIT MODE: Cleanup removed images from Cloudinary ---
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
        // --- CREATE MODE ---
        await createEvent(tenantId, {
          ...formData,
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (error) {
      console.error("Submission Error:", error);
      alert("Deployment failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/30">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              {initialData ? "Update Event Node" : "New Event Node"}
            </h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              {initialData ? `Modifying Node: ${initialData.id?.slice(0,8)}` : "Configure Multi-Tenant Node Deployment"}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Left Column */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Node Title</label>
                <input 
                  required 
                  placeholder="e.g. Yoga For All"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Category</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white appearance-none cursor-pointer focus:border-orange-600 outline-none transition-all"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {dbCategories.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-zinc-950">{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Trainer</label>
                  <div className="relative">
                    <select 
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white appearance-none cursor-pointer focus:border-orange-600 outline-none transition-all"
                      value={formData.trainerId}
                      onChange={(e) => setFormData({...formData, trainerId: e.target.value})}
                    >
                      <option value="" disabled>Select</option>
                      {trainers.map(t => <option key={t.id} value={t.id} className="bg-zinc-950">{t.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Price (Rs.)</label>
                  <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none" value={formData.price || ""} onChange={(e) => handleNumberChange("price", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Capacity</label>
                  <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none" value={formData.capacity} onChange={(e) => handleNumberChange("capacity", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Event Date</label>
                <input type="date" required className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white [color-scheme:dark] outline-none focus:border-orange-600" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Media Assets ({formData.images.length}/4)</label>
              <div className="grid grid-cols-2 gap-3">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-[1.5rem] overflow-hidden border border-zinc-800 group bg-zinc-900">
                    <img src={url} className="w-full h-full object-cover" alt="Preview" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
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
                      <button type="button" onClick={() => open()} className="aspect-square border-2 border-dashed border-zinc-800 rounded-[1.5rem] bg-zinc-900/50 flex flex-col items-center justify-center hover:border-orange-600 hover:bg-zinc-900 transition-all group">
                        <Upload className="text-zinc-700 group-hover:text-orange-600" size={24} />
                        <span className="text-[8px] text-zinc-600 font-black mt-2 group-hover:text-orange-600 uppercase">Add Media</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Description</label>
                <textarea 
                  placeholder="Describe the event node objectives..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white h-[120px] resize-none focus:border-orange-600 outline-none" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] text-white transition-all shadow-xl shadow-orange-900/20 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : (initialData ? "Update Event Node" : "Deploy Event Node")}
          </button>
        </form>
      </div>
    </div>
  );
}