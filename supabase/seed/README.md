# Seeddata

`npm run db:seed` (zie `docs/pilot-setup.md` voor de volledige setup) vult drie
organisaties met fictieve, realistische pilotdata:

1. **Stille Kracht Retreats** — Mallorca-specialist, 2 retreats per jaar, ~30
   deelnemers, ~€2.400 per persoon. Bevat een lopend voorjaarsretreat (leads,
   deelnemers met bewust wisselende onboarding-/betaal-/boekingsstatus, dieet-
   en reisgegevens, een kamer met toewijzingen), een concept-najaarsretreat, en
   een afgerond retreat van 2025 dat de bron is voor een alumnus + referral.
2. **Bosrand Retreats** — kleinschalige organisator met meerdere retreats van
   5-10 deelnemers, een coordinator die aan één specifiek retreat is
   toegewezen (voor het testen van coordinator-scoping), en een lead.
3. **Tenantisolatie Testorganisatie** — minimale dataset, uitsluitend bedoeld
   om te bewijzen dat organisatie A geen enkele rij van deze organisatie kan
   zien of wijzigen.

Alle seedgebruikers krijgen wachtwoord `JourneyOS-Pilot-2026!` (zie
`supabase/seed/run.ts`). Log bijvoorbeeld in als `elena@stillekracht.nl`.

Het script gebruikt de service-role key en omzeilt daarmee RLS -- draai dit
**nooit** tegen een productieproject.
