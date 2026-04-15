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
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { EventraEvent, Category } from "@/types";

/**
 * FETCH GLOBAL CATEGORIES
 * Returns the 18 seeded categories for dropdowns/filters
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(
      collection(db, "categories"), 
      where("isActive", "==", true),
      orderBy("name", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Category[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

/**
 * DEPLOY NEW EVENT
 */
export const createEvent = async (
  tenantId: string, 
  eventData: EventraEvent // Using strict type
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
 */
export const updateEvent = async (
  tenantId: string,
  eventId: string,
  eventData: Partial<EventraEvent>
) => {
  try {
    const eventRef = doc(db, "tenants", tenantId, "events", eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: serverTimestamp(),
    });

    const publicEventRef = doc(db, "publicEvents", eventId);
    
    await setDoc(publicEventRef, {
      ...eventData,
      eventId: eventId,
      tenantId: tenantId,
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