import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export async function POST(request: Request) {
  try {
    // Destructure all incoming data from the AddTrainerDrawer
    const { 
      email, 
      password, 
      name, 
      phone, 
      tenantId, 
      specialization, 
      imgId, 
      categories, 
      createdBy 
    } = await request.json();

    // 1. Create the Actual Firebase Authentication Account
    // This allows the trainer to log in using the generated TR- password
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. SAVE TO ROOT USERS COLLECTION
    // This is what the login page and useAuth hook read to verify the 'trainer' role
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name,
      role: "trainer",
      tenantId,
      tempPassword: password, // Stored so you can reference it if the trainer forgets
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. SAVE TO TENANT SUB-COLLECTION
    // Matches your screenshot exactly: includes categories array and ISO updatedAt string
    await adminDb.collection("tenants").doc(tenantId).collection("trainers").doc(userRecord.uid).set({
      name,
      email,
      phone,
      specialization,
      categories: categories || [], // Saves as the array seen in your screenshot
      role: "trainer",
      status: "Active",
      tenantId,
      imgId,
      password: password,           // The TR-XXXX password visible in your Firestore
      createdBy: createdBy || null, // The UID of the Admin who performed the onboarding
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString(), // Standard ISO string for tracking updates
    });

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error("Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}