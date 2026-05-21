import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp 
} from "firebase/firestore";
import { EventraEvent, Category } from "@/types";

/**
 * FETCH GLOBAL CATEGORIES
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    // Single-field equality only — avoids needing a composite index with orderBy("name").
    const q = query(collection(db, "categories"), where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    const list = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Category[];
    return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

/**
 * DEPLOY NEW EVENT
 * Includes GPS coordinates for the mobile app and map rendering
 */
export const createEvent = async (
  tenantId: string, 
  eventData: EventraEvent 
) => {
  try {
    // 1. Reference to the Organization's private sub-collection
    const tenantEventsRef = collection(db, "tenants", tenantId, "events");
    
    // 2. Add document to private collection
    const newEventDoc = await addDoc(tenantEventsRef, {
      ...eventData,
      tenantId,
      createdAt: serverTimestamp(),
    });

    // 3. Sync to publicEvents (Mobile App & Global Discovery)
    const publicEventRef = doc(db, "publicEvents", newEventDoc.id);
    
    await setDoc(publicEventRef, {
      ...eventData,
      eventId: newEventDoc.id,
      tenantId: tenantId,
      // Compatibility for mobile app primary image
      imageUrl: eventData.images && eventData.images.length > 0 
        ? eventData.images[0] 
        : "", 
      // GPS Data is included here via ...eventData
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

    // 2. Update public discovery record
    const publicEventRef = doc(db, "publicEvents", eventId);
    
    await setDoc(publicEventRef, {
      ...eventData,
      eventId: eventId,
      tenantId: tenantId,
      imageUrl: eventData.images && eventData.images.length > 0 
        ? eventData.images[0] 
        : (eventData as any).imageUrl || "",
      updatedAt: serverTimestamp(),
    }, { merge: true }); // Merge ensures we don't overwrite unrelated public fields

    return true;
  } catch (error) {
    console.error("Error in updateEvent service:", error);
    throw error;
  }
};