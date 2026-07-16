"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import type { AnnouncementRow } from "@/lib/supabase/database.types";

export function AnnouncementList({
  announcements,
  onDelete,
}: {
  announcements: AnnouncementRow[];
  onDelete?: (announcementId: string) => void;
}) {
  if (announcements.length === 0) {
    return <p className="text-sm text-muted-foreground">Nog geen mededelingen.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {announcements.map((announcement) => (
        <Card key={announcement.id}>
          <CardContent className="flex flex-wrap items-start justify-between gap-2 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{announcement.title}</p>
                {!announcement.visible_to_participants && (
                  <Badge variant="outline">Alleen team</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(announcement.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground">{announcement.body}</p>
            </div>
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(announcement.id)}
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
