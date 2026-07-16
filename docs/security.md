# Beveiliging

## Uitgangspunt

Nooit vertrouwen op alleen de frontend. Elke actie wordt op twee onafhankelijke
lagen geautoriseerd:

1. **Server-side autorisatie** (`src/lib/auth/session.ts`, `src/lib/auth/permissions.ts`) —
   elke Server Action en elke server-side data-ophaling roept eerst
   `getCurrentMembership(organizationId)` aan en toetst de rol met `requireRole(...)`
   vóór er een Supabase-call plaatsvindt.
2. **Row Level Security in Postgres** — deny-by-default op elke tabel; zie
   `supabase/migrations/20260716081524_rls_policies.sql`. Dit is de ondergrens die
   blijft gelden zelfs als laag 1 een fout bevat.

De Supabase **service-role key** komt nooit in clientcode terecht. Hij leeft
uitsluitend in `src/lib/supabase/admin.ts` (`import 'server-only'` bovenaan) en wordt
alleen gebruikt op de paar plekken waar dat functioneel noodzakelijk is (bv. de
Mollie-webhookhandler in een latere slice, die geen gebruikerssessie heeft om op te
autoriseren). Elk gebruik van de service-role client wordt in code becommentarieerd
met de reden.

## Permissions matrix

Legenda: ✅ volledig, 🟡 alleen toegewezen/eigen, ❌ geen toegang, 👁 alleen lezen.

| Module / actie | Owner | Admin | Coordinator | Viewer |
| --- | --- | --- | --- | --- |
| Organisatie­instellingen wijzigen | ✅ | ❌ | ❌ | ❌ |
| Teamleden uitnodigen/rollen wijzigen | ✅ | ❌ | ❌ | ❌ |
| Retreat aanmaken | ✅ | ✅ | ❌ | ❌ |
| Retreat wijzigen | ✅ | ✅ | 🟡 (toegewezen) | ❌ |
| Retreat archiveren/dupliceren | ✅ | ✅ | ❌ | ❌ |
| Retreats bekijken | ✅ (alle) | ✅ (alle) | 🟡 (toegewezen) | 👁 (alle) |
| Leads/wachtlijst beheren | ✅ | ✅ | 🟡 (eigen retreat) | 👁 |
| Deelnemers beheren | ✅ | ✅ | 🟡 (toegewezen retreat) | 👁 |
| Onboardinglink versturen/intrekken | ✅ | ✅ | 🟡 (toegewezen retreat) | ❌ |
| Praktische info (reis/kamer/dieet/programma) | ✅ | ✅ | 🟡 (toegewezen retreat) | 👁 |
| WhatsApp-templates beheren | ✅ | ✅ | ❌ | ❌ |
| WhatsApp-berichten voorbereiden/versturen | ✅ | ✅ | ✅ (eigen deelnemers) | ❌ |
| Alumni/referrals beheren | ✅ | ✅ | ❌ | 👁 |
| Betalingen registreren/markeren | ✅ | ✅ | ❌ | 👁 |
| Financiële rapportages | ✅ | ✅ | ❌ | 👁 |
| Auditlog inzien | ✅ | ✅ | ❌ | ❌ |

**Participant** staat niet in deze matrix als organisatierol: deelnemers loggen niet
in als staflid. Zij krijgen via een beveiligde onboardingtoken uitsluitend toegang
tot hun eigen onboarding en tot expliciet gedeelde retreatinformatie — nooit tot
privégegevens van andere deelnemers zonder toestemming. Zie ADR-0002 in
`docs/decisions.md`.

Deze matrix is 1-op-1 geïmplementeerd in zowel `src/lib/auth/permissions.ts`
(server-side) als de RLS-policies (database) — bij wijzigingen altijd beide
aanpassen en de tests in `src/lib/auth/permissions.test.ts` bijwerken.

## Platformbeheer (super user), los van de organisatierollen

`profiles.is_platform_admin` is geen organisatierol en staat niet in de matrix
hierboven — het is een platformbreed vlag voor JourneyOS zelf (de exploitant),
alleen handmatig in de database te zetten. Het geeft toegang tot `/platform`
(aggregaat-dashboard: aantallen organisaties/retreats/leads, geen individuele
rijen) en `/platform/laatste-kans` (de platformbrede "laatste kans"-matching, zie
ADR-0007 in `docs/decisions.md`). Ook hier geldt de twee-lagen-regel: de
server-side check (`requirePlatformAdmin()` in `src/lib/auth/session.ts`) én de
`is_platform_admin()`-Postgresfunctie binnen elke betrokken `SECURITY DEFINER`-RPC
controleren onafhankelijk van elkaar. Organisatoren (zelfs Owner) krijgen nooit
toegang tot deze routes of tot leads/deelnemers van een andere organisatie —
een introductie via de matching-module verloopt altijd via een nieuwe, op
zichzelf staande lead-rij in de doelorganisatie, nooit via gedeelde toegang tot
de bronrij.

## Secrets en tokens

- Wachtwoorden: volledig beheerd door Supabase Auth (nooit zelf gehasht/opgeslagen).
- Uitnodigings- en onboardingtokens: alleen een sha-256 **hash** wordt opgeslagen
  (`invitations.token_hash`, `participant_invites.token_hash`). Het plaintext token
  zit alleen in de e-mail/WhatsApp-link, nooit in de database of in logs.
- Tokens hebben een vervaldatum, kunnen worden ingetrokken, opnieuw uitgegeven, en
  hebben rate limiting (`request_count`/`last_request_at` op `participant_invites`).
- Nooit loggen: wachtwoorden, volledige tokens, gevoelige onboardingantwoorden,
  volledige privéberichten, geheime sleutels. Zie ook `docs/privacy.md`.

## Tenantisolatie

Organisatie A kan nooit gegevens van organisatie B lezen, wijzigen of verwijderen.
Dit wordt getest in `src/lib/auth/__tests__/tenant-isolation.test.ts` (DAL-niveau,
gemockt) en moet — zodra er een Supabase-testproject gekoppeld is — aanvullend
getest worden met een Playwright-scenario dat twee echte accounts in twee
organisaties gebruikt (zie `e2e/tenant-isolation.spec.ts` en
`docs/pilot-setup.md`).
