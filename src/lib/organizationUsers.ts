/**

 * Helpers for matching mobile + web user docs in the root `users` collection

 * to an organization (tenant). Mobile may use different field names than the web app.

 */



const TENANT_ID_FIELDS = [

  "tenantId",

  "tenant_id",

  "tenantID",

  "orgId",

  "org_id",

  "organizationId",

  "organization_id",

  "organization",

  "org",

  "tenant",

] as const;



export function extractTenantId(data: Record<string, unknown>): string | null {

  for (const field of TENANT_ID_FIELDS) {

    const value = data[field];

    if (typeof value === "string" && value.trim().length > 0) return value.trim();

  }

  return null;

}



export function belongsToTenant(

  data: Record<string, unknown>,

  tenantId: string

): boolean {

  if (!tenantId) return false;

  return TENANT_ID_FIELDS.some((field) => {

    const value = data[field];

    return typeof value === "string" && value === tenantId;

  });

}



/** True when the doc links to any organization (mobile users often have none). */

export function hasTenantAssociation(data: Record<string, unknown>): boolean {

  return extractTenantId(data) !== null;

}



/**

 * Root `users` collection holds admins, trainers, and mobile members (`role` field).

 * Mobile members typically have role "user" and no tenantId/orgId on the document.

 */

export function shouldIncludeRootUser(

  data: Record<string, unknown>,

  tenantId: string

): boolean {

  const role = normalizeUserRole(data);



  if (role === "super_admin") return false;



  // App members from mobile — include when org matches OR doc has no org field yet

  if (isAppMemberRole(role)) {

    if (!hasTenantAssociation(data)) return true;

    return belongsToTenant(data, tenantId);

  }



  // Web admins & trainers in root `users` — only when tied to this tenant

  if (role === "admin" || role === "trainer") {

    return belongsToTenant(data, tenantId);

  }



  return belongsToTenant(data, tenantId);

}



/** Map web + mobile role strings to admin | trainer | user */

export function normalizeUserRole(data: Record<string, unknown>): string {

  const raw = data.role;

  const r = typeof raw === "string" ? raw.trim().toLowerCase() : "";



  if (r === "super_admin" || r === "super-admin") return "super_admin";

  if (r === "admin") return "admin";

  if (r === "trainer") return "trainer";

  if (

    r === "user" ||

    r === "customer" ||

    r === "member" ||

    r === "app_user" ||

    r === "end_user" ||

    r === "guest" ||

    r === "client"

  ) {

    return "user";

  }



  if (!r) return "user";



  return r;

}



export function isAppMemberRole(role: string): boolean {

  const r = role.toLowerCase();

  return (

    r === "user" ||

    r === "customer" ||

    r === "member" ||

    r === "app_user" ||

    r === "end_user" ||

    r === "client" ||

    r === "guest"

  );

}



export function userDisplayName(data: Record<string, unknown>): string {

  const fields = ["name", "trainer_name", "displayName", "fullName", "username"];

  for (const field of fields) {

    const v = data[field];

    if (typeof v === "string" && v.trim().length > 0) return v.trim();

  }

  return "";

}



export type PlatformUserTab = "admins" | "trainers" | "users";

/** Stable dedupe key across root `users` and tenant sub-collections */
export function platformUserMergeKey(
  uid: string,
  email: string,
  fullPath: string
): string {
  if (uid) return `uid:${uid}`;
  if (email && email !== "No Email") return `email:${email.trim().toLowerCase()}`;
  return `path:${fullPath}`;
}

export function matchesPlatformTab(

  role: string,

  tab: PlatformUserTab

): boolean {

  if (tab === "admins") return role === "admin";

  if (tab === "trainers") return role === "trainer";

  return isAppMemberRole(role);

}


