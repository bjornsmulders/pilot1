"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { ScheduleItemRow } from "@/lib/supabase/database.types";

export function ScheduleList({
  items,
  onDelete,
}: {
  items: ScheduleItemRow[];
  onDelete?: (scheduleItemId: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen programmaonderdelen.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-wrap items-start justify-between gap-2 py-3">
            <div>
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.starts_at ? formatDateTime(item.starts_at) : "Geen tijd ingesteld"}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                aria-label="Verwijderen"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
