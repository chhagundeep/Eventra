import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export async function POST(request: Request) {
  try {
    const { 
      email, 
      password, 
      name, 
      phone, 
      tenantId, 
      image, 
      specialties, 
      createdBy 
    } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required for sub-collection isolation." }, { status: 400 });
    }

    // 1. Create the Firebase Auth Account
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set Custom Claims (Essential for Security Rules)
    // This allows Firestore to verify the user belongs to this tenant without a DB lookup
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: "trainer",
      tenantId: tenantId,
    });

    const batch = adminDb.batch();

    // 3. ROOT USERS COLLECTION (For Auth Mapping)
    const userRef = adminDb.collection("users").doc(userRecord.uid);
    batch.set(userRef, {
      uid: userRecord.uid,
      email,
      name,
      role: "trainer",
      tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. TENANT SUB-COLLECTION (The isolated data)
    // PATH: tenants/{tenantId}/trainers/{uid}
    const trainerRef = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("trainers")
      .doc(userRecord.uid);

    batch.set(trainerRef, {
      uid: userRecord.uid,
      name,
      email,
      phone,
      image,
      categories: specialties || [], // Match the 'categories' field in your Types
      role: "trainer",
      status: "Active",
      tenantId,
      createdBy: createdBy || null,
      password: password, // The TR-XXXX reference
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error("Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}