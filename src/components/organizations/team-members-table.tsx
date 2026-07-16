import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { formatDateShort } from "@/lib/format";
import type { TeamMemberRow, PendingInvitationRow } from "@/lib/data/organizations";

export function TeamMembersTable({
  members,
  pendingInvitations,
}: {
  members: TeamMemberRow[];
  pendingInvitations: PendingInvitationRow[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Lid sinds</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.profile.fullName || "Naam onbekend"}
                </TableCell>
                <TableCell>{ROLE_LABELS[member.role]}</TableCell>
                <TableCell>{formatDateShort(member.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pendingInvitations.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Openstaande uitnodigingen
          </h3>
          <div className="flex flex-col gap-2">
            {pendingInvitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>{invite.email}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ROLE_LABELS[invite.role]}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Verloopt {formatDateShort(invite.expiresAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
