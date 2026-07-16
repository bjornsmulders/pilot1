-- Reviews (nieuw, "na afloop"-onderdeel van module F, op verzoek van de
-- gebruiker). Deelnemers hebben geen account (ADR-0002), dus een review komt
-- binnen via een publieke, ongeauthenticeerde link die de organisator na
-- afloop deelt -- net als het interesseformulier. Nieuwe reviews zijn NIET
-- automatisch zichtbaar: een staflid moet ze eerst publiceren (menselijke
-- moderatie, geen ongefilterde publieke tekst direct op de site).

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  author_name text not null check (char_length(btrim(author_name)) > 0),
  rating integer not null check (rating between 1 and 5),
  body text,
  is_published boolean not null default false,
  moderated_by uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);

create index reviews_retreat_id_idx on public.reviews (retreat_id, is_published);

comment on table public.reviews is 'Reviews per retreat. Nieuwe rijen zijn ongepubliceerd totdat een staflid ze publiceert.';

alter table public.reviews enable row level security;

create policy reviews_select on public.reviews
  for select using (public.can_access_retreat(retreat_id, organization_id));

create policy reviews_write on public.reviews
  for all using (public.can_manage_retreat(retreat_id, organization_id))
  with check (public.can_manage_retreat(retreat_id, organization_id));

create function public.submit_public_review(
  retreat_public_slug text,
  author_name text,
  rating integer,
  body text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  matched_retreat public.retreats;
begin
  if btrim(coalesce(author_name, '')) = '' then
    raise exception 'Vul een naam in.';
  end if;
  if rating is null or rating < 1 or rating > 5 then
    raise exception 'Kies een waardering tussen 1 en 5.';
  end if;

  select * into matched_retreat
  from public.retreats
  where public_slug = retreat_public_slug
    and archived_at is null
  limit 1;

  if matched_retreat.id is null then
    raise exception 'Retreat niet gevonden.';
  end if;

  insert into public.reviews (organization_id, retreat_id, author_name, rating, body, is_published)
  values (matched_retreat.organization_id, matched_retreat.id, author_name, rating, body, false);
end;
$$;

comment on function public.submit_public_review is
  'Enige weg voor anonieme bezoekers om een review in te dienen. Nieuwe reviews zijn ongepubliceerd totdat een staflid ze publiceert. Bewust geen statusfilter op het retreat (i.t.t. submit_public_lead) -- reviews horen juist na afloop te komen, wanneer het retreat vaak al "afgerond" is.';

grant execute on function public.submit_public_review(text, text, integer, text) to anon, authenticated;

create function public.list_public_reviews(retreat_public_slug text)
returns table (
  id uuid,
  author_name text,
  rating integer,
  body text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select rv.id, rv.author_name, rv.rating, rv.body, rv.created_at
  from public.reviews rv
  join public.retreats t on t.id = rv.retreat_id
  where t.public_slug = retreat_public_slug
    and rv.is_published = true
  order by rv.created_at desc;
$$;

comment on function public.list_public_reviews is
  'Enige weg voor anonieme bezoekers om gepubliceerde reviews van een retreat te zien.';

grant execute on function public.list_public_reviews(text) to anon, authenticated;
