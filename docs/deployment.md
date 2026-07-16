# Deployment (Vercel)

## Voorbereiding

1. Supabase-project draait en gemigreerd (`docs/pilot-setup.md`).
2. Resend-domein geverifieerd (SPF/DKIM) voor het afzenderadres.
3. Mollie live API-key (pas nodig vanaf de betalingen-slice).
4. Sentry-project + DSN aangemaakt.
5. PostHog-project + project API key aangemaakt (EU-cloud voor AVG).

## Vercel-project

```bash
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... herhaal voor alle variabelen in .env.example, environment production + preview
npx vercel --prod
```

Herhaal de env-vars voor de `preview`-environment met een **apart** (staging)
Supabase-project — nooit hetzelfde project als productie voor preview-deploys, om te
voorkomen dat testdata in productie belandt of andersom.

## Build-instellingen

- Framework preset: Next.js (automatisch gedetecteerd).
- Build command: `next build` (standaard; Turbopack is in Next.js 16 de default).
- Node.js-versie: 20.9+ (minimum voor Next.js 16 — zie `docs/architecture.md`).

## Cron / achtergrondtaken

Nog niet van toepassing in slice 1. Zodra reminders (module F) of
token-expiratieopruiming nodig zijn: Vercel Cron Jobs via `vercel.json`, aanroepend
naar een Route Handler die met de service-role client werkt.

## Domeinen en cookies

Supabase Auth-cookies zijn `HttpOnly`/`Secure`/`SameSite=Lax` (standaardgedrag van
`@supabase/ssr`). Zorg dat het productiedomein in de Supabase Auth-instellingen
("Site URL" en "Redirect URLs") staat, anders werken e-mailbevestiging en
wachtwoord-reset-links niet.

## Rollback

Vercel bewaart eerdere deployments; een rollback naar een vorige deployment raakt de
database niet. Database-migraties zijn **niet** automatisch omkeerbaar — schrijf bij
schema-wijzigingen waar mogelijk backwards-compatible migraties (nieuwe kolom
nullable toevoegen i.p.v. direct een NOT NULL-kolom op een gevulde tabel).
