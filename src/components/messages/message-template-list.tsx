"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MESSAGE_CHANNEL_LABELS } from "@/lib/validation/messages";
import type { MessageTemplateRow } from "@/lib/supabase/database.types";

export function MessageTemplateList({
  templates,
  onDelete,
}: {
  templates: MessageTemplateRow[];
  onDelete: (templateId: string) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="font-medium text-foreground">Nog geen templates</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Maak een template om sneller WhatsApp-berichten voor te bereiden.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardContent className="flex flex-wrap items-start justify-between gap-2 py-3">
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/instellingen/berichten/${template.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {template.name}
                </Link>
                <Badge variant="outline">{MESSAGE_CHANNEL_LABELS[template.channel]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{template.key}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.body}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(template.id)}
              aria-label="Verwijderen"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
