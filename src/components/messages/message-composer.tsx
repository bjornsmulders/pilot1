"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { renderTemplate } from "@/lib/messaging";
import { buildWaLink } from "@/lib/whatsapp";
import { logMessageDeliveryAction } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { MessageTemplateRow } from "@/lib/supabase/database.types";

export function MessageComposer({
  organizationId,
  target,
  templates,
  recipientName,
  recipientPhone,
  retreatTitle,
}: {
  organizationId: string;
  target: { type: "lead" | "participant"; id: string };
  templates: MessageTemplateRow[];
  recipientName: string;
  recipientPhone: string | null;
  retreatTitle: string | null;
}) {
  const whatsappTemplates = useMemo(
    () => templates.filter((t) => t.channel === "whatsapp"),
    [templates]
  );
  const [templateId, setTemplateId] = useState(whatsappTemplates[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const selectedTemplate = whatsappTemplates.find((t) => t.id === templateId);
  const [firstName] = recipientName.trim().split(/\s+/);
  const renderedText = selectedTemplate
    ? renderTemplate(selectedTemplate.body, {
        voornaam: firstName || recipientName,
        retreat: retreatTitle ?? "",
      })
    : "";
  const waLink = recipientPhone ? buildWaLink(recipientPhone, renderedText) : null;

  if (whatsappTemplates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nog geen WhatsApp-templates.{" "}
        <Link href="/instellingen/berichten/nieuw" className="underline hover:no-underline">
          Maak er een aan
        </Link>
        .
      </p>
    );
  }

  function handleOpenWhatsApp() {
    if (!waLink) return;
    window.open(waLink, "_blank", "noopener,noreferrer");
    startTransition(async () => {
      const result = await logMessageDeliveryAction(organizationId, target, templateId, renderedText);
      if (!result.ok) toast.error(result.error ?? "Registreren is niet gelukt.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp-bericht</CardTitle>
        <CardDescription>Kies een template, controleer de tekst en verstuur.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Select value={templateId} onValueChange={setTemplateId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Kies een template" />
          </SelectTrigger>
          <SelectContent>
            {whatsappTemplates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea value={renderedText} readOnly rows={4} className="bg-muted" />

        {!recipientPhone && (
          <p className="text-sm text-destructive">Geen telefoonnummer bekend.</p>
        )}

        <Button
          type="button"
          onClick={handleOpenWhatsApp}
          disabled={!waLink || isPending}
          className="w-fit gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5a]"
        >
          <MessageCircle className="h-4 w-4" />
          Open in WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}
