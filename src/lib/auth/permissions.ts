import type { OrganizationRole } from "@/lib/supabase/database.types";

export type { OrganizationRole };

/**
 * Server-side spiegel van de RLS-policies in
 * supabase/migrations/20260716081524_rls_policies.sql. Bij elke wijziging hier
 * ook de bijbehorende policy aanpassen (en andersom) — zie docs/security.md
 * voor de volledige, leesbare matrix.
 */

export function canUpdateOrganization(role: OrganizationRole): boolean {
  return role === "owner";
}

export function canManageTeam(role: OrganizationRole): boolean {
  return role === "owner";
}

export function canCreateRetreat(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageRetreat(
  role: OrganizationRole,
  isAssignedCoordinator: boolean
): boolean {
  if (role === "owner" || role === "admin") return true;
  return role === "coordinator" && isAssignedCoordinator;
}

export function canViewRetreat(
  role: OrganizationRole,
  isAssignedCoordinator: boolean
): boolean {
  if (role === "owner" || role === "admin" || role === "viewer") return true;
  return role === "coordinator" && isAssignedCoordinator;
}

export function canArchiveRetreat(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canViewAuditLog(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canViewFinancials(role: OrganizationRole): boolean {
  return role === "owner" || role === "admin" || role === "viewer";
}

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  owner: "Eigenaar",
  admin: "Beheerder",
  coordinator: "Coördinator",
  viewer: "Kijker",
};

export const ASSIGNABLE_ROLES: OrganizationRole[] = [
  "admin",
  "coordinator",
  "viewer",
];
