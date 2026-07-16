import type { Metadata } from "next";

import { listMatchingCandidates, listMatchingRetreats } from "@/lib/data/platform";
import { IntroduceLeadForm } from "@/components/platform/introduce-lead-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Platformbrede laatste kans — JourneyOS" };
export const dynamic = "force-dynamic";

export default async function PlatformMatchingPage() {
  const [candidates, retreats] = await Promise.all([
    listMatchingCandidates(),
    listMatchingRetreats(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Platformbrede &ldquo;laatste kans&rdquo;-matching
        </h1>
        <p className="text-muted-foreground">
          Alleen zichtbaar voor JourneyOS-platformbeheer. Deze mensen gaven expliciet
          toestemming om voorgesteld te worden bij onderbezette retreats van andere
          organisatoren dan waar ze zich oorspronkelijk aanmeldden. Een introductie
          maakt een nieuwe lead aan bij de doelorganisator — die krijgt zelf geen
          toegang tot deze lijst of tot leads van andere organisaties.
        </p>
      </div>

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Nog geen kandidaten met platformbrede toestemming.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {candidates.map((candidate) => (
            <Card key={candidate.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {candidate.name}
                  <Badge variant="outline">{candidate.organization_name}</Badge>
                </CardTitle>
                <CardDescription>
                  {candidate.email ?? "geen e-mail"}
                  {candidate.phone ? ` · ${candidate.phone}` : ""} · sinds{" "}
                  {formatDateTime(candidate.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IntroduceLeadForm
                  leadId={candidate.id}
                  sourceOrganizationId={candidate.organization_id}
                  retreats={retreats}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
