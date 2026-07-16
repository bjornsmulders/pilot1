-- Core tables: organizations, profiles, organization_members, invitations, audit_logs.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  contact_email citext,
  contact_phone text,
  website text,
  address text,
  country text not null default 'Nederland',
  default_currency text not null default 'EUR' check (default_currency = 'EUR'),
  logo_url text,
  settings jsonb not null default '{}'::jsonb,
  status text not null default 'actief' check (status in ('actief', 'gedeactiveerd')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.organizations is 'Eén rij per retreatorganisator (tenant). Alle zakelijke data hangt hieraan via organization_id.';

-- profiles mirrors auth.users 1:1 and holds display data usable in RLS/UI without
-- ever exposing auth.users directly to the client.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  locale text not null default 'nl',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Publieke, applicatie-zijdige profielgegevens per Supabase Auth-gebruiker.';

alter table public.organizations
  add constraint organizations_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role organization_role not null default 'viewer',
  status text not null default 'actief' check (status in ('actief', 'gedeactiveerd')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create index organization_members_profile_id_idx on public.organization_members (profile_id);
create index organization_members_organization_id_idx on public.organization_members (organization_id);

comment on table public.organization_members is 'Koppelt een profiel aan een organisatie met een rol. De enige plek waar staftoegang wordt toegekend.';

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email citext not null,
  role organization_role not null default 'viewer',
  token_hash text not null unique,
  status invitation_status not null default 'pending',
  invited_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one active pending invite per (organization, email).
create unique index invitations_pending_unique_idx
  on public.invitations (organization_id, email)
  where status = 'pending';

create index invitations_organization_id_idx on public.invitations (organization_id);

comment on table public.invitations is 'Teamuitnodigingen. token_hash is een sha-256 hash; het plaintext token wordt nooit opgeslagen.';

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_organization_id_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

comment on table public.audit_logs is 'Append-only auditlog voor gevoelige wijzigingen. Nooit updaten of verwijderen vanuit de applicatie.';

-- Automatically create a profile row whenever a new Supabase Auth user is created.
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
