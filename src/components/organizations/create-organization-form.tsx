"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { createOrganizationAction } from "@/actions/organizations";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CreateOrganizationForm() {
  const [state, formAction, pending] = useActionState(
    createOrganizationAction,
    initialActionState
  );

  useEffect(() => {
    if (state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Je organisatie aanmaken</CardTitle>
        <CardDescription>
          Dit wordt je werkruimte in JourneyOS. Je kunt hierna teamleden
          uitnodigen en retreats aanmaken. Je wordt automatisch eigenaar.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam van je organisatie</Label>
            <Input id="name" name="name" placeholder="Bijv. Stille Kracht Retreats" required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Land</Label>
            <Input id="country" name="country" defaultValue="Nederland" required />
            {state.fieldErrors?.country && (
              <p className="text-sm text-destructive">{state.fieldErrors.country[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact-e-mailadres (optioneel)</Label>
            <Input id="contactEmail" name="contactEmail" type="email" />
            {state.fieldErrors?.contactEmail && (
              <p className="text-sm text-destructive">{state.fieldErrors.contactEmail[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Bezig…" : "Organisatie aanmaken"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
