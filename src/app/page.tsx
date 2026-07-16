import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="text-lg font-semibold text-primary">JourneyOS</span>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/inloggen">Inloggen</Link>
          </Button>
          <Button asChild>
            <Link href="/registreren">Gratis starten</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center gap-6 px-6 py-24">
        <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          Vul je retreat sneller, organiseer hem zonder WhatsApp- en
          Excel-chaos.
        </h1>
        <p className="text-lg text-muted-foreground">
          JourneyOS vervangt WhatsApp niet — het beheert de duurzame structuur
          eromheen: leads, deelnemers, onboarding, praktische informatie,
          alumni en referrals. Zo gebruik je iedere retreat om de volgende
          makkelijker te verkopen.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/registreren">Account aanmaken</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/inloggen">Ik heb al een account</Link>
          </Button>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4 text-sm text-muted-foreground">
        JourneyOS — pilot voor Nederlandse retreatorganisatoren
      </footer>
    </div>
  );
}
