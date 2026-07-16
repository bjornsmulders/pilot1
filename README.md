# JourneyOS

Nederlandstalig SaaS-platform voor retreatorganisatoren. JourneyOS vervangt
WhatsApp niet — het beheert de duurzame structuur eromheen: leads, wachtlijsten,
boekingen, deelnemers, onboarding, reisgegevens, carpool, dieetwensen,
kamerindeling, programma, alumni en referrals. Zie `docs/product-requirements.md`
voor de volledige productbrief.

## Status

Pilot in ontwikkeling. **Slice 1 is gebouwd**: authenticatie, organisatie aanmaken,
rollen, retreat aanmaken/overzicht, tenantisolatie, seeddata, tests. Zie
`docs/decisions.md` voor de belangrijkste architectuurkeuzes en
`docs/product-requirements.md` voor de status per module.

## Stack

Next.js 16 (App Router, TypeScript strict) · Tailwind CSS v4 · handgebouwde
shadcn/ui-stijl componenten · Supabase (Postgres, Auth, Storage, RLS) · Zod ·
React Hook Form · Resend · Mollie · PostHog · Sentry · Vitest · Playwright ·
Vercel. Zie `docs/architecture.md` voor details — **let op de kanttekening over
Next.js 16 breaking changes** (`middleware.ts` → `proxy.ts`) voordat je code
toevoegt.

## Snel starten

```bash
npm install
cp .env.example .env.local   # vul Supabase-gegevens in, zie docs/pilot-setup.md
npx supabase link --project-ref <project-ref>
npx supabase db push          # voert alle migraties in supabase/migrations/ uit
npm run db:seed               # vult 3 pilot-organisaties met testdata
npm run dev
```

Volledige stap-voor-stap-uitleg (Supabase-project aanmaken, Resend/Mollie/PostHog/
Sentry koppelen, tests draaien): **`docs/pilot-setup.md`**.

## Scripts

| Commando | Doel |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Productiebuild |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (unit/integratie, geen live database nodig) |
| `npm run test:e2e` | Playwright (vereist draaiende app + Supabase-project) |
| `npm run db:seed` | Seed-script voor 3 pilotorganisaties |

## Documentatie

| Bestand | Inhoud |
| --- | --- |
| `docs/product-requirements.md` | Productvisie, doelgroep, modules, scope |
| `docs/architecture.md` | Techstack, mappenstructuur, autorisatiemodel |
| `docs/database-schema.md` | Volledig datamodel (leesbare index bij de migraties) |
| `docs/security.md` | Permissions matrix, RLS-model, secrets-beleid |
| `docs/privacy.md` | AVG-aanpak, dataminimalisatie, rechten van deelnemers |
| `docs/whatsapp-strategy.md` | `MessageProvider`-architectuur, templates |
| `docs/pilot-setup.md` | Supabase/Resend/Mollie/PostHog/Sentry koppelen |
| `docs/deployment.md` | Vercel-deployment |
| `docs/decisions.md` | Architectuurbeslissingen (ADR-log) |

## Multi-tenant en beveiliging

Elke organisator is een eigen `organization`. Alle zakelijke data is gekoppeld via
`organization_id` en wordt op twee onafhankelijke lagen beveiligd: server-side
autorisatie (`src/lib/auth/`) én Postgres Row Level Security
(`supabase/migrations/20260716081524_rls_policies.sql`). Zie `docs/security.md`.
De Supabase service-role key wordt nooit in clientcode gebruikt.
