"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { convertLeadToParticipantAction } from "@/actions/leads";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ConvertToParticipantDialog({
  organizationId,
  leadId,
  defaultRetreatId,
  retreats,
}: {
  organizationId: string;
  leadId: string;
  defaultRetreatId: string | null;
  retreats: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const boundAction = convertLeadToParticipantAction.bind(null, organizationId, leadId);
  const [state, formAction, pending] = useActionState(boundAction, initialActionState);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Omzetten naar deelnemer</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lead omzetten naar deelnemer</DialogTitle>
          <DialogDescription>
            Kies voor welk retreat deze persoon als deelnemer wordt
            toegevoegd.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="convert-retreatId">Retreat</Label>
            <Select name="retreatId" defaultValue={defaultRetreatId ?? undefined} required>
              <SelectTrigger id="convert-retreatId">
                <SelectValue placeholder="Kies een retreat" />
              </SelectTrigger>
              <SelectContent>
                {retreats.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Bezig…" : "Bevestigen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
