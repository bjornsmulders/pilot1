-- Retreats and per-retreat team assignment (used for coordinator scoping).

create table public.retreats (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null check (char_length(btrim(title)) > 0),
  description text,
  location text,
  country text,
  start_date date not null,
  end_date date not null,
  capacity integer not null check (capacity >= 0),
  price_per_person numeric(10, 2) not null check (price_per_person >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  status retreat_status not null default 'concept',
  enrollment_visibility text not null default 'besloten'
    check (enrollment_visibility in ('openbaar', 'besloten')),
  booking_deadline date,
  cover_image_url text,
  internal_notes text,
  public_slug text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint retreats_end_after_start check (end_date >= start_date),
  constraint retreats_deadline_before_start check (booking_deadline is null or booking_deadline <= start_date)
);

create index retreats_organization_id_idx on public.retreats (organization_id);
create index retreats_status_idx on public.retreats (organization_id, status);
create index retreats_start_date_idx on public.retreats (organization_id, start_date);

comment on table public.retreats is 'Eén retreat/reis van een organisator. Kern van module B.';

create table public.retreat_team_members (
  id uuid primary key default gen_random_uuid(),
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'coordinator' check (role in ('coordinator')),
  created_at timestamptz not null default now(),
  unique (retreat_id, profile_id)
);

create index retreat_team_members_profile_id_idx on public.retreat_team_members (profile_id);
create index retreat_team_members_retreat_id_idx on public.retreat_team_members (retreat_id);

comment on table public.retreat_team_members is 'Wijst coordinators toe aan specifieke retreats; bepaalt hun zichtbaarheidsscope in RLS.';
