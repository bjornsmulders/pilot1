"use client";

import { useActionState, useEffect, useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { buildWaLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

type BoundAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function IssueInviteForm({
  action,
  participantName,
  participantPhone,
}: {
  action: BoundAction;
  participantName: string;
  participantPhone: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  if (state.status === "success" && state.message) {
    const url = state.message;
    const waMessage = `Hoi ${participantName}! Hier is je persoonlijke link om je reisgegevens en dieetwensen door te geven: ${url}`;
    const waLink = participantPhone ? buildWaLink(participantPhone, waMessage) : null;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-md bg-muted px-3 py-2 text-sm">{url}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Gekopieerd" : "Kopiëren"}
          </Button>
        </div>
        {waLink && (
          <Button asChild size="sm" className="w-fit gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5a]">
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Versturen via WhatsApp
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <form action={formAction}>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Bezig…" : "Verstuur onboardinglink"}
      </Button>
    </form>
  );
}
