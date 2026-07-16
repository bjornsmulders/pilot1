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
import { RETREAT_STATUSES, RETREAT_STATUS_LABELS } from "@/lib/validation/retreats";

export function RetreatFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Zoek op titel…"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(event) => updateParam("q", event.target.value)}
        className="max-w-xs"
        aria-label="Zoek retreats op titel"
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
          {RETREAT_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {RETREAT_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
