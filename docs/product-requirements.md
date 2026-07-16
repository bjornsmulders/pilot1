# Productvereisten — JourneyOS pilot

## Belofte

> Vul je retreat sneller, organiseer hem zonder WhatsApp- en Excel-chaos en gebruik
> iedere retreat om de volgende makkelijker te verkopen.

JourneyOS **vervangt WhatsApp niet**. WhatsApp blijft het kanaal voor snelle,
informele communicatie. JourneyOS beheert de duurzame structuur eromheen: leads,
wachtlijsten, boekingen, deelnemers, onboarding, reisgegevens, carpool, dieetwensen,
kamerindeling, programma, reminders, alumni, referrals en volgende retreats.

## Pilotdoelgroep

- **Organisator A** — ~2 retreats/jaar, ~30 deelnemers, buitenland (bv. Mallorca),
  hoge prijs per deelnemer, mogelijk gastspreker. Kernprobleem: retreat vullen en
  eerdere deelnemers reactiveren.
- **Organisator B** — ~30 retreats/jaar, 5–10 deelnemers, veel terugkerend
  operationeel werk. Kernprobleem: administratie, onboarding, WhatsApp-opvolging.

Het systeem ondersteunt beide profielen met dezelfde datamodellen; het verschil zit
in gebruiksintensiteit, niet in aparte code-paden.

## Harde pilotdoelen (definition of done voor de pilot als geheel)

1. Account + organisatie aanmaken.
2. Meerdere retreats beheren.
3. Leads en wachtlijst bijhouden.
4. Deelnemers handmatig of via CSV toevoegen.
5. Veilige onboardinglink via e-mail of WhatsApp versturen.
6. Reis-, dieet-, kamer- en praktische gegevens verzamelen.
7. Direct zien welke gegevens ontbreken.
8. WhatsApp-berichten genereren en openen zonder onofficiële automatisering.
9. Deelnemers na afloop als alumni beheren.
10. Alumni uitnodigen voor een volgend retreat.
11. Referrals en herhaalboekingen registreren.
12. Bezetting en omzet uit alumni/referrals zien.

## Buiten scope (pilot)

Publieke internationale marktplaats, native app, interne chat, automatische analyse
of scraping van WhatsApp, onofficiële WhatsApp-automatisering, complexe
AI-aanbevelingen, vliegticketboekingen, boekhoudintegraties, communityfeeds,
medische dossiers, complexe deelnemersabonnementen, multi-currency, meertaligheid,
automatische groepscreatie zonder officiële WhatsApp-toegang.

## Kernmodules

| Module | Naam | Status in dit repo |
| --- | --- | --- |
| A | Authenticatie en organisaties | Slice 1 — gebouwd |
| B | Retreatbeheer | Slice 1 — basis gebouwd (aanmaken, overzicht); dupliceren/archiveren volgt |
| C | Leads en wachtlijst | Datamodel + RLS klaar; UI volgende slice |
| D | Deelnemers | Datamodel + RLS klaar; UI volgende slice |
| E | Veilige onboarding | Datamodel + RLS klaar; UI volgende slice |
| F | Praktische retreatmanager | Datamodel + RLS klaar; UI latere slice |
| G | WhatsApp-versterking | Datamodel + `MessageProvider`-interface klaar; UI latere slice |
| H | Alumni | Datamodel + RLS klaar; UI latere slice |
| I | Referrals | Datamodel + RLS klaar; UI latere slice |
| J | Betalingen (Mollie) | Datamodel + RLS klaar; integratie latere slice |
| K | Dashboards | Basis orgdashboard (stub); volledige rapportages latere slice |

Zie `docs/decisions.md` voor de volgorde-redenering en `README.md` voor de
actuele voortgang per slice.

## Rollen (samenvatting — volledige matrix in `docs/security.md`)

Owner, Admin, Coordinator, Viewer zijn staffrollen met een `organization_members`-rij.
Participant is **geen** staffrol: deelnemers loggen niet in met een account, maar
gebruiken een beveiligde, vervalbare onboardinglink (module E).
