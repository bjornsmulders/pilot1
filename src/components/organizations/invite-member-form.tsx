"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { inviteMemberAction } from "@/actions/organizations";
import { initialActionState } from "@/lib/action-state";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InviteMemberForm({ organizationId }: { organizationId: string }) {
  const boundAction = inviteMemberAction.bind(null, organizationId);
  const [state, formAction, pending] = useActionState(boundAction, initialActionState);

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
    if (state.status === "success" && state.message) {
      toast.success(state.message, { duration: 15000 });
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="invite-email">E-mailadres</Label>
        <Input id="invite-email" name="email" type="email" required />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Rol</Label>
        <Select name="role" defaultValue="coordinator">
          <SelectTrigger id="invite-role" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Bezig…" : "Uitnodigen"}
      </Button>
    </form>
  );
}
