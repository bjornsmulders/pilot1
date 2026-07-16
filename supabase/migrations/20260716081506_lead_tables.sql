-- Leads and waitlist (module C). converted_participant_id is added as a foreign key
-- in the participant_tables migration to avoid a forward reference.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  retreat_id uuid references public.retreats (id) on delete set null,
  name text not null check (char_length(btrim(name)) > 0),
  email citext,
  phone text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  desired_period text,
  destination text,
  budget_range text,
  party_size integer check (party_size is null or party_size > 0),
  whatsapp_consent boolean not null default false,
  marketing_consent boolean not null default false,
  status lead_status not null default 'nieuw',
  follow_up_date date,
  notes text,
  score integer not null default 0,
  is_waitlisted boolean not null default false,
  converted_participant_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_organization_id_idx on public.leads (organization_id);
create index leads_retreat_id_idx on public.leads (retreat_id);
create index leads_status_idx on public.leads (organization_id, status);
create index leads_follow_up_idx on public.leads (organization_id, follow_up_date);

comment on table public.leads is 'Interesses en wachtlijst. Leadscore is uitsluitend gebaseerd op expliciete acties (lead_activities), nooit op privéberichten.';

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  activity_type text not null,
  description text,
  score_delta integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index lead_activities_lead_id_idx on public.lead_activities (lead_id, created_at desc);
create index lead_activities_organization_id_idx on public.lead_activities (organization_id);

comment on table public.lead_activities is 'Transparant activiteitenlog per lead; som van score_delta = leadscore.';
