"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { initialActionState } from "@/lib/action-state";
import { introduceLeadToRetreatAction } from "@/actions/platform";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlatformMatchingRetreatRow } from "@/lib/supabase/database.types";
import { formatDateRange } from "@/lib/format";

export function IntroduceLeadForm({
  leadId,
  sourceOrganizationId,
  retreats,
}: {
  leadId: string;
  sourceOrganizationId: string;
  retreats: PlatformMatchingRetreatRow[];
}) {
  const [state, formAction, pending] = useActionState(
    introduceLeadToRetreatAction,
    initialActionState
  );

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const eligibleRetreats = retreats.filter((r) => r.organization_id !== sourceOrganizationId);

  if (eligibleRetreats.length === 0) {
    return <p className="text-sm text-muted-foreground">Geen actieve retreats om naar te introduceren.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="sourceLeadId" value={leadId} />
      <Select name="targetRetreatId">
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Kies een retreat" />
        </SelectTrigger>
        <SelectContent>
          {eligibleRetreats.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.title} — {r.organization_name} ({formatDateRange(r.start_date, r.end_date)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Bezig…" : "Introduceren"}
      </Button>
    </form>
  );
}
