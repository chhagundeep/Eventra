import { FieldValue, Timestamp } from "firebase/firestore";

export type UserRole = 'super_admin' | 'admin' | 'trainer' | 'user';

export interface Category {
  id: string;          // e.g., "gaming"
  name: string;        // e.g., "Gaming"
  iconName: string;    
  description: string;
  searchTags: string[];
  isActive: boolean;
  createdAt?: Timestamp | FieldValue | any;
  updatedAt?: Timestamp | FieldValue | any;
}

/**
 * Standardized Trainer Interface
 * Display name is stored as `trainer_name` in Firestore (root `users` and `tenants/.../trainers`).
 */
export interface Trainer {
  id: string;               // Firestore Document ID
  uid: string;              // The Trainer's Firebase Auth UID
  tenantId: string;         // The "Cluster ID" this trainer belongs to
  createdBy: string;        // The Admin's UID who onboarded this trainer
  trainer_name: string;
  email: string;
  phone: string;
  image: string; 
  experience?: string;      // e.g., "3 years" / "Beginner" (optional for legacy docs)
  price?: number;           // Personal training session price
  categories: string[];     
  role: 'trainer';
  status: 'Active' | 'Inactive';
  createdAt: Timestamp | FieldValue | any;
  updatedAt: Timestamp | FieldValue | any;
}

/** Resolve trainer display name (supports legacy `name` field on old documents). */
export function trainerDisplayName(t: Partial<Trainer> & { name?: string }): string {
  const tn = t.trainer_name;
  if (typeof tn === "string" && tn.length > 0) return tn;
  const legacy = t.name;
  if (typeof legacy === "string") return legacy;
  return "";
}

/** Normalize a Firestore trainers/* document into a Trainer (handles legacy `name` / `specialties`). */
export function trainerFromFirestoreDoc(
  docId: string,
  data: Record<string, unknown>
): Trainer {
  const d = data as Partial<Trainer> & { name?: string; specialties?: string[] };
  const rawPrice = d.price;
  const price =
    typeof rawPrice === "number" && !Number.isNaN(rawPrice)
      ? rawPrice
      : typeof rawPrice === "string" && rawPrice.trim() !== ""
        ? Number.parseFloat(rawPrice)
        : undefined;

  return {
    id: docId,
    ...d,
    trainer_name: trainerDisplayName(d),
    price: price !== undefined && !Number.isNaN(price) ? price : undefined,
    categories: Array.isArray(d.categories)
      ? d.categories
      : Array.isArray(d.specialties)
        ? d.specialties
        : [],
  } as Trainer;
}

/** Format trainer personal session price for display. */
export function formatTrainerPrice(price?: number): string {
  if (price === undefined || Number.isNaN(price)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  createdAt: number;
}

export interface Tenant {
  id: string;
  organizationName: string;
  createdBy: string;
  createdAt: number;
}

export interface EventraEvent {
  id?: string;
  tenantId: string;      // Required for security rules
  title: string;
  description: string;
  date: string;          // ISO string or YYYY-MM-DD
  category: string;      // Category ID
  capacity: number;
  price: number;
  trainerId: string;     // Backward compatibility (mirrors headTrainerId)
  trainerIds?: string[]; // Multi-trainer assignment
  headTrainerId?: string;
  images: string[];      // Array of Cloudinary URLs
  status: "active" | "completed" | "cancelled";
  createdAt?: FieldValue | Timestamp | any;
  locationName: string;  // Human-readable address
  latitude: number;      // Decimal coordinate
  longitude: number;     // Decimal coordinate
}

// Inside src/types/index.ts
export interface Slot {
  id: string;
  eventId: string;
  tenantId: string;
  trainerId: string;
  startTime: Timestamp;
  endTime: Timestamp;
  capacity: number;
  availableSeats: number;
  status: "active" | "inactive" | "cancelled";
  createdAt?: Timestamp | FieldValue | any; // Added for tracking
  updatedAt?: Timestamp | FieldValue | any;
}