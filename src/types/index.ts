// src/types/index.ts

export type UserRole = 'super_admin' | 'admin' | 'trainer' | 'user';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null; // Super Admin has no tenantId
  createdAt: number;
}

export interface Tenant {
  id: string; // The tenantId
  organizationName: string;
  createdBy: string; // UID of the Super Admin who created it
  createdAt: number;
}

export interface EventraEvent {
  id: string;
  tenantId: string;
  trainerId: string;
  title: string;
  description: string;
  category: string;
  date: string;
  capacity: number;
  createdAt: number;
}