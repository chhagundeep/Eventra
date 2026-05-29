# Eventra - Full Project Report

## Executive Summary
Eventra is a multi-tenant event operations platform where organizations manage trainers, events, slots, and public event visibility. It combines role-based dashboards (`admin`, `trainer`, `super-admin`), Firebase realtime data, and Cloudinary media uploads. Core business value: operational control per tenant with centralized platform oversight.

## Quick Metrics (Inferred)
- App routes (`page.tsx`): 21
- Layouts: 6
- API endpoints: 3
- Main roles: 4 (`public user`, `admin`, `trainer`, `super-admin`)

## Tech Stack
- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Lucide
- Backend/API: Next.js Route Handlers
- Database/Auth: Firebase Firestore + Firebase Authentication
- Admin operations: Firebase Admin SDK
- Media: Cloudinary (`next-cloudinary` + direct upload pattern)
- Tooling: ESLint, PostCSS, Tailwind config

## What The Project Does (Feature List)
1. **Authentication & Role Routing**
   - Logs users in via Firebase Auth and routes them to role-based dashboards.

2. **Multi-Tenant Organization Model**
   - Keeps each organization’s data isolated under tenant-scoped Firestore collections.

3. **Trainer Management**
   - Create, view, edit, and delete trainer records.
   - Includes profile fields like name, phone, categories, experience, image, and personal training price.

4. **Trainer Image Upload**
   - Uploads trainer images to Cloudinary and stores secure URLs in Firestore.

5. **Event Management**
   - Create/update events with title, category, description, pricing, capacity, trainers, media, and location.

6. **Public Event Discovery**
   - Tenant events can be synced into a global public feed for discovery pages.

7. **Slot Management**
   - Each event supports time-based slot records with capacity/availability tracking.

8. **Category System**
   - Categories are used for trainer assignment and event classification/filtering.

9. **Admin Dashboard Operations**
   - Tenant-level controls for trainers/events and operational overview.

10. **Super-Admin Platform Control**
    - Global visibility across organizations, users, events, and configuration surfaces.

11. **Realtime Data Updates**
    - Uses Firestore realtime listeners to keep dashboards updated without refresh.

12. **Configuration and Utility Workflows**
    - Includes settings/config flows and modal-based management patterns.

## Architecture Snapshot
- Public routes: `src/app/(public)`
- Dashboard routes: `src/app/(dashboard)/admin`, `trainer`, `super-admin`
- API routes: `src/app/api/admin/*`
- Shared logic: `src/lib`, `src/types`, `src/hooks`

### Firestore Data Model (High Level)
- Root: `users`, `tenants`, `publicEvents`, `categories`
- Tenant scope: `tenants/{tenantId}/users|trainers|events`
- Slots: `tenants/{tenantId}/events/{eventId}/slots`
- Event sync: tenant events mirrored to `publicEvents`

## Key End-to-End Flows
### Trainer Onboarding
1. Admin submits trainer form (+ optional image upload to Cloudinary).
2. Client calls `/api/admin/create-trainer`.
3. API creates Firebase Auth trainer user + claims.
4. API writes root user + tenant trainer documents.

### Event Lifecycle
1. Admin creates/edits event under tenant scope.
2. `eventService` persists event in tenant collection.
3. Event is synced to `publicEvents`.
4. Admin manages slots under event sub-collection.

## Benefits / Strengths
- Clear tenant-scoped model for organization isolation
- Realtime UX for operations teams
- Good role-based UI segmentation
- Cloudinary integration for media pipeline
- Reusable modal/drawer patterns for fast iteration

## Risks / Gaps / Technical Debt
1. Security rules reference exists, but `firestore.rules` file is not present in repo.
2. Many sensitive data writes/deletes happen from client side (security depends heavily on deployed rules).
3. Mixed key naming patterns (`tenantId` and `orgId`) may cause data consistency issues.
4. Password-like plaintext fields are stored in Firestore in some flows.
5. Trainer module appears less complete than admin/super-admin modules.
6. No formal test framework found, increasing regression risk.

## Recommendations
### Short Term (0-30 days)
- Add/version Firestore rules in repo
- Move destructive operations behind secure server APIs
- Remove plaintext credential storage

### Mid Term (1-3 months)
- Standardize schema and key naming
- Add request validation for API payloads
- Introduce audit logs for admin/super-admin actions

### Long Term (3+ months)
- Expand trainer self-service capabilities
- Add unit/integration/smoke tests
- Formalize service boundaries for maintainability

## Closing
Eventra already has a strong multi-tenant operational foundation with live dashboards and practical role segmentation. Security hardening and data consistency improvements are the highest-value next steps for production-grade scale.
