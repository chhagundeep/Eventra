import { FieldValue, Timestamp } from "firebase/firestore";

export type UserRole = 'super_admin' | 'admin' | 'trainer' | 'user';

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
  title: string;
  description: string;
  date: string;
  category: string;
  capacity: number;
  price: number;
  trainerId: string;
  images: string[]; // Ensure this is plural and an array
  status: "active" | "completed" | "cancelled";
  createdAt: FieldValue | Timestamp | any; // Allow Firebase FieldValue
}