"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/validation/leads";

export function LeadFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  const followUpOnly = searchParams.get("followUp") === "1";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Zoek op naam…"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(event) => updateParam("q", event.target.value)}
        className="max-w-xs"
        aria-label="Zoek leads op naam"
      />
      <Select
        value={searchParams.get("status") ?? "alle"}
        onValueChange={(value) => updateParam("status", value === "alle" ? "" : value)}
      >
        <SelectTrigger className="w-48" aria-label="Filter op status">
          <SelectValue placeholder="Alle statussen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle statussen</SelectItem>
          {LEAD_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant={followUpOnly ? "default" : "outline"}
        size="sm"
        onClick={() => updateParam("followUp", followUpOnly ? "" : "1")}
      >
        Follow-up vandaag/verlopen
      </Button>
    </div>
  );
}
