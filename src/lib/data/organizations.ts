import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { OrganizationRole } from "@/lib/supabase/database.types";

export interface TeamMemberRow {
  id: string;
  role: OrganizationRole;
  status: "actief" | "gedeactiveerd";
  createdAt: string;
  profile: { id: string; fullName: string };
}

interface RawTeamMemberRow {
  id: string;
  role: OrganizationRole;
  status: "actief" | "gedeactiveerd";
  created_at: string;
  profiles: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
}

export async function listTeamMembers(organizationId: string): Promise<TeamMemberRow[]> {
  await requireRole(organizationId, ["owner", "admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    // organization_members heeft twee foreign keys naar profiles (profile_id
    // én invited_by), dus PostgREST kan de relatie niet automatisch afleiden
    // zonder de "!profile_id"-hint -- anders faalt dit met PGRST201
    // ("more than one relationship was found").
    .select("id, role, status, created_at, profiles!profile_id(id, full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })
    .returns<RawTeamMemberRow[]>();

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!profile) return [];
    return [
      {
        id: row.id,
        role: row.role,
        status: row.status,
        createdAt: row.created_at,
        profile: { id: profile.id, fullName: profile.full_name },
      },
    ];
  });
}

export interface PendingInvitationRow {
  id: string;
  email: string;
  role: OrganizationRole;
  expiresAt: string;
}

export async function listPendingInvitations(
  organizationId: string
): Promise<PendingInvitationRow[]> {
  await requireRole(organizationId, ["owner"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role, expires_at")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    expiresAt: row.expires_at,
  }));
}
