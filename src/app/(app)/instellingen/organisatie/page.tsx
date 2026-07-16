import type { Metadata } from "next";

import { getActiveMembership } from "@/lib/auth/session";
import { canManageTeam } from "@/lib/auth/permissions";
import { listTeamMembers, listPendingInvitations } from "@/lib/data/organizations";
import { InviteMemberForm } from "@/components/organizations/invite-member-form";
import { TeamMembersTable } from "@/components/organizations/team-members-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Organisatie-instellingen — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function OrganisatieInstellingenPage() {
  const membership = await getActiveMembership();
  if (!membership) return null;

  const isOwner = canManageTeam(membership.role);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Organisatie-instellingen</h1>
        <p className="text-muted-foreground">{membership.organization.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>
            {isOwner
              ? "Nodig teamleden uit en beheer hun rol."
              : "Alleen de eigenaar van de organisatie kan teamleden beheren."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {isOwner ? (
            <TeamSettings organizationId={membership.organizationId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Vraag de eigenaar van je organisatie om je rol te wijzigen of
              nieuwe teamleden uit te nodigen.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function TeamSettings({ organizationId }: { organizationId: string }) {
  const [members, pendingInvitations] = await Promise.all([
    listTeamMembers(organizationId),
    listPendingInvitations(organizationId),
  ]);

  return (
    <>
      <InviteMemberForm organizationId={organizationId} />
      <TeamMembersTable members={members} pendingInvitations={pendingInvitations} />
    </>
  );
}
