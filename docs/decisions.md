# Architectuurbeslissingen (ADR-log)

Kort en chronologisch. Elke beslissing die niet vanzelfsprekend uit de opdracht
volgt, staat hier met de reden.

## ADR-0001 — Next.js 16: `proxy.ts` in plaats van `middleware.ts`

**Status**: geaccepteerd.
**Context**: deze omgeving draait Next.js 16.2.10, dat `middleware.ts` heeft
hernoemd naar `proxy.ts` (functie `proxy`, alleen Node-runtime). `AGENTS.md`
waarschuwt expliciet dat dit niet de Next.js uit trainingsdata is.
**Beslissing**: alle route-protection/optimistische auth-redirects staan in
`proxy.ts`. Geen `middleware.ts` toevoegen.
**Gevolg**: builds op basis van oudere Next.js-aannames (bv. een AI-suggestie die
`middleware.ts` voorstelt) breken bewust — dat is een signaal om deze ADR te
raadplegen, niet een bug.

## ADR-0002 — Geen `participant`-rol in `organization_members`

**Status**: geaccepteerd.
**Context**: de opdracht noemt Participant als vijfde rol naast Owner/Admin/
Coordinator/Viewer, maar specificeert ook expliciet (Module E) dat een deelnemer
"geen volledig account hoeft aan te maken".
**Beslissing**: `organization_role` bevat alleen de vier stafrollen. Deelnemers
krijgen nooit een `organization_members`-rij en loggen niet in via Supabase Auth.
Hun toegang tot hun eigen onboarding loopt via een gehasht, vervalbaar token
(`participant_invites.token_hash`). De RLS-laag voor die self-service toegang wordt
in de onboarding-slice (Module E) toegevoegd als een aparte, smalle policy per tabel
("alleen eigen rij, geldig token") — niet via `organization_members`.
**Gevolg**: de permissions matrix in `docs/security.md` gaat over stafrollen; de
participant-toegang wordt daar apart beschreven, niet als vijfde kolom.

## ADR-0003 — Organisatie aanmaken via `SECURITY DEFINER`-functie, geen directe INSERT

**Status**: geaccepteerd.
**Context**: als `organizations` een gewone INSERT-policy voor `authenticated` zou
hebben, kan een race condition of een bug in de server action een organisatie zonder
eigenaar achterlaten.
**Beslissing**: `public.create_organization(...)` maakt organisatie + eigenaar-
membership + audit-log-rij atomisch aan, als enige geautoriseerde weg. Er is
bewust geen INSERT-policy op `organizations`.
**Gevolg**: elke toekomstige manier om een organisatie aan te maken (bv. een import-
tool) moet door deze functie heen, of een vergelijkbare atomaire functie krijgen.

## ADR-0004 — shadcn/ui-componenten handmatig gebouwd, niet via de CLI

**Status**: geaccepteerd (tijdelijke workaround).
**Context**: de uitgaande proxy in deze sandbox blokkeert `ui.shadcn.com` (403 op de
CONNECT-tunnel); `npx shadcn init/add` kan daardoor geen componenten ophalen.
**Beslissing**: de benodigde componenten (Button, Input, Card, Table, Dialog, ...)
zijn met de hand geschreven in `src/components/ui/`, met dezelfde Radix-primitieven
en dezelfde bestandsstructuur/naming als de officiële generator zou opleveren.
**Gevolg**: functioneel gelijkwaardig. Zodra de CLI wél bereikbaar is (bv. lokaal bij
de gebruiker, of na een proxy-policy-wijziging), kunnen deze bestanden 1-op-1
vervangen worden door `npx shadcn add <component>` zonder de rest van de app te
raken — de imports (`@/components/ui/button`, etc.) blijven identiek.

## ADR-0005 — Financiële zichtbaarheid: coordinator leest, schrijft niet

**Status**: geaccepteerd.
**Context**: de opdracht zegt dat Owner "financiële gegevens ziet" en Coordinator
"geen organisatiebrede financiële instellingen" ziet, maar is niet expliciet over of
een coordinator de betaalstatus van zíjn eigen toegewezen deelnemers mag zien.
**Beslissing**: een coordinator mag `payments`-rijen **lezen** voor retreats waaraan
hij is toegewezen (nodig om "betaling openstaand" te kunnen signaleren aan een
deelnemer), maar nooit schrijven/wijzigen. Alleen Owner/Admin registreren of wijzigen
betalingen.
**Gevolg**: RLS `payments_select` staat coordinator-leestoegang toe via
`is_retreat_team_member`; `payments_write` is beperkt tot `owner`/`admin`.

## ADR-0006 — Geen live Supabase-project in de bouwomgeving

**Status**: geaccepteerd, met openstaande vervolgstap.
**Context**: deze sandbox heeft geen Docker-daemon (dus geen `supabase start`) en
geen gekoppeld Supabase-cloudproject. Migraties, RLS en seed-data zijn geschreven en
statisch gecontroleerd, maar niet tegen een echte Postgres uitgevoerd.
**Beslissing**: alle SQL wordt met zorg geschreven en waar mogelijk lokaal
gevalideerd (syntax, FK-volgorde), maar de daadwerkelijke `supabase db push` en
Playwright end-to-end-runs zijn een handmatige vervolgstap voor de gebruiker, zodra
er een Supabase-project + credentials zijn. Zie `docs/pilot-setup.md`.
**Gevolg**: dit is de belangrijkste openstaande "handmatige configuratie" in het
eindrapport van slice 1.

## ADR-0007 — Geen platformbrede deelnemerspool (marktplaats-netwerkeffect), voorlopig

**Status**: overwogen, bewust uitgesteld.
**Context**: de gebruiker vroeg of JourneyOS de totale deelnemersdatabase over alle
organisatoren heen kan laten groeien, zodat nieuwe organisatoren profiteren van een
bestaande pool geïnteresseerden (netwerkeffect). Dit staat op gespannen voet met twee
eerdere, expliciete eisen: "geen publieke marktplaats" (scope-uitsluiting in de
oorspronkelijke opdracht) en de tenant-isolatie (RLS) die deelnemersdata strikt per
organisatie scoped — data van organisator A mag nooit stilzwijgend zichtbaar worden
voor organisator B.
**Beslissing**: geen platformbrede pool bouwen in de pilot. Wel is er al een
databasemodel-opening voor later: `consent_type` bevat naast
`marketing_organisator` (toestemming om door déze organisator benaderd te worden)
ook `marketing_journeyos` (toestemming om door JourneyOS zelf, platformbreed,
benaderd te worden) — twee aparte, expliciete opt-ins. Alleen deelnemers met
`marketing_journeyos`-toestemming zouden ooit in een gedeelde matching-/introductie-
functie mogen voorkomen, en nooit via automatische data-deling tussen organisaties.
**Gevolg**: dit is een aparte, toekomstige productbeslissing (met eigen AVG-analyse,
verwerkingsgrondslag en UI-copy) zodra er voldoende schaal/pilotorganisaties zijn —
geen sluipende scope-uitbreiding van de huidige pilot. **Vervolg (dezelfde sessie)**:
de gebruiker vroeg door en koos ervoor dit ín de pilot te bouwen, maar bewust smaller
en platform-gemedieerd: geen directe cross-tenant toegang tussen organisatoren, wel
een los, expliciet `leads.platform_matching_consent` en een JourneyOS-platformbeheer-
rol (`profiles.is_platform_admin`) die handmatig, één voor één, introduceert. Zie
`supabase/migrations/20260716123500_platform_matching.sql` en `docs/security.md`.

## ADR-0008 — Publieke marktplaats (`/ontdek`) en organisatorpagina's (`/o/[orgSlug]`)

**Status**: geaccepteerd — expliciete koerswijziging t.o.v. de oorspronkelijke opdracht.
**Context**: de oorspronkelijke opdracht sloot een "publieke internationale
marktplaats" uit. De gebruiker vroeg expliciet (na een duidelijke waarschuwing
over deze eerdere scope-uitsluiting) om dit alsnog te bouwen: één centrale
JourneyOS-pagina met open retreats van alle organisatoren samen, plus een
publieke pagina per organisator met al hun eigen openbare retreats.
**Beslissing**: gebouwd als `/ontdek` (platformbrede lijst) en `/o/[orgSlug]`
(per-organisator lijst), beide gevoed door de nieuwe `list_public_retreats(...)`-
en `get_public_organization(...)`-RPC's
(`supabase/migrations/20260716150000_public_marketplace_and_org_pages.sql`).
Geen nieuwe RLS-policy nodig op `retreats` — de al bestaande
`retreats_public_select`-policy was al platformbreed (geen organisatiefilter),
dus dit was al technisch mogelijk zodra men de juiste query schreef. De nieuwe
RPC's geven bewust een smalle projectie terug (geen interne velden, geen brede
leestoegang tot `organizations`) i.p.v. een nieuwe permissieve policy op
`organizations` zelf.
**Gevolg**: elk `openbaar`-gezet retreat met een `public_slug` is vanaf nu
platformbreed vindbaar, niet meer alleen via de link die de organisator zelf
deelt. Organisatoren die dat niet willen, zetten `enrollment_visibility` op
`besloten`. Dit is een bewuste, door de gebruiker genomen productbeslissing,
geen technisch toeval — zie ook de bijgestelde "buiten scope"-sectie in
`docs/product-requirements.md`.
