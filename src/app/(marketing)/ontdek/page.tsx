import type { Metadata } from "next";

import { listPublicRetreats } from "@/lib/data/retreats";
import { PublicRetreatCard } from "@/components/retreats/public-retreat-card";

export const metadata: Metadata = { title: "Ontdek retreats — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function DiscoverRetreatsPage() {
  const retreats = await listPublicRetreats();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold text-foreground">Ontdek retreats</h1>
        <p className="mt-2 text-muted-foreground">
          Een overzicht van openbare retreats van organisatoren die JourneyOS
          gebruiken. Meld je direct aan bij de organisator van je keuze.
        </p>
      </div>

      {retreats.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-border p-10 text-center">
          <p className="font-medium text-foreground">Nog geen openbare retreats</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kom binnenkort terug, of vraag je favoriete retreatorganisator om
            JourneyOS te gebruiken.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {retreats.map((retreat) => (
            <PublicRetreatCard key={retreat.id} retreat={retreat} />
          ))}
        </div>
      )}
    </div>
  );
}
