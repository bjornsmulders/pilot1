-- Reviews ook zichtbaar maken op organisatorniveau (naast per retreat, dat al
-- werkte via get_public_retreat/list_public_reviews) -- op verzoek van de
-- gebruiker. list_public_retreats() bestaat al (public_marketplace_and_org_pages.sql)
-- maar moet van teruggavetype veranderen (extra kolommen), dus eerst droppen --
-- create or replace staat geen wijziging van het returntype toe.

drop function if exists public.list_public_retreats(text);

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
  status retreat_status,
  average_rating numeric,
  review_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    r.id, r.public_slug, o.name, o.slug, r.title, r.location, r.country,
    r.start_date, r.end_date, r.capacity, r.price_per_person, r.cover_image_url, r.status,
    rv.average_rating, coalesce(rv.review_count, 0)
  from public.retreats r
  join public.organizations o on o.id = r.organization_id
  left join lateral (
    select avg(rating)::numeric(3,2) as average_rating, count(*) as review_count
    from public.reviews
    where retreat_id = r.id and is_published = true
  ) rv on true
  where r.enrollment_visibility = 'openbaar'
    and r.archived_at is null
    and r.status in ('inschrijving_open', 'bijna_vol', 'vol')
    and r.public_slug is not null
    and (filter_org_slug is null or o.slug = filter_org_slug)
  order by r.start_date asc;
$$;

comment on function public.list_public_retreats is
  'Voedt /ontdek en /o/[orgSlug], nu incl. gemiddelde beoordeling/aantal gepubliceerde reviews per retreat.';

grant execute on function public.list_public_retreats(text) to anon, authenticated;

create function public.get_organization_review_stats(org_slug text)
returns table (
  average_rating numeric,
  review_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select avg(rv.rating)::numeric(3,2), count(*)
  from public.reviews rv
  join public.retreats r on r.id = rv.retreat_id
  join public.organizations o on o.id = r.organization_id
  where o.slug = org_slug
    and rv.is_published = true;
$$;

comment on function public.get_organization_review_stats is
  'Geaggregeerde reviewscore over alle retreats van een organisator heen (alleen gepubliceerde reviews), voor de "parent"-organisatorpagina /o/[orgSlug].';

grant execute on function public.get_organization_review_stats(text) to anon, authenticated;
