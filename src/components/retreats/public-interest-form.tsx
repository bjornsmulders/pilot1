"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type BoundAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function PublicInterestForm({ action }: { action: BoundAction }) {
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

  if (state.status === "success") {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-foreground">
          <p className="font-medium">Bedankt voor je interesse!</p>
          <p className="mt-1 text-muted-foreground">
            We nemen zo snel mogelijk contact met je op.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interesse doorgeven</CardTitle>
        <CardDescription>
          Vul je gegevens in, dan nemen we contact met je op over dit retreat.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          {/* Honeypot: onzichtbaar voor mensen, bots vullen dit vaak toch in. */}
          <div className="hidden" aria-hidden="true">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Naam</Label>
            <Input id="name" name="name" required />
            {err("name") && <p className="text-sm text-destructive">{err("name")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input id="email" name="email" type="email" required />
            {err("email") && <p className="text-sm text-destructive">{err("email")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoon (optioneel)</Label>
            <Input id="phone" name="phone" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desiredPeriod">Gewenste periode (optioneel)</Label>
            <Input id="desiredPeriod" name="desiredPeriod" placeholder="bijv. voorjaar 2026" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Bericht (optioneel)</Label>
            <Textarea id="message" name="message" rows={3} />
          </div>

          <div className="flex items-start gap-2">
            <input
              id="whatsappConsent"
              name="whatsappConsent"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input"
            />
            <Label htmlFor="whatsappConsent" className="font-normal">
              Ik geef toestemming om via WhatsApp benaderd te worden over dit retreat.
            </Label>
          </div>

          <div className="flex items-start gap-2">
            <input
              id="marketingConsent"
              name="marketingConsent"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input"
            />
            <Label htmlFor="marketingConsent" className="font-normal">
              Ik wil op de hoogte gehouden worden van toekomstige retreats van deze
              organisator.
            </Label>
          </div>

          <div className="flex items-start gap-2">
            <input
              id="platformMatchingConsent"
              name="platformMatchingConsent"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input"
            />
            <Label htmlFor="platformMatchingConsent" className="font-normal">
              Ik hoor ook graag over laatste-kans plekken bij andere retreats op
              JourneyOS, mocht dit retreat niet voor mij lukken.
            </Label>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Bezig met versturen…" : "Interesse doorgeven"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
