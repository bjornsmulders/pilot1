-- Programme, announcements and shared files (module F).

create table public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  sort_order integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index schedule_items_retreat_id_idx on public.schedule_items (retreat_id, sort_order);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  title text not null,
  body text not null,
  visible_to_participants boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index announcements_retreat_id_idx on public.announcements (retreat_id, created_at desc);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  retreat_id uuid references public.retreats (id) on delete set null,
  storage_path text not null,
  file_name text not null,
  content_type text,
  size_bytes bigint,
  visibility text not null default 'team' check (visibility in ('team', 'participants')),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index files_organization_id_idx on public.files (organization_id);
create index files_retreat_id_idx on public.files (retreat_id);

comment on table public.files is 'Metadata voor bestanden in Supabase Storage (praktische documenten).';
