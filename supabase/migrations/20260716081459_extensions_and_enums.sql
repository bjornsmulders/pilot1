-- JourneyOS database schema
-- Extensions and shared enum types used across the domain model.
-- All timestamps are stored in UTC (timestamptz); the UI converts to Europe/Amsterdam.

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists citext;     -- case-insensitive email columns

-- Staff roles within an organization (see docs/security.md for the permissions matrix).
-- "participant" is intentionally NOT part of this enum: participants never receive an
-- organization_members row. They are granted narrow, row-level access through a signed
-- onboarding token (see participant_invites / docs/decisions.md ADR-0002).
create type organization_role as enum ('owner', 'admin', 'coordinator', 'viewer');

create type invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create type retreat_status as enum (
  'concept',
  'inschrijving_open',
  'bijna_vol',
  'vol',
  'afgerond',
  'geannuleerd'
);

create type lead_status as enum (
  'nieuw',
  'geinteresseerd',
  'warm',
  'gesprek_gepland',
  'geboekt',
  'verloren'
);

create type booking_status as enum (
  'optie',
  'gereserveerd',
  'bevestigd',
  'geannuleerd',
  'aanwezig',
  'no_show'
);

create type payment_status as enum (
  'niet_betaald',
  'gedeeltelijk_betaald',
  'betaald',
  'mislukt',
  'terugbetaald',
  'geannuleerd'
);

create type consent_type as enum (
  'verwerking_uitvoering',
  'zichtbaar_voor_deelnemers',
  'alumni_activiteiten',
  'marketing_organisator',
  'marketing_journeyos'
);
