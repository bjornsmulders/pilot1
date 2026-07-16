"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function PublicLinkCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Openbare retreatpagina</CardTitle>
        <CardDescription>
          Zet deze link op je eigen website of social media, zodat
          geïnteresseerden direct hun interesse kunnen doorgeven.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-muted px-3 py-2 text-sm">{url}</code>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Gekopieerd" : "Kopiëren"}
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild className="gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Bekijken
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
