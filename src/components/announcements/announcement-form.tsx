"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BoundAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function AnnouncementForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
    if (state.status === "success" && state.message) {
      toast.success(state.message);
      formRef.current?.reset();
    }
  }, [state]);

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nieuwe mededeling</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" name="title" required />
            {err("title") && <p className="text-sm text-destructive">{err("title")}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Bericht</Label>
            <Textarea id="body" name="body" rows={3} required />
            {err("body") && <p className="text-sm text-destructive">{err("body")}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="visibleToParticipants"
              name="visibleToParticipants"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="visibleToParticipants" className="font-normal">
              Zichtbaar voor deelnemers (zodra hun onboardingportaal er is)
            </Label>
          </div>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Bezig…" : "Plaatsen"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
