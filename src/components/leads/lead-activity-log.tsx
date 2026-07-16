"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { addLeadActivityAction } from "@/actions/leads";
import { initialActionState } from "@/lib/action-state";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadActivityRow } from "@/lib/supabase/database.types";

export function LeadActivityLog({
  organizationId,
  leadId,
  activities,
}: {
  organizationId: string;
  leadId: string;
  activities: LeadActivityRow[];
}) {
  const boundAction = addLeadActivityAction.bind(null, organizationId, leadId);
  const [state, formAction, pending] = useActionState(boundAction, initialActionState);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activiteitenlog</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="activityType" className="text-xs">
              Activiteit
            </Label>
            <Input
              id="activityType"
              name="activityType"
              placeholder="bijv. gesprek gehad"
              className="w-48"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs">
              Toelichting
            </Label>
            <Input id="description" name="description" className="w-56" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="scoreDelta" className="text-xs">
              Score +/-
            </Label>
            <Input id="scoreDelta" name="scoreDelta" type="number" defaultValue={0} className="w-24" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Bezig…" : "Toevoegen"}
          </Button>
        </form>

        <div className="flex flex-col gap-3 border-t border-border pt-4">
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground">Nog geen activiteiten geregistreerd.</p>
          )}
          {activities.map((activity) => (
            <div key={activity.id} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{activity.activity_type}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(activity.created_at)}
                </span>
              </div>
              {activity.description && (
                <p className="text-muted-foreground">{activity.description}</p>
              )}
              {activity.score_delta !== 0 && (
                <p className="text-xs text-muted-foreground">
                  Score {activity.score_delta > 0 ? "+" : ""}
                  {activity.score_delta}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
