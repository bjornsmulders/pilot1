"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { MESSAGE_CHANNELS, MESSAGE_CHANNEL_LABELS } from "@/lib/validation/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { MessageTemplateRow } from "@/lib/supabase/database.types";

type BoundAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function MessageTemplateForm({
  action,
  template,
  submitLabel = "Template opslaan",
}: {
  action: BoundAction;
  template?: MessageTemplateRow;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Naam</Label>
              <Input id="name" name="name" defaultValue={template?.name} required />
              {err("name") && <p className="text-sm text-destructive">{err("name")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Sleutel</Label>
              <Input
                id="key"
                name="key"
                placeholder="welkom"
                defaultValue={template?.key}
                required
              />
              <p className="text-xs text-muted-foreground">
                Alleen kleine letters/cijfers/underscores, uniek binnen je organisatie.
              </p>
              {err("key") && <p className="text-sm text-destructive">{err("key")}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel">Kanaal</Label>
            <Select name="channel" defaultValue={template?.channel ?? "whatsapp"}>
              <SelectTrigger id="channel" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_CHANNELS.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {MESSAGE_CHANNEL_LABELS[channel]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Berichttekst</Label>
            <Textarea id="body" name="body" rows={5} defaultValue={template?.body} required />
            <p className="text-xs text-muted-foreground">
              Beschikbare variabelen: <code>{"{{voornaam}}"}</code> en{" "}
              <code>{"{{retreat}}"}</code>.
            </p>
            {err("body") && <p className="text-sm text-destructive">{err("body")}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Bezig met opslaan…" : submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
