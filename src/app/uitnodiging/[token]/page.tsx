import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AcceptInvitationCard } from "@/components/organizations/accept-invitation-card";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Uitnodiging — JourneyOS" };

export default async function UitnodigingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("preview_invitation", { invitation_token: token });
  const preview = data?.[0];

  if (!preview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ongeldige of verlopen uitnodiging</CardTitle>
          <CardDescription>
            Deze link werkt niet meer. Vraag de organisatie om een nieuwe
            uitnodiging te versturen.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/inloggen">Naar inloggen</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const user = await getCurrentUser();
  const currentPath = `/uitnodiging/${token}`;

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uitnodiging voor {preview.organization_name}</CardTitle>
          <CardDescription>
            Log in of maak een account aan met {preview.email} om deze
            uitnodiging te accepteren.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href={`/inloggen?volgende=${encodeURIComponent(currentPath)}`}>
              Inloggen
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={`/registreren?volgende=${encodeURIComponent(currentPath)}`}>
              Account aanmaken
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (user.email?.toLowerCase() !== preview.email.toLowerCase()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ander e-mailadres nodig</CardTitle>
          <CardDescription>
            Je bent ingelogd als {user.email}, maar deze uitnodiging is
            verstuurd naar {preview.email}. Log uit en log opnieuw in met dat
            adres.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <AcceptInvitationCard
      token={token}
      organizationName={preview.organization_name}
      role={preview.role}
    />
  );
}
