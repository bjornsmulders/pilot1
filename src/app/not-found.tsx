import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Fout 404
      </p>
      <h1 className="text-2xl font-semibold text-foreground">Pagina niet gevonden</h1>
      <p className="max-w-md text-muted-foreground">
        Deze pagina bestaat niet, is verwijderd, of je hebt er geen toegang
        toe.
      </p>
      <Button asChild>
        <Link href="/dashboard">Terug naar dashboard</Link>
      </Button>
    </div>
  );
}
