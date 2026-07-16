-- Participants (module D) and secure onboarding access (module E).

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  full_name text not null check (char_length(btrim(full_name)) > 0),
  email citext,
  phone text,
  booking_status booking_status not null default 'optie',
  payment_status payment_status not null default 'niet_betaald',
  onboarding_status text not null default 'niet_gestart'
    check (onboarding_status in ('niet_gestart', 'gestart', 'voltooid')),
  invitation_status text not null default 'niet_verzonden'
    check (invitation_status in ('niet_verzonden', 'verzonden', 'geopend', 'voltooid', 'verlopen', 'ingetrokken')),
  source text,
  referral_code_used text,
  internal_notes text,
  is_alumnus boolean not null default false,
  anonymized_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index participants_retreat_email_unique_idx
  on public.participants (retreat_id, email)
  where email is not null and anonymized_at is null;

create index participants_organization_id_idx on public.participants (organization_id);
create index participants_retreat_id_idx on public.participants (retreat_id);
create index participants_booking_status_idx on public.participants (retreat_id, booking_status);

comment on table public.participants is 'Deelnemers aan een specifiek retreat. Kern van module D.';

alter table public.leads
  add constraint leads_converted_participant_id_fkey
  foreign key (converted_participant_id) references public.participants (id) on delete set null;

create index leads_converted_participant_id_idx on public.leads (converted_participant_id);

-- Append-only consent log: the latest row per (participant_id, consent_type) is the
-- current state. Never update or delete a row; write a new one to change consent.
create table public.participant_consents (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  consent_type consent_type not null,
  granted boolean not null,
  source text not null,
  policy_version text not null,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index participant_consents_participant_idx
  on public.participant_consents (participant_id, consent_type, created_at desc);

comment on table public.participant_consents is 'Append-only toestemmingenlog. Huidige status = meest recente rij per (participant_id, consent_type).';

create view public.participant_current_consents as
  select distinct on (participant_id, consent_type)
    participant_id,
    organization_id,
    consent_type,
    granted,
    source,
    policy_version,
    granted_at,
    revoked_at,
    created_at
  from public.participant_consents
  order by participant_id, consent_type, created_at desc;

comment on view public.participant_current_consents is 'Leest het meest recente toestemmingsniveau per deelnemer en toestemmingstype.';

create table public.participant_invites (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'actief' check (status in ('actief', 'gebruikt', 'verlopen', 'ingetrokken')),
  expires_at timestamptz not null,
  issued_by uuid references public.profiles (id) on delete set null,
  issued_at timestamptz not null default now(),
  used_at timestamptz,
  revoked_at timestamptz,
  request_count integer not null default 0,
  last_request_at timestamptz,
  created_at timestamptz not null default now()
);

create index participant_invites_participant_idx on public.participant_invites (participant_id);

comment on table public.participant_invites is 'Veilige onboardinglinks. token_hash is een sha-256 hash van het token; het plaintext token wordt nooit opgeslagen.';
