"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Upload, Trash2, MapPin, Users } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { createEvent, updateEvent, getCategories } from "@/lib/eventService";
import { serverTimestamp } from "firebase/firestore";
import { EventraEvent, Category, Trainer, trainerDisplayName, formatTrainerPrice } from "@/types";
import toast from "react-hot-toast";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  trainers: Trainer[];
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
    trainerIds: [] as string[],
    headTrainerId: "",
    images: [] as string[],
    status: "active" as "active" | "completed" | "cancelled",
    locationName: "",
    latitude: 0,
    longitude: 0
  });

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await getCategories();
        setDbCategories(cats);
        if (!initialData && cats.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: cats[0].id }));
        }
      } catch (error) {
        console.error("Category Fetch Error:", error);
      }
    }
    if (isOpen) fetchCategories();
  }, [isOpen]);

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
        trainerIds:
          Array.isArray(initialData.trainerIds) && initialData.trainerIds.length > 0
            ? initialData.trainerIds
            : initialData.trainerId
              ? [initialData.trainerId]
              : [],
        headTrainerId: initialData.headTrainerId || initialData.trainerId || "",
        images: initialData.images || [],
        status: initialData.status || "active",
        locationName: initialData.locationName || "",
        latitude: initialData.latitude || 0,
        longitude: initialData.longitude || 0
      });
    } else {
      setFormData(prev => ({
        ...prev,
        category: prev.category || (dbCategories.length > 0 ? dbCategories[0].id : ""),
        trainerId: prev.trainerId || (trainers.length > 0 ? trainers[0].id : ""),
        trainerIds: prev.trainerIds.length > 0 ? prev.trainerIds : (trainers.length > 0 ? [trainers[0].id] : []),
        headTrainerId: prev.headTrainerId || (trainers.length > 0 ? trainers[0].id : ""),
      }));
    }
  }, [isOpen, initialData, dbCategories.length, trainers.length]);

  if (!isOpen || !mounted) return null;

  const categoryNameMap = dbCategories.reduce<Record<string, string>>((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) return toast.error("Select a valid category.");
    if (!formData.locationName) return toast.error("Location Protocol is required.");
    if (formData.images.length === 0) return toast.error("Visual assets are required.");
    if (formData.trainerIds.length === 0) return toast.error("Select at least one trainer.");
    if (!formData.headTrainerId) return toast.error("Mark one head trainer.");
    if (!formData.trainerIds.includes(formData.headTrainerId)) {
      return toast.error("Head trainer must be selected in assigned trainers.");
    }

    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        trainerId: formData.headTrainerId,
        tenantId: tenantId
      };

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
        await updateEvent(tenantId, initialData.id, submissionData);
        toast.success("Event node updated.");
      } else {
        await createEvent(tenantId, { ...submissionData, createdAt: serverTimestamp() });
        toast.success("New event deployed.");
        
        setFormData({ 
          title: "", description: "", date: "", category: dbCategories[0]?.id || "", 
          capacity: 20, price: 0, trainerId: trainers[0]?.id || "",
          trainerIds: trainers[0]?.id ? [trainers[0].id] : [],
          headTrainerId: trainers[0]?.id || "",
          images: [], status: "active", locationName: "", latitude: 0, longitude: 0 
        });
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
        
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/20">
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              {initialData ? "Update Event Node" : "Deploy New Event"}
            </h2>
            <p className="text-orange-600/70 text-[9px] font-black uppercase tracking-[0.3em] mt-2">
              System Capacity & GPS Synchronization
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
                <input required className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-orange-600 outline-none transition-all placeholder:text-zinc-700" placeholder="Operational Title..." value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>

              {/* GEOGRAPHIC BLOCK */}
              <div className="p-6 bg-orange-600/5 border border-orange-600/10 rounded-[2rem] space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-orange-600" />
                  <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Geographic Protocol</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Location Name</label>
                  <input required className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none transition-all" placeholder="Arena name or street..." value={formData.locationName} onChange={(e) => setFormData({...formData, locationName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Latitude</label>
                    <input type="number" step="any" className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none" placeholder="0.0000" value={formData.latitude || ""} onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">Longitude</label>
                    <input type="number" step="any" className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none" placeholder="0.0000" value={formData.longitude || ""} onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">System Category</label>
                  <select required className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="" disabled>Select Sector</option>
                    {dbCategories.map(cat => <option key={cat.id} value={cat.id} className="bg-zinc-950">{cat.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Assigned Trainers</label>
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-3 max-h-52 overflow-y-auto space-y-2">
                    {trainers.length === 0 ? (
                      <p className="text-xs text-zinc-500 px-2 py-2">No trainers available.</p>
                    ) : (
                      trainers.map((t) => {
                        const checked = formData.trainerIds.includes(t.id);
                        const categoryLabels = (t.categories || []).map((id) => categoryNameMap[id] || id);
                        return (
                          <label key={t.id} className="flex items-center justify-between gap-3 px-2 py-2 rounded-xl hover:bg-zinc-800/50 cursor-pointer">
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      trainerIds: [...prev.trainerIds, t.id],
                                      headTrainerId: prev.headTrainerId || t.id,
                                      trainerId: prev.trainerId || t.id,
                                    }));
                                  } else {
                                    setFormData((prev) => {
                                      const nextTrainerIds = prev.trainerIds.filter((id) => id !== t.id);
                                      const nextHead = prev.headTrainerId === t.id ? (nextTrainerIds[0] || "") : prev.headTrainerId;
                                      return {
                                        ...prev,
                                        trainerIds: nextTrainerIds,
                                        headTrainerId: nextHead,
                                        trainerId: nextHead,
                                      };
                                    });
                                  }
                                }}
                              />
                              <div className="min-w-0">
                                <span className="text-sm text-white truncate block">{trainerDisplayName(t)}</span>
                                <span className="text-[10px] text-zinc-500 truncate block">
                                  {categoryLabels.length > 0 ? categoryLabels.join(", ") : "No categories"}
                                  {t.price !== undefined ? ` · Personal ${formatTrainerPrice(t.price)}` : ""}
                                </span>
                              </div>
                            </div>
                            <label className="flex items-center gap-1 text-[10px] text-zinc-400 uppercase tracking-widest">
                              <input
                                type="radio"
                                name="headTrainer"
                                checked={formData.headTrainerId === t.id}
                                disabled={!checked}
                                onChange={() => setFormData((prev) => ({ ...prev, headTrainerId: t.id, trainerId: t.id }))}
                              />
                              Head
                            </label>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* UPDATED: ADDED CAPACITY FIELD HERE */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fee (INR)</label>
                  <input type="number" className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none" value={formData.price || ""} onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Users size={10} className="text-orange-600" /> Capacity
                  </label>
                  <input type="number" required min="1" className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none" value={formData.capacity} onChange={(e) => setFormData(prev => ({ ...prev, capacity: Number(e.target.value) || 1 }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Launch Date</label>
                  <input type="date" required className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 text-white [color-scheme:dark] outline-none" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Visual Assets ({formData.images.length}/4)</label>
                <div className="grid grid-cols-2 gap-3">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative aspect-video rounded-2xl overflow-hidden group">
                      <img src={url} className="w-full h-full object-cover" alt="Preview" />
                      <button type="button" onClick={() => setFormData(p => ({...p, images: p.images.filter((_, i) => i !== index)}))} className="absolute inset-0 flex items-center justify-center bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 4 && (
                    <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET} onSuccess={(result: any) => result.info?.secure_url && setFormData(prev => ({ ...prev, images: [...prev.images, result.info.secure_url] }))}>
                      {({ open }) => <button type="button" onClick={() => open()} className="aspect-video border-2 border-dashed border-white/10 rounded-2xl bg-white/5 flex flex-col items-center justify-center hover:border-orange-600 transition-all"><Upload className="text-zinc-600" size={24} /></button>}
                    </CldUploadWidget>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Event Directive</label>
                <textarea placeholder="Brief, logistics, requirements..." className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-6 py-4 text-white h-[100px] resize-none outline-none focus:border-orange-600 placeholder:text-zinc-700" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 bg-zinc-900/30 border-t border-white/5">
          <button form="event-form" type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] text-white transition-all flex items-center justify-center gap-3">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (initialData ? "Synchronize Updates" : "Deploy Live Node")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}