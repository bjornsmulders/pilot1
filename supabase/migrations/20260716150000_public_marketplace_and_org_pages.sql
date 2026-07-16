-- Publieke marktplaats + organisatorpagina's (koerswijziging t.o.v. de
-- oorspronkelijke scope-uitsluiting "geen publieke marktplaats" -- expliciet
-- door de gebruiker gekozen, zie ADR-0008 in docs/decisions.md).
--
-- Geen nieuwe RLS-policy nodig voor de retreats-tabel zelf: de bestaande
-- `retreats_public_select`-policy (uit public_retreat_pages_and_consent_type.sql)
-- staat al toe dat anon/authenticated elk openbaar, actief retreat leest,
-- platformbreed, zonder organisatiefilter. Deze migratie voegt alleen twee
-- SECURITY DEFINER-functies toe die een bewust smalle, platte projectie teruggeven
-- inclusief de organisatienaam en het contactnummer -- zodat anonieme bezoekers
-- dat niet via een losse (bredere) leestoegang tot `organizations` hoeven te
-- krijgen.

create function public.get_public_retreat(retreat_public_slug text)
returns table (
  id uuid,
  public_slug text,
  title text,
  description text,
  location text,
  country text,
  start_date date,
  end_date date,
  capacity integer,
  price_per_person numeric,
  cover_image_url text,
  status retreat_status,
  metadata jsonb,
  organization_name text,
  organization_slug text,
  organization_contact_phone text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select r.id, r.public_slug, r.title, r.description, r.location, r.country,
         r.start_date, r.end_date, r.capacity, r.price_per_person, r.cover_image_url,
         r.status, r.metadata, o.name, o.slug, o.contact_phone
  from public.retreats r
  join public.organizations o on o.id = r.organization_id
  where r.public_slug = retreat_public_slug
    and r.enrollment_visibility = 'openbaar'
    and r.archived_at is null
    and r.status in ('inschrijving_open', 'bijna_vol', 'vol')
  limit 1;
$$;

comment on function public.get_public_retreat is
  'Enige weg voor de openbare retreatpagina om retreat + organisatienaam/contactnummer op te halen, zonder anon brede leestoegang tot organizations te geven.';

grant execute on function public.get_public_retreat(text) to anon, authenticated;

create function public.list_public_retreats(filter_org_slug text default null)
returns table (
  id uuid,
  public_slug text,
  organization_name text,
  organization_slug text,
  title text,
  location text,
  country text,
  start_date date,
  end_date date,
  capacity integer,
  price_per_person numeric,
  cover_image_url text,
  status retreat_status
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select r.id, r.public_slug, o.name, o.slug, r.title, r.location, r.country,
         r.start_date, r.end_date, r.capacity, r.price_per_person, r.cover_image_url, r.status
  from public.retreats r
  join public.organizations o on o.id = r.organization_id
  where r.enrollment_visibility = 'openbaar'
    and r.archived_at is null
    and r.status in ('inschrijving_open', 'bijna_vol', 'vol')
    and r.public_slug is not null
    and (filter_org_slug is null or o.slug = filter_org_slug)
  order by r.start_date asc;
$$;

comment on function public.list_public_retreats is
  'Voedt zowel de centrale ontdekpagina (/ontdek, zonder filter) als de publieke organisatorpagina (/o/[orgSlug], met filter_org_slug). Platformbreed leesbaar via anon -- dat is precies het punt van deze marktplaatsfunctie.';

grant execute on function public.list_public_retreats(text) to anon, authenticated;

-- Organisatienaam + logo zijn nodig op de organisatorpagina; ook hier via een
-- smalle RPC in plaats van brede anon-leestoegang tot organizations te geven.
create function public.get_public_organization(org_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  logo_url text,
  website text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select o.id, o.name, o.slug, o.logo_url, o.website
  from public.organizations o
  where o.slug = org_slug
    and o.archived_at is null
    and o.status = 'actief'
  limit 1;
$$;

comment on function public.get_public_organization is
  'Enige weg voor de publieke organisatorpagina om organisatienaam/logo op te halen.';

grant execute on function public.get_public_organization(text) to anon, authenticated;
