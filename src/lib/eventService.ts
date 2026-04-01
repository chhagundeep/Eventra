import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { EventraEvent } from "@/types";

export const createEvent = async (
  tenantId: string, 
  // We use 'any' here or a specific Omit to ensure the new 'images' array is accepted
  eventData: any 
) => {
  try {
    // 1. Reference to the Organization's private events
    const tenantEventsRef = collection(db, "tenants", tenantId, "events");
    
    // 2. Add document to the private sub-collection
    // Using serverTimestamp() instead of Date.now() for Firestore consistency
    const newEventDoc = await addDoc(tenantEventsRef, {
      ...eventData,
      tenantId,
      createdAt: serverTimestamp(),
    });

    // 3. Sync to publicEvents for the Mobile App
    const publicEventRef = doc(db, "publicEvents", newEventDoc.id);
    
    await setDoc(publicEventRef, {
      eventId: newEventDoc.id,
      tenantId: tenantId,
      title: eventData.title,
      category: eventData.category,
      date: eventData.date,
      trainerId: eventData.trainerId,
      // MOBILE APP COMPATIBILITY: 
      // The app likely expects a string. We send the first image of the array.
      imageUrl: eventData.images && eventData.images.length > 0 
        ? eventData.images[0] 
        : "", 
      // Also sync the full array for detail views
      images: eventData.images || [],
      status: eventData.status || "active",
      createdAt: serverTimestamp(),
    });

    return newEventDoc.id;
  } catch (error) {
    console.error("Error in createEvent service:", error);
    throw error;
  }
};