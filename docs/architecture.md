# Architectuur

## Stack

- **Next.js 16** (App Router, Turbopack, React 19.2), TypeScript strict mode.
- **Tailwind CSS v4** (CSS-first config via `@theme` in `src/app/globals.css`).
- Handgebouwde **shadcn/ui-stijl componentenkit** (`src/components/ui/`) bovenop
  Radix UI-primitieven — zie "shadcn/ui-kanttekening" hieronder.
- **Supabase**: Postgres, Auth, Storage, Row Level Security.
- **Zod** voor validatie, **React Hook Form** voor formulieren.
- **Resend** (transactionele e-mail), **Mollie** (betalingen — latere slice),
  **PostHog** (product analytics), **Sentry** (foutmonitoring).
- **Vitest** (unit/integratie), **Playwright** (end-to-end).
- Deployment: Vercel.

### ⚠️ Next.js 16 — dit is niet de Next.js uit trainingsdata

Deze repo draait op Next.js 16.2.10, met een aantal harde breaking changes t.o.v.
oudere versies:

- **`middleware.ts` bestaat niet meer** — heet nu **`proxy.ts`** met een
  geëxporteerde functie `proxy` (niet `middleware`). Alleen Node-runtime, geen Edge.
- `next lint` is verwijderd; lint draait via de ESLint CLI (`npm run lint` roept
  `eslint` rechtstreeks aan).
- `cookies()`, `headers()`, `params`, `searchParams` zijn **altijd async** — geen
  synchrone fallback meer.
- Turbopack is standaard aan voor `next dev` én `next build`.

Zie `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` voor de
volledige lijst. Nieuwe code die met een oudere Next.js-mentale-model geschreven
wordt (bv. een `middleware.ts` toevoegen) breekt de build.

### shadcn/ui-kanttekening

De uitgaande proxy in de ontwikkelomgeving staat geen verkeer naar `ui.shadcn.com`
toe (alleen `registry.npmjs.org` en enkele andere registries zijn vrijgegeven),
waardoor `npx shadcn init`/`add` niet werkt. De benodigde componenten zijn daarom
met de hand geschreven in `src/components/ui/`, in dezelfde stijl en met dezelfde
Radix-primitieven als de officiële shadcn/ui-generator zou gebruiken. Functioneel
gelijkwaardig; alleen zonder de CLI-registry-call. Zodra de CLI wél bereikbaar is
kunnen deze bestanden 1-op-1 vervangen worden door `shadcn add <component>`.

## Mappenstructuur (`src/`)

```
app/
  (marketing)/            openbare landingspagina
  (auth)/                 inloggen, registreren, wachtwoord vergeten/resetten
  auth/callback/route.ts  Supabase e-mailbevestiging / auth-redirect
  (app)/                  geauthenticeerd gedeelte (sidebar-layout)
    onboarding/organisatie-aanmaken/
    dashboard/
    retreats/[...]/
    instellingen/organisatie/
actions/                  Server Actions (mutaties), per domein
lib/
  supabase/                server.ts, client.ts, admin.ts (service-role, server-only)
  auth/                    session.ts (DAL), permissions.ts (rolmatrix)
  validation/               Zod-schema's per domein
  format.ts                Europe/Amsterdam datum- en bedragformattering
components/
  ui/                      handgebouwde shadcn-stijl kit
  layout/, auth/, organizations/, retreats/
proxy.ts                   optimistische auth-redirects (Node-runtime)
```

## Autorisatie: twee onafhankelijke lagen

1. **Server-side autorisatie** — elke Server Action en elke data-ophaling loopt via
   een Data Access Layer (`src/lib/auth/session.ts`): `getCurrentMembership()` haalt
   de actieve rol van de ingelogde gebruiker in de relevante organisatie op,
   `requireRole()` gooit een fout als de rol onvoldoende is. Dit gebeurt vóórdat er
   ook maar íets naar Supabase gestuurd wordt.
2. **Row Level Security in Postgres** — elke tabel heeft RLS aan met expliciete
   policies (zie `docs/database-schema.md` en `docs/security.md`). Dit is de
   ondergrens: zelfs een bug in laag 1, of een query die per ongeluk buiten de DAL
   om gaat, kan nooit data van een andere organisatie lekken.

`proxy.ts` doet alleen **optimistische** redirects (ingelogd/niet-ingelogd) op basis
van de Supabase-sessiecookie — nooit database-calls, nooit de enige verdedigingslaag
(conform de Next.js-richtlijn in `node_modules/next/dist/docs/01-app/02-guides/authentication.md`).

De Supabase **service-role key** wordt uitsluitend gebruikt in `src/lib/supabase/admin.ts`,
gemarkeerd met `import 'server-only'`, en alleen aangeroepen vanuit geïsoleerde
server-only paden die dat expliciet nodig hebben (bv. de Mollie-webhookhandler in een
latere slice). Hij wordt nooit naar de client verzonden en nooit gebruikt om
gebruikersacties uit te voeren die ook via RLS + de gewone (anon/authenticated)
client kunnen.

## MessageProvider-architectuur (module G, WhatsApp-versterking)

```ts
interface MessageProvider {
  prepareMessage(input: PrepareMessageInput): Promise<PreparedMessage>
  recordDelivery(input: RecordDeliveryInput): Promise<MessageDelivery>
}
```

Implementaties: `MockMessageProvider` (tests/development), `EmailMessageProvider`
(Resend), `WhatsAppLinkProvider` (genereert `wa.me`-links + vooraf ingevulde tekst,
geen verzending). Dit maakt het mogelijk om later een `WhatsAppCloudApiProvider` toe
te voegen (officiële Meta Business API) zonder de kernlogica (templates, variabelen,
verzendstatus-registratie) te hoeven herschrijven. Zie `docs/whatsapp-strategy.md`.

## Tijdzones

Database: UTC (`timestamptz` overal). UI: alle datums/tijden worden bij het
renderen omgezet naar `Europe/Amsterdam` via `src/lib/format.ts`. Formulierinvoer
wordt bij het opslaan terug naar UTC geconverteerd.
