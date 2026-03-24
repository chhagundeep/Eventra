import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { tenantId, adminUid } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: "Missing Tenant ID" }, { status: 400 });
    }

    // 1. SOFT DELETE: Update Tenant status to 'inactive'
    // This keeps the organization in your "Fleet Inventory" for history.
    await adminDb.collection("tenants").doc(tenantId).update({
      status: "inactive",
      terminatedAt: new Date().toISOString(),
    });

    // 2. DEEP DELETE: Wipe Sub-collections (users, slots, trainers)
    // This removes the "Yoga-Club" nodes from your Identity Topology screen.
    const collectionsToClear = ["users", "trainers", "slots", "bookings"];
    
    for (const colName of collectionsToClear) {
      const snapshot = await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection(colName)
        .get();

      if (!snapshot.empty) {
        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
    }

    // 3. AUTH PURGE: Remove Global Pointer & Auth Account
    // This frees the email so the person can register again.
    if (adminUid) {
      // Remove from root "users" collection
      await adminDb.collection("users").doc(adminUid).delete();
      
      // Remove from Firebase Authentication
      try {
        await adminAuth.deleteUser(adminUid);
      } catch (authError) {
        console.log("Auth user already gone or not found");
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Tenant inactivated. Network nodes purged. Email freed." 
    });

  } catch (error: any) {
    console.error("Hybrid Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}