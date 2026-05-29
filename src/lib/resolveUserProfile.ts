import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeUserRole } from "@/lib/organizationUsers";

export type ResolvedUserProfile = {
  role: string;
  tenantId: string | null;
  source: "users_uid" | "users_email" | "tenant_admin" | "tenant_sub_users";
};

function profileFromUserDoc(
  data: Record<string, unknown>,
  source: ResolvedUserProfile["source"]
): ResolvedUserProfile {
  return {
    role: normalizeUserRole(data),
    tenantId:
      (typeof data.tenantId === "string" && data.tenantId) ||
      (typeof data.orgId === "string" && data.orgId) ||
      null,
    source,
  };
}

/**
 * Login and useAuth require a profile in Firestore. Auth UID is the primary key;
 * fall back when org was created but root `users/{uid}` is missing or mis-keyed.
 */
export async function resolveUserProfile(
  uid: string,
  email: string | null | undefined
): Promise<ResolvedUserProfile | null> {
  const uidDoc = await getDoc(doc(db, "users", uid));
  if (uidDoc.exists()) {
    return profileFromUserDoc(
      uidDoc.data() as Record<string, unknown>,
      "users_uid"
    );
  }

  const trimmedEmail = email?.trim();
  const emailVariants = [
    ...(trimmedEmail ? [trimmedEmail, trimmedEmail.toLowerCase()] : []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  for (const variant of emailVariants) {
    const byEmail = await getDocs(
      query(collection(db, "users"), where("email", "==", variant), limit(1))
    );
    if (!byEmail.empty) {
      return profileFromUserDoc(
        byEmail.docs[0].data() as Record<string, unknown>,
        "users_email"
      );
    }

    const subByEmail = await getDocs(
      query(collectionGroup(db, "users"), where("email", "==", variant), limit(5))
    );
    for (const subDoc of subByEmail.docs) {
      const segments = subDoc.ref.path.split("/");
      if (segments[0] !== "tenants" || segments[2] !== "users") continue;
      const role = normalizeUserRole(subDoc.data() as Record<string, unknown>);
      if (subDoc.id === uid || role === "admin") {
        return {
          role: role === "user" ? "admin" : role,
          tenantId: segments[1],
          source: "tenant_sub_users",
        };
      }
    }

    try {
      const tenantByEmail = await getDocs(
        query(collection(db, "tenants"), where("adminEmail", "==", variant), limit(1))
      );
      if (!tenantByEmail.empty) {
        const tenant = tenantByEmail.docs[0];
        const tenantData = tenant.data();
        const adminUid =
          typeof tenantData.adminUid === "string" ? tenantData.adminUid : uid;
        if (adminUid === uid) {
          return {
            role: "admin",
            tenantId: tenant.id,
            source: "tenant_admin",
          };
        }
      }
    } catch {
      /* tenant list may be restricted by security rules */
    }
  }

  try {
    const tenantByAdminUid = await getDocs(
      query(collection(db, "tenants"), where("adminUid", "==", uid), limit(1))
    );
    if (!tenantByAdminUid.empty) {
      return {
        role: "admin",
        tenantId: tenantByAdminUid.docs[0].id,
        source: "tenant_admin",
      };
    }
  } catch {
    /* ignore */
  }

  try {
    const tenantsSnap = await getDocs(collection(db, "tenants"));
    for (const tenantDoc of tenantsSnap.docs) {
      const subSnap = await getDoc(
        doc(db, "tenants", tenantDoc.id, "users", uid)
      );
      if (subSnap.exists()) {
        const role = normalizeUserRole(subSnap.data() as Record<string, unknown>);
        return {
          role: role === "user" ? "admin" : role,
          tenantId: tenantDoc.id,
          source: "tenant_sub_users",
        };
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

export function roleToDashboardPath(role: string): string {
  const normalized = role.replace(/-/g, "_");
  if (normalized === "super_admin") return "/super-admin";
  if (normalized === "admin") return "/admin";
  if (normalized === "trainer") return "/trainer";
  if (normalized === "user") return "/user/explore";
  return `/${normalized.replace(/_/g, "-")}`;
}
