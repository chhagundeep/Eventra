import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      trainer_name,
      name: legacyName,
      phone,
      experience,
      tenantId,
      image,
      price,
      specialties,
      createdBy,
    } = body;

    const parsedPrice =
      typeof price === "number"
        ? price
        : typeof price === "string" && price.trim() !== ""
          ? Number.parseFloat(price)
          : undefined;
    const personalPrice =
      parsedPrice !== undefined && !Number.isNaN(parsedPrice) && parsedPrice >= 0
        ? parsedPrice
        : undefined;

    const trainerName =
      typeof trainer_name === "string" && trainer_name.length > 0
        ? trainer_name
        : typeof legacyName === "string"
          ? legacyName
          : "";

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID is required for sub-collection isolation." }, { status: 400 });
    }
    if (!trainerName) {
      return NextResponse.json({ error: "trainer_name is required." }, { status: 400 });
    }

    // 1. Create the Firebase Auth Account
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: trainerName,
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
      trainer_name: trainerName,
      experience: typeof experience === "string" ? experience : "",
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
      trainer_name: trainerName,
      email,
      phone,
      image,
      ...(personalPrice !== undefined ? { price: personalPrice } : {}),
      experience: typeof experience === "string" ? experience : "",
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