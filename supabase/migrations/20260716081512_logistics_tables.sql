-- Travel, carpool, rooms and dietary data (module F practical retreat manager).

create table public.travel_plans (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  transport_type text check (transport_type in ('vliegtuig', 'auto', 'trein', 'anders')),
  departure_location text,
  airport text,
  flight_number text,
  arrival_time timestamptz,
  departure_time timestamptz,
  carpool_offered boolean not null default false,
  carpool_requested boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id)
);

create index travel_plans_organization_id_idx on public.travel_plans (organization_id);

comment on table public.travel_plans is 'Reisgegevens per deelnemer; basis voor groeperen per luchthaven/aankomsttijd.';

create table public.carpools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  driver_participant_id uuid not null references public.participants (id) on delete cascade,
  departure_location text,
  seats_available integer not null default 0 check (seats_available >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index carpools_retreat_id_idx on public.carpools (retreat_id);

create table public.carpool_members (
  id uuid primary key default gen_random_uuid(),
  carpool_id uuid not null references public.carpools (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  status text not null default 'aangevraagd' check (status in ('aangevraagd', 'bevestigd', 'geannuleerd')),
  created_at timestamptz not null default now(),
  unique (carpool_id, participant_id)
);

create index carpool_members_carpool_id_idx on public.carpool_members (carpool_id);

comment on table public.carpools is 'Carpoolaanbod. carpool_members koppelt meerijders (carpoolvraag).';

create table public.room_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  name text not null,
  capacity integer not null check (capacity > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index room_types_retreat_id_idx on public.room_types (retreat_id);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_type_id uuid not null references public.room_types (id) on delete cascade,
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  capacity integer not null check (capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (retreat_id, name)
);

create index rooms_retreat_id_idx on public.rooms (retreat_id);

create table public.room_assignments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (participant_id)
);

create index room_assignments_room_id_idx on public.room_assignments (room_id);

comment on table public.room_assignments is 'Eén actieve kamertoewijzing per deelnemer.';

create table public.dietary_requirements (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  diet_type text,
  allergies text,
  other_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id)
);

comment on table public.dietary_requirements is 'Dieetwensen en allergieën. Geen medische dossiers: alleen wat nodig is voor catering/veiligheid.';
