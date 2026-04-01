"use client";

import { useState } from "react";
import { X, Loader2, Upload, Trash2 } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { createEvent } from "@/lib/eventService";
import { serverTimestamp } from "firebase/firestore";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  trainers: { id: string; name: string }[];
}

export default function CreateEventModal({ isOpen, onClose, tenantId, trainers }: CreateEventModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    category: "workshop",
    capacity: 20,
    price: 0,
    trainerId: "",
    images: [] as string[] 
  });

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
      // This sends the 'images' array to your Firestore service
      await createEvent(tenantId, {
        ...formData,
        status: "active",
        createdAt: serverTimestamp(),
      });
      
      setFormData({ 
        title: "", description: "", date: "", 
        category: "workshop", capacity: 20, price: 0, 
        trainerId: "", images: [] 
      });
      
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to deploy event node.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/30">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">New Event Node</h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Configure multi-tenant deployment</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 hover:bg-zinc-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Event Title</label>
                <input 
                  required 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Assigned Trainer</label>
                <select 
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none appearance-none"
                  value={formData.trainerId}
                  onChange={(e) => setFormData({...formData, trainerId: e.target.value})}
                >
                  <option value="" disabled>Select Trainer</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Price ($)</label>
                  <input 
                    type="number"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none"
                    value={formData.price || ""}
                    onChange={(e) => handleNumberChange("price", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Capacity</label>
                  <input 
                    type="number"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none"
                    value={formData.capacity}
                    onChange={(e) => handleNumberChange("capacity", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Event Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-600 outline-none [color-scheme:dark]"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
            </div>

            {/* Media Gallery with 4-image limit */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">
                Media Gallery ({formData.images.length}/4)
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-800 group">
                    <img src={url} className="w-full h-full object-cover" alt="Preview" />
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                
                {formData.images.length < 4 && (
                  <CldUploadWidget 
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    onSuccess={(result: any) => {
                      if (result.info?.secure_url) {
                        setFormData(prev => ({ 
                          ...prev, 
                          images: [...prev.images, result.info.secure_url] 
                        }));
                      }
                    }}
                  >
                    {({ open }) => (
                      <button 
                        type="button"
                        onClick={() => open()} 
                        className="aspect-video border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900 flex flex-col items-center justify-center hover:border-orange-600/50 transition-all group"
                      >
                        <Upload className="text-zinc-700 group-hover:text-orange-500 mb-2" size={20} />
                        <span className="text-[8px] text-zinc-600 font-black uppercase">Add Photo</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">Description</label>
                <textarea 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-white h-[116px] resize-none focus:border-orange-600 outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-800 disabled:text-zinc-600 py-5 rounded-[2rem] font-black uppercase text-sm text-white transition-all transform active:scale-[0.98] mt-4"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Deploy Event Node"}
          </button>
        </form>
      </div>
    </div>
  );
}