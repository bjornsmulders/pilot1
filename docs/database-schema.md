# Datamodel

Volledige schema staat als SQL-migraties in `supabase/migrations/`. Dit document is
de leesbare index. Alle tabellen die geen tenant zelf zijn, hebben een
`organization_id`-kolom die naar `organizations.id` verwijst; alle schrijftoegang
wordt zowel server-side (`src/lib/auth/`) als via RLS (`docs/security.md`) op die
kolom afgedwongen.

Conventies: UUID-primary keys (`gen_random_uuid()`), `timestamptz` in UTC,
`citext` voor e-mailvelden, Postgres-enums voor gesloten statusverzamelingen,
`created_at`/`updated_at` op alle muteerbare tabellen, `updated_at` bijgewerkt via
een generieke trigger (`set_updated_at`).

## Enums (`20260716081459_extensions_and_enums.sql`)

| Enum | Waarden |
| --- | --- |
| `organization_role` | owner, admin, coordinator, viewer |
| `invitation_status` | pending, accepted, revoked, expired |
| `retreat_status` | concept, inschrijving_open, bijna_vol, vol, afgerond, geannuleerd |
| `lead_status` | nieuw, geinteresseerd, warm, gesprek_gepland, geboekt, verloren |
| `booking_status` | optie, gereserveerd, bevestigd, geannuleerd, aanwezig, no_show |
| `payment_status` | niet_betaald, gedeeltelijk_betaald, betaald, mislukt, terugbetaald, geannuleerd |
| `consent_type` | verwerking_uitvoering, zichtbaar_voor_deelnemers, alumni_activiteiten, marketing_organisator, marketing_journeyos, laatste_kans_aanbiedingen |

## Tabellen per domein

### Kern (`core_tables.sql`)
- **organizations** — één rij per tenant. `created_by`, `settings jsonb`, `status`.
- **profiles** — 1:1 spiegel van `auth.users`, automatisch aangemaakt via de
  `on_auth_user_created`-trigger.
- **organization_members** — koppelt profiel + organisatie + `organization_role`.
  Uniek per (organization_id, profile_id). Een trigger (`prevent_last_owner_removal`)
  voorkomt dat de laatste actieve owner verwijderd of gedegradeerd wordt.
- **invitations** — teamuitnodigingen; `token_hash` (sha-256), nooit plaintext.
  Eén actieve pending-uitnodiging per (org, e-mail).
- **audit_logs** — append-only; nooit update/delete vanuit de applicatie.

### Retreats (`retreat_tables.sql`)
- **retreats** — titel, omschrijving, locatie, land, data, capaciteit, prijs (EUR),
  status, in-/uitschrijving openbaar of besloten, boekingsdeadline, interne notities.
  Checks: einddatum ≥ startdatum, deadline ≤ startdatum, capaciteit/prijs ≥ 0.
- **retreat_team_members** — wijst coordinators toe aan specifieke retreats; bepaalt
  hun RLS-scope.

### Leads (`lead_tables.sql`, uitgebreid in `public_retreat_pages_and_consent_type.sql`)
- **leads** — naam, contact, gewenst retreat, UTM, bestemming, budget, toestemmingen
  (`whatsapp_consent`, `marketing_consent`, `platform_matching_consent`), status,
  score, `is_waitlisted`.
- **lead_activities** — append-only activiteitenlog; som van `score_delta` = leadscore.
  Score is uitsluitend gebaseerd op expliciete acties, nooit op privéberichten.
- **Openbare retreatpagina + interesseformulier**: `retreats.public_slug` +
  een permissieve `retreats_public_select`-RLS-policy voor `anon`/`authenticated`
  maken `/retreat/[publicSlug]` mogelijk. De enige weg voor een anonieme bezoeker
  om een lead aan te maken is de `SECURITY DEFINER`-functie
  `submit_public_lead(...)`, die zelf herverifieert dat het retreat openbaar en
  actief is.

### Platformbrede "laatste kans"-matching (`platform_matching.sql`)
Zie ADR-0007 in `docs/decisions.md`. Geen automatische cross-tenant datadeling —
alleen een JourneyOS-platformbeheerder (`profiles.is_platform_admin`) kan
handmatig, één voor één, een lead met `platform_matching_consent = true`
introduceren bij een onderbezet retreat van een ándere organisatie.
- **profiles.is_platform_admin** — boolean, standaard `false`. Alleen handmatig in
  de database te zetten; geen UI om jezelf platformbeheerder te maken.
- **leads.platform_matching_consent** — expliciete, aparte opt-in (los van
  `marketing_consent`, dat per-organisator geldt).
- **platform_lead_matches** — audittrail van introducties;
  `unique(source_lead_id, target_retreat_id)` voorkomt dubbele introducties.
- RPC's `list_platform_matching_candidates()` / `list_platform_matching_retreats()`
  geven een bewust smalle projectie terug (incl. organisatienaam, geen interne
  velden); `introduce_lead_to_retreat(source_lead_id, target_retreat_id)` maakt een
  gewone, op zichzelf staande lead aan bij de doelorganisatie — zonder de
  whatsapp/marketing-toestemmingen van de bronlead over te nemen, want die golden
  alleen voor de bronorganisatie. Alle drie zijn alleen functioneel voor
  `is_platform_admin() = true`; organisatoren krijgen nooit rechtstreekse
  querytoegang tot leads/deelnemers van een andere organisatie.
- `platform_overview_stats()` — platformbreed dashboard voor de super user
  (`/platform`): alleen aggregaten/tellingen (aantal organisaties, retreats,
  leads, deelnemers, matching-kandidaten, gedane introducties), nooit
  individuele rijen. Geeft nul rijen terug als de aanroeper geen
  `is_platform_admin` is.

### Deelnemers en onboarding (`participant_tables.sql`, `onboarding_tables.sql`)
- **participants** — boekings-/betaal-/onboarding-/uitnodigingsstatus, koppeling naar
  `retreats` en optioneel `leads` (conversie).
- **participant_consents** — append-only toestemmingenlog per `consent_type`; huidige
  status = laatste rij (zie view `participant_current_consents`).
- **participant_invites** — veilige onboardinglinks; `token_hash`, `expires_at`,
  `request_count`/`last_request_at` voor rate limiting.
- **onboarding_forms / onboarding_questions / onboarding_answers** — configureerbare
  extra vragen per retreat, bovenop de vaste, sterk getypeerde velden in
  `travel_plans`/`dietary_requirements`/`room_assignments`.

### Logistiek (`logistics_tables.sql`)
- **travel_plans** — vervoerstype, vertrekplaats, luchthaven, vlucht, aankomst/vertrek,
  carpool aangeboden/gezocht.
- **carpools / carpool_members** — aanbod + meerijders.
- **room_types / rooms / room_assignments** — kamertypes, kamers, één actieve
  toewijzing per deelnemer.
- **dietary_requirements** — dieet, allergieën, overige notities. Bewust geen
  medisch-dossierveld — zie `docs/privacy.md`.

### Programma en bestanden (`schedule_and_files_tables.sql`)
- **schedule_items** — programmaonderdelen met tijd/locatie/volgorde.
- **announcements** — mededelingen, optioneel zichtbaar voor deelnemers.
- **files** — metadata voor Supabase Storage-objecten; `visibility` team/participants.

### Alumni en referrals (`alumni_referral_tables.sql`)
- **alumni_memberships** — regio, interesses, `became_alumnus_at`,
  `reactivated_at` (herhaalboeking-signaal).
- **referral_codes** — één unieke code per deelnemer/ambassadeur.
- **referrals** — `unique(referred_lead_id)` en `unique(referred_participant_id)`
  voorkomen dubbele attributie van dezelfde verwijzing.

### Betalingen en berichten (`payment_and_messaging_tables.sql`)
- **payments** — type, bedrag, `payment_status`, Mollie-koppeling, `idempotency_key`.
- **payment_events** — ruwe webhookevents; alleen geschreven door de
  webhookhandler (service-role, server-only).
- **message_templates** — WhatsApp/e-mailtemplates per organisatie.
- **message_deliveries** — handmatig geregistreerde verzendstatus;
  `rendered_preview` is een ingekorte preview (max 500 tekens), nooit de volledige
  privéberichtinhoud.

## Belangrijke ontwerpbeslissing: geen `participant`-rol in `organization_members`

Zie `docs/decisions.md` ADR-0002. Deelnemers krijgen nooit een staflidmaatschap;
hun toegang loopt via het gehashte token in `participant_invites`. De RLS-laag voor
die self-service toegang wordt in de onboarding-slice (Module E) toegevoegd, met een
eigen, smalle policy per tabel die alleen "eigen rij, geldig token" toestaat.
