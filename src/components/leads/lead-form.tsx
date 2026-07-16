"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/validation/leads";
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
import type { LeadRow } from "@/lib/supabase/database.types";

type BoundAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function LeadForm({
  action,
  lead,
  retreats,
  submitLabel = "Lead opslaan",
}: {
  action: BoundAction;
  lead?: LeadRow;
  retreats: { id: string; title: string }[];
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
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Naam</Label>
            <Input id="name" name="name" defaultValue={lead?.name} required />
            {err("name") && <p className="text-sm text-destructive">{err("name")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="retreatId">Gewenst retreat</Label>
            <Select name="retreatId" defaultValue={lead?.retreat_id ?? ""}>
              <SelectTrigger id="retreatId">
                <SelectValue placeholder="Geen specifiek retreat" />
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

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input id="email" name="email" type="email" defaultValue={lead?.email ?? ""} />
            {err("email") && <p className="text-sm text-destructive">{err("email")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefoon</Label>
            <Input id="phone" name="phone" defaultValue={lead?.phone ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Bron</Label>
            <Input
              id="source"
              name="source"
              placeholder="bijv. website, instagram, referral"
              defaultValue={lead?.source ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={lead?.status ?? "nieuw"}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {LEAD_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desiredPeriod">Gewenste periode</Label>
            <Input id="desiredPeriod" name="desiredPeriod" defaultValue={lead?.desired_period ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Bestemming</Label>
            <Input id="destination" name="destination" defaultValue={lead?.destination ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budgetRange">Budgetrange</Label>
            <Input id="budgetRange" name="budgetRange" defaultValue={lead?.budget_range ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partySize">Aantal personen</Label>
            <Input
              id="partySize"
              name="partySize"
              type="number"
              min={1}
              defaultValue={lead?.party_size ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="followUpDate">Follow-updatum</Label>
            <Input
              id="followUpDate"
              name="followUpDate"
              type="date"
              defaultValue={lead?.follow_up_date ?? ""}
            />
          </div>

          <div className="flex items-center gap-2 self-end pb-2">
            <input
              id="whatsappConsent"
              name="whatsappConsent"
              type="checkbox"
              defaultChecked={lead?.whatsapp_consent}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="whatsappConsent" className="font-normal">
              WhatsApp-toestemming
            </Label>
          </div>

          <div className="flex items-center gap-2 self-end pb-2">
            <input
              id="marketingConsent"
              name="marketingConsent"
              type="checkbox"
              defaultChecked={lead?.marketing_consent}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="marketingConsent" className="font-normal">
              Marketingtoestemming
            </Label>
          </div>

          <div className="flex items-center gap-2 self-end pb-2 sm:col-span-2">
            <input
              id="platformMatchingConsent"
              name="platformMatchingConsent"
              type="checkbox"
              defaultChecked={lead?.platform_matching_consent}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="platformMatchingConsent" className="font-normal">
              Toestemming om door JourneyOS voorgesteld te worden bij onderbezette
              retreats van andere organisatoren (platformbrede &ldquo;laatste
              kans&rdquo;-matching)
            </Label>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={lead?.notes ?? ""} />
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
