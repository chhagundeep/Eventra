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
 * This ensures the 'name' and 'tenantId' fields match the 
 * expectations of the CreateEventModal dropdown logic.
 */
export interface Trainer {
  id: string;               // Firestore Document ID
  uid: string;              // The Trainer's Firebase Auth UID
  tenantId: string;         // The "Cluster ID" this trainer belongs to
  createdBy: string;        // The Admin's UID who onboarded this trainer
  name: string;             // Standardized from trainer_name
  email: string;
  phone: string;
  image: string; 
  categories: string[];     
  role: 'trainer';
  status: 'Active' | 'Inactive';
  createdAt: Timestamp | FieldValue | any;
  updatedAt: Timestamp | FieldValue | any;
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
  trainerId: string;
  images: string[];      // Array of Cloudinary URLs
  status: "active" | "completed" | "cancelled";
  createdAt?: FieldValue | Timestamp | any;
  locationName: string;  // Human-readable address
  latitude: number;      // Decimal coordinate
  longitude: number;     // Decimal coordinate
}