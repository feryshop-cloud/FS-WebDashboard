export const ADMIN_ROLES = ["OWNER", "ADMIN"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AppRole = AdminRole | "VIEWER" | "MEMBER";

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === "OWNER" || role === "ADMIN";
}
