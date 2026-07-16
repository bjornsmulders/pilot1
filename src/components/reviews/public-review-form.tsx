"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BoundAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function PublicReviewForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [rating, setRating] = useState(0);
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
      <Card id="review">
        <CardContent className="pt-6 text-sm text-foreground">
          <p className="font-medium">Bedankt voor je review!</p>
          <p className="mt-1 text-muted-foreground">
            Deze verschijnt hier zodra de organisator &rsquo;m heeft goedgekeurd.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="review">
      <CardHeader>
        <CardTitle>Was je hier? Laat een review achter</CardTitle>
        <CardDescription>Helpt toekomstige deelnemers om dit retreat te ontdekken.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="hidden" aria-hidden="true">
            <Label htmlFor="review-website">Website</Label>
            <Input id="review-website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authorName">Naam</Label>
            <Input id="authorName" name="authorName" required />
            {err("authorName") && <p className="text-sm text-destructive">{err("authorName")}</p>}
          </div>

          <div className="space-y-2">
            <Label>Waardering</Label>
            <input type="hidden" name="rating" value={rating} />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} van 5 sterren`}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "h-6 w-6",
                      value <= rating ? "fill-warning text-warning" : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
            {err("rating") && <p className="text-sm text-destructive">{err("rating")}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Jouw ervaring (optioneel)</Label>
            <Textarea id="body" name="body" rows={3} />
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Bezig met versturen…" : "Review versturen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
