import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc,
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { EventraEvent } from "@/types";

/**
 * DEPLOY NEW EVENT
 * Handles private tenant storage and public mobile app sync.
 */
export const createEvent = async (
  tenantId: string, 
  eventData: any 
) => {
  try {
    // 1. Reference to the Organization's private events
    const tenantEventsRef = collection(db, "tenants", tenantId, "events");
    
    // 2. Add document to the private sub-collection
    const newEventDoc = await addDoc(tenantEventsRef, {
      ...eventData,
      tenantId,
      createdAt: serverTimestamp(),
    });

    // 3. Sync to publicEvents for the Mobile App
    const publicEventRef = doc(db, "publicEvents", newEventDoc.id);
    
    await setDoc(publicEventRef, {
      ...eventData,
      eventId: newEventDoc.id,
      tenantId: tenantId,
      // Mobile app primary image compatibility
      imageUrl: eventData.images && eventData.images.length > 0 
        ? eventData.images[0] 
        : "", 
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

/**
 * UPDATE EXISTING EVENT
 * Updates both the private tenant record and the public mobile sync.
 */
export const updateEvent = async (
  tenantId: string,
  eventId: string,
  eventData: Partial<EventraEvent>
) => {
  try {
    // 1. Update private tenant record
    const eventRef = doc(db, "tenants", tenantId, "events", eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: serverTimestamp(),
    });

    // 2. Sync changes to publicEvents for Mobile App
    const publicEventRef = doc(db, "publicEvents", eventId);
    
    // We use setDoc with merge: true to avoid overwriting fields not included in eventData
    await setDoc(publicEventRef, {
      ...eventData,
      eventId: eventId,
      tenantId: tenantId,
      // Update primary image if the images array was modified
      imageUrl: eventData.images && eventData.images.length > 0 
        ? eventData.images[0] 
        : (eventData as any).imageUrl || "",
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.error("Error in updateEvent service:", error);
    throw error;
  }
};