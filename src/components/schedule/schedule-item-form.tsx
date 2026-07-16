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

export function ScheduleItemForm({ action }: { action: BoundAction }) {
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
        <CardTitle className="text-base">Onderdeel toevoegen</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Titel</Label>
            <Input id="title" name="title" required />
            {err("title") && <p className="text-sm text-destructive">{err("title")}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="startsAt">Start</Label>
            <Input id="startsAt" name="startsAt" type="datetime-local" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endsAt">Einde</Label>
            <Input id="endsAt" name="endsAt" type="datetime-local" />
            {err("endsAt") && <p className="text-sm text-destructive">{err("endsAt")}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Locatie</Label>
            <Input id="location" name="location" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Volgorde</Label>
            <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Omschrijving</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Bezig…" : "Toevoegen"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
