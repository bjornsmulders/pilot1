# Privacy en AVG

JourneyOS is privacy by design gebouwd. Dit document beschrijft de aanpak; de
implementatie in code volgt in de onboarding-slice (Module E) en de UI daarvoor komt
in `src/app/(app)/instellingen/` en een deelnemersgerichte privacypagina.

## Drie categorieën gegevens

1. **Noodzakelijke operationele gegevens** — contactgegevens, reisgegevens,
   dieetwensen/allergieën, kamervoorkeur, noodcontact. Nodig om het retreat te
   kunnen uitvoeren. Grondslag: uitvoering van de overeenkomst.
2. **Vrijwillige communitygegevens** — zichtbaar zijn voor andere deelnemers,
   interesses, alumni-profiel. Grondslag: uitdrukkelijke toestemming
   (`consent_type = zichtbaar_voor_deelnemers` / `alumni_activiteiten`).
3. **Commerciële toestemming** — marketing van de organisator zelf en marketing
   vanuit JourneyOS. **Staat standaard uit**, apart per categorie, nooit
   voorafgevinkt.

Deze scheiding staat letterlijk in het datamodel: `participant_consents` heeft een
losse rij per `consent_type`, dus een deelnemer kan bijvoorbeeld wél instemmen met
gegevensverwerking maar níet met marketing.

## Wat wordt opgeslagen (en wat niet)

- **Geen medische dossiers.** `dietary_requirements` vraagt alleen dieetwensen en
  allergieën die relevant zijn voor catering/veiligheid. De onboarding-UI toont
  expliciet: *"Vul hier geen medische details in die niet noodzakelijk zijn voor de
  organisatie van dit retreat."*
- **Geen volledige privéberichten.** `message_deliveries.rendered_preview` is een
  ingekorte preview (max. 500 tekens) van een gegenereerd bericht, uitsluitend om de
  organisator te laten zien wát er verstuurd zou worden — geen archief van
  WhatsApp-gesprekken.
- **Geen leadscoring op basis van privégesprekken.** `lead_activities` registreert
  alleen expliciete, systeemgegenereerde acties (formulier ingevuld, status
  gewijzigd, follow-up gepland) — nooit de inhoud van chats.
- **Tokens nooit in plaintext.** Zie `docs/security.md`.

## Rechten van de deelnemer

Een deelnemer kan via zijn onboardingportaal (Module E, komende slice) zien:

- welke gegevens over hem/haar zijn opgeslagen;
- het doel van de verwerking per categorie;
- met wie gegevens gedeeld zijn (bv. zichtbaar voor andere deelnemers);
- welke toestemmingen zijn gegeven, met datum en versie van de toestemmingstekst;
- een knop om een toestemming in te trekken (schrijft een nieuwe rij in
  `participant_consents` met `granted = false`, `revoked_at = now()` — de
  geschiedenis blijft auditeerbaar, niets wordt overschreven).

## Dataminimalisatie

Alleen velden die expliciet in de brief genoemd zijn worden gevraagd. Extra vragen
per retreat zijn mogelijk via `onboarding_questions`, maar dat is een bewuste
organisator-actie, geen systeemstandaard.

## Export, anonimiseren en verwijderen

- **Export**: een organisator kan de deelnemerslijst exporteren (CSV, module F).
  Een individuele deelnemer-export (AVG-inzageverzoek) is gepland voor de
  onboarding-slice: een server action die alle rijen over die deelnemer
  (participants, participant_consents, travel_plans, dietary_requirements,
  room_assignments, payments-status) bundelt tot JSON.
- **Anonimiseren**: `participants.anonymized_at` markeert een deelnemer als
  geanonimiseerd; een geplande server action vervangt naam/e-mail/telefoon door
  placeholders maar behoudt geaggregeerde, niet-herleidbare data (bv. voor
  bezettingscijfers).
- **Verwijderen**: harde verwijdering waar wettelijk mogelijk (bv. een lead die nooit
  deelnemer werd). Deelnemers met een afgeronde boeking/betaling worden
  standaard geanonimiseerd in plaats van hard verwijderd, omdat financiële
  bewaarplicht (fiscale bewaartermijn) dat vereist — dit wordt in de UI toegelicht
  op het moment van verwijderen.

## Retentiebeleid (voorstel, vast te stellen per organisatie in een latere slice)

| Gegevenstype | Bewaartermijn |
| --- | --- |
| Leads zonder boeking | 24 maanden na laatste activiteit, dan anonimiseren |
| Deelnemersgegevens (incl. dieet/reis) | Tot 12 maanden na het retreat, dan anonimiseren tenzij alumnus |
| Financiële gegevens (payments) | 7 jaar (fiscale bewaarplicht), geaggregeerd |
| Auditlogs | 24 maanden |
| Onboardingtokens | Verlopen na configureerbare termijn (standaard 30 dagen), daarna hard verwijderd |

## Auditlogging

Gevoelige wijzigingen (organisatie aangemaakt, rol gewijzigd, toestemming
ingetrokken, deelnemer verwijderd/geanonimiseerd, retreat geannuleerd) worden
weggeschreven naar `audit_logs` (append-only, alleen leesbaar voor Owner/Admin). Zie
`docs/security.md`.

## Copy-richtlijnen

- Geen medische claims of gezondheidsadvies in de interface.
- Geen commerciële profilering op basis van privégesprekken.
- Marketingtoestemmingen altijd expliciet, nooit voorafgevinkt, altijd met een
  duidelijke intrekmogelijkheid.
