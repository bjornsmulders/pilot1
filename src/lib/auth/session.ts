import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { OrganizationRole } from "@/lib/supabase/database.types";
import { AuthorizationError } from "./errors";

/**
 * Data Access Layer voor authenticatie en autorisatie. Elke Server Action en
 * elke server-side data-ophaling hoort via deze functies te lopen — nooit
 * rechtstreeks een Supabase-query zonder eerst de sessie/rol te checken. Dit is
 * laag 1 van de twee verdedigingslagen; RLS (laag 2) blijft ook actief. Zie
 * docs/architecture.md en docs/security.md.
 */

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/inloggen");
  }
  return user;
}

export interface MembershipWithOrganization {
  id: string;
  organizationId: string;
  role: OrganizationRole;
  status: "actief" | "gedeactiveerd";
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

interface RawMembershipRow {
  id: string;
  organization_id: string;
  role: OrganizationRole;
  status: "actief" | "gedeactiveerd";
  organizations:
    | { id: string; name: string; slug: string }
    | { id: string; name: string; slug: string }[]
    | null;
}

export const getMemberships = cache(async (): Promise<MembershipWithOrganization[]> => {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select(
      "id, organization_id, role, status, organizations(id, name, slug)"
    )
    .eq("profile_id", user.id)
    .eq("status", "actief")
    .order("created_at", { ascending: true })
    .returns<RawMembershipRow[]>();

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const organization = Array.isArray(row.organizations)
      ? row.organizations[0]
      : row.organizations;
    if (!organization) return [];
    return [
      {
        id: row.id,
        organizationId: row.organization_id,
        role: row.role,
        status: row.status,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      },
    ];
  });
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
});

/**
 * JourneyOS-platformbeheer (niet een organisatierol) -- zie
 * supabase/migrations/20260716123500_platform_matching.sql en ADR-0007 in
 * docs/decisions.md. `is_platform_admin` is nu alleen handmatig in de database
 * te zetten, er is bewust geen UI om jezelf platformbeheerder te maken.
 */
export async function requirePlatformAdmin() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  if (!profile?.is_platform_admin) {
    throw new AuthorizationError("Alleen platformbeheerders hebben hier toegang.");
  }
  return user;
}

/** Eerste (oudste) organisatie van de gebruiker. Pilot-vereenvoudiging: geen
 * org-switcher in slice 1 — organisatoren beheren doorgaans één organisatie. */
export async function getActiveMembership(): Promise<MembershipWithOrganization | null> {
  const memberships = await getMemberships();
  return memberships[0] ?? null;
}

export async function getCurrentMembership(
  organizationId: string
): Promise<MembershipWithOrganization | null> {
  const memberships = await getMemberships();
  return memberships.find((m) => m.organizationId === organizationId) ?? null;
}

export async function requireMembership(
  organizationId: string
): Promise<MembershipWithOrganization> {
  const membership = await getCurrentMembership(organizationId);
  if (!membership) {
    throw new AuthorizationError(
      "Je hebt geen toegang tot deze organisatie."
    );
  }
  return membership;
}

export async function requireRole(
  organizationId: string,
  allowedRoles: OrganizationRole[]
): Promise<MembershipWithOrganization> {
  const membership = await requireMembership(organizationId);
  if (!allowedRoles.includes(membership.role)) {
    throw new AuthorizationError(
      "Je hebt niet de juiste rol voor deze actie."
    );
  }
  return membership;
}
