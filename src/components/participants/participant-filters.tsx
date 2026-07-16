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
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from "@/lib/validation/participants";

export function ParticipantFilters({
  retreats,
}: {
  retreats: { id: string; title: string }[];
}) {
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="Zoek op naam…"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(event) => updateParam("q", event.target.value)}
        className="max-w-xs"
        aria-label="Zoek deelnemers op naam"
      />
      <Select
        value={searchParams.get("retreatId") ?? "alle"}
        onValueChange={(value) => updateParam("retreatId", value === "alle" ? "" : value)}
      >
        <SelectTrigger className="w-56" aria-label="Filter op retreat">
          <SelectValue placeholder="Alle retreats" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle retreats</SelectItem>
          {retreats.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get("bookingStatus") ?? "alle"}
        onValueChange={(value) => updateParam("bookingStatus", value === "alle" ? "" : value)}
      >
        <SelectTrigger className="w-48" aria-label="Filter op boekingsstatus">
          <SelectValue placeholder="Alle boekingsstatussen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alle">Alle boekingsstatussen</SelectItem>
          {BOOKING_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {BOOKING_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
