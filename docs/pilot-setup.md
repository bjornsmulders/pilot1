# Pilot-setup

Stappen om JourneyOS lokaal of voor een pilotorganisator draaiend te krijgen.

## 1. Supabase-project aanmaken

1. Maak op https://supabase.com een nieuw project (regio: EU, bv. Frankfurt, i.v.m.
   AVG/latency voor Nederlandse gebruikers).
2. Noteer: **Project URL**, **anon public key**, **service_role key** (Project
   Settings → API).
3. Installeer de Supabase CLI (al aanwezig als dev-dependency via `npx supabase`) en
   koppel het project:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```

## 2. Migraties uitvoeren

```bash
npx supabase db push
```

Dit voert alle bestanden in `supabase/migrations/` in volgorde uit: enums en
extensies, alle 29 tabellen, triggers, RLS-helperfuncties en RLS-policies. Controleer
in de Supabase-dashboard (Table Editor) dat elke tabel "RLS enabled" toont.

## 3. Omgevingsvariabelen

Kopieer `.env.example` naar `.env.local` en vul in (zie dat bestand voor de
volledige lijst en uitleg per variabele). Minimaal nodig om lokaal te starten:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 4. Seed-data

```bash
npm run db:seed
```

Vult drie pilot-organisaties met fictieve data (zie `supabase/seed/README.md` voor
de exacte inhoud): een Mallorca-organisator (2×/jaar, ~30 deelnemers), een
kleinschalige organisator (meerdere retreats van 5–10 deelnemers), en een
tenantisolatie-testorganisatie. Het seedscript gebruikt de service-role key en mag
nooit tegen een productieproject draaien.

## 5. App starten

```bash
npm install
npm run dev
```

App draait op http://localhost:3000. Registreer een account, bevestig het e-mailadres
(Supabase stuurt in development-projecten een bevestigingsmail via de ingebouwde
Supabase-mailer, tenzij Resend als custom SMTP is gekoppeld — zie hieronder), en
doorloop de "organisatie aanmaken"-flow.

## 6. Resend (transactionele e-mail)

Voor productie: koppel Resend als custom SMTP-provider in Supabase (Auth → SMTP
Settings) zodat bevestigingsmails, wachtwoord-reset en teamuitnodigingen via Resend
lopen in plaats van de rate-gelimiteerde Supabase-standaardmailer. Vul
`RESEND_API_KEY` en `RESEND_FROM_EMAIL` in `.env.local` voor de e-mails die de
applicatie zelf verstuurt (bv. onboardinglinks).

## 7. Mollie, PostHog, Sentry

Zie `.env.example`. Deze zijn nodig vanaf de betalingen- resp.
observability-slice; voor slice 1 (auth/org/retreats) niet vereist om te kunnen
testen, maar wel al bekabeld in de configuratiebestanden zodat een latere slice er
alleen nog gebruik van hoeft te maken.

## 8. Tests

```bash
npm run test          # Vitest — unit/integratie, draait zonder live Supabase-project
npm run test:e2e       # Playwright — vereist een draaiende app + gekoppeld Supabase-project
```

De Playwright-specs in `e2e/` zijn geschreven maar konden in de originele
bouwomgeving niet worden uitgevoerd (geen Docker/Supabase-project beschikbaar — zie
ADR-0006 in `docs/decisions.md`). Draai ze zodra stap 1–5 hierboven zijn doorlopen:

```bash
npx playwright install --with-deps chromium   # eenmalig
npm run dev &                                  # app moet draaien
npm run test:e2e
```

## 9. Handmatige controle na setup

- Registreer twee accounts, maak twee organisaties aan, controleer dat gebruiker A
  organisatie B nergens ziet (retreatoverzicht, instellingen).
- Nodig een teamlid uit met rol Coordinator, wijs één retreat toe, controleer dat
  die gebruiker alleen dat retreat ziet.
- Maak een retreat aan met een ongeldige einddatum (< startdatum) en controleer dat
  dit geweigerd wordt, zowel in de UI als (optioneel) direct via de API.
