"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { acceptInvitationAction } from "@/actions/organizations";
import { initialActionState } from "@/lib/action-state";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { OrganizationRole } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function AcceptInvitationCard({
  token,
  organizationName,
  role,
}: {
  token: string;
  organizationName: string;
  role: OrganizationRole;
}) {
  const boundAction = acceptInvitationAction.bind(null, token);
  const [state, formAction, pending] = useActionState(boundAction, initialActionState);

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uitnodiging voor {organizationName}</CardTitle>
        <CardDescription>
          Je bent uitgenodigd als {ROLE_LABELS[role]}. Accepteer om toegang te
          krijgen.
        </CardDescription>
      </CardHeader>
      <CardContent />
      <CardFooter>
        <form action={formAction} className="w-full">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Bezig…" : "Uitnodiging accepteren"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
