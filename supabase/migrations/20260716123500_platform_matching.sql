-- Platformbrede "laatste kans"-matching (vervolg op ADR-0007 in docs/decisions.md).
--
-- Een lead kan expliciet toestemming geven (`platform_matching_consent`, los van
-- het per-organisator `marketing_consent`) om door JourneyOS zélf voorgesteld te
-- worden bij onderbezette retreats van ándere organisatoren. Er is geen directe
-- cross-tenant toegang: alleen een JourneyOS-platformbeheerder
-- (`profiles.is_platform_admin`) kan de kandidatenpool en de lijst met actieve
-- retreats platformbreed inzien, en introduceert handmatig, één voor één. Een
-- introductie maakt een nieuwe, gewone lead aan in de organisatie van het
-- doelretreat -- de doelorganisator ziet die simpelweg in zijn eigen
-- leads-overzicht verschijnen, met een notitie waar hij vandaan komt.
-- Organisator 1 krijgt nooit rechtstreeks database-toegang tot leads/deelnemers
-- van organisator 2.

alter table public.profiles
  add column if not exists is_platform_admin boolean not null default false;

comment on column public.profiles.is_platform_admin is
  'JourneyOS-platformbeheerder (niet een organisatierol). Alleen handmatig in te stellen door een bestaande platformbeheerder of via directe database-toegang.';

alter table public.leads
  add column if not exists platform_matching_consent boolean not null default false;

comment on column public.leads.platform_matching_consent is
  'Expliciete opt-in: mag JourneyOS deze persoon voorstellen bij onderbezette retreats van andere organisatoren? Losstaand van marketing_consent (dat geldt alleen voor déze organisator).';

create table public.platform_lead_matches (
  id uuid primary key default gen_random_uuid(),
  source_lead_id uuid not null references public.leads(id) on delete cascade,
  target_organization_id uuid not null references public.organizations(id) on delete cascade,
  target_retreat_id uuid not null references public.retreats(id) on delete cascade,
  created_lead_id uuid references public.leads(id) on delete set null,
  introduced_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (source_lead_id, target_retreat_id)
);

comment on table public.platform_lead_matches is
  'Audittrail van platformbrede introducties. Alleen geschreven via introduce_lead_to_retreat().';

alter table public.platform_lead_matches enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select is_platform_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create policy platform_lead_matches_admin_all on public.platform_lead_matches
  for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- De doelorganisatie mag lezen welke van hún leads uit een platform-introductie
-- komen (transparantie over herkomst), maar niets schrijven en niets zien van de
-- brondata bij de andere organisatie.
create policy platform_lead_matches_target_org_select on public.platform_lead_matches
  for select
  to authenticated
  using (public.is_org_member(target_organization_id));

-- Beide lijst-RPC's geven een bewust smalle, platte projectie terug (incl. de
-- naam van de organisatie erachter, via een join binnen deze SECURITY DEFINER
-- functie) -- niet de volledige rij. Dat voorkomt dat interne velden (bv.
-- interne notities, volledige contactgeschiedenis) via deze platformbrede weg
-- lekken; de organisatienaam alleen is nodig zodat de platformbeheerder weet
-- wie hij aan wie voorstelt.
create function public.list_platform_matching_candidates()
returns table (
  id uuid,
  organization_id uuid,
  organization_name text,
  retreat_id uuid,
  name text,
  email citext,
  phone text,
  status lead_status,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select l.id, l.organization_id, o.name, l.retreat_id, l.name, l.email, l.phone, l.status, l.created_at
  from public.leads l
  join public.organizations o on o.id = l.organization_id
  where public.is_platform_admin()
    and l.platform_matching_consent = true
    and l.status not in ('geboekt', 'verloren')
  order by l.created_at desc;
$$;

create function public.list_platform_matching_retreats()
returns table (
  id uuid,
  organization_id uuid,
  organization_name text,
  title text,
  start_date date,
  end_date date,
  capacity integer,
  price_per_person numeric,
  status retreat_status
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select r.id, r.organization_id, o.name, r.title, r.start_date, r.end_date, r.capacity, r.price_per_person, r.status
  from public.retreats r
  join public.organizations o on o.id = r.organization_id
  where public.is_platform_admin()
    and r.archived_at is null
    and r.status in ('inschrijving_open', 'bijna_vol')
  order by r.start_date asc;
$$;

create function public.introduce_lead_to_retreat(
  source_lead_id uuid,
  target_retreat_id uuid
)
returns public.leads
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  src public.leads;
  target public.retreats;
  new_lead public.leads;
begin
  if not public.is_platform_admin() then
    raise exception 'Alleen platformbeheerders mogen introducties maken.';
  end if;

  select * into src from public.leads where id = source_lead_id;
  if src.id is null then
    raise exception 'Bronlead niet gevonden.';
  end if;
  if not src.platform_matching_consent then
    raise exception 'Deze persoon heeft geen toestemming gegeven voor platformbrede introducties.';
  end if;

  select * into target from public.retreats where id = target_retreat_id;
  if target.id is null then
    raise exception 'Doelretreat niet gevonden.';
  end if;
  if target.organization_id = src.organization_id then
    raise exception 'Bron en doel horen al bij dezelfde organisatie -- gebruik daarvoor de gewone laatste-kans-functie binnen één organisatie.';
  end if;

  if exists (
    select 1 from public.platform_lead_matches m
    where m.source_lead_id = introduce_lead_to_retreat.source_lead_id
      and m.target_retreat_id = introduce_lead_to_retreat.target_retreat_id
  ) then
    raise exception 'Deze persoon is al voorgesteld voor dit retreat.';
  end if;

  -- Bewust géén whatsapp_consent/marketing_consent overnemen van de bronlead:
  -- die toestemmingen golden voor de bronorganisatie, niet voor deze nieuwe. De
  -- doelorganisator start met een schone lead en vraagt zelf toestemming bij
  -- het eerste contact, zoals bij elke andere lead.
  insert into public.leads (
    organization_id, retreat_id, name, email, phone, source,
    whatsapp_consent, marketing_consent, platform_matching_consent, status, notes, score
  )
  values (
    target.organization_id, target.id, src.name, src.email, src.phone, 'platform_introductie',
    false, false, false, 'nieuw',
    'Voorgesteld door JourneyOS platformbeheer als mogelijk geïnteresseerde voor dit retreat.',
    5
  )
  returning * into new_lead;

  insert into public.lead_activities (lead_id, organization_id, activity_type, description, score_delta)
  values (
    new_lead.id, target.organization_id, 'platform_introductie',
    'Geïntroduceerd via platformbrede laatste-kans matching.', 5
  );

  insert into public.platform_lead_matches (
    source_lead_id, target_organization_id, target_retreat_id, created_lead_id, introduced_by
  )
  values (source_lead_id, target.organization_id, target.id, new_lead.id, auth.uid());

  return new_lead;
end;
$$;

comment on function public.introduce_lead_to_retreat is
  'Enige weg om een platformbrede introductie te maken. Alleen uitvoerbaar door is_platform_admin(); maakt een nieuwe, op zichzelf staande lead aan bij de doelorganisatie.';

grant execute on function public.list_platform_matching_candidates() to authenticated;
grant execute on function public.list_platform_matching_retreats() to authenticated;
grant execute on function public.introduce_lead_to_retreat(uuid, uuid) to authenticated;

-- Platformbreed overzichtsdashboard voor de super user (is_platform_admin), los
-- van elke organisatie. Alleen aggregaten/tellingen, geen individuele rijen van
-- andere organisaties -- dat blijft voorbehouden aan de matching-RPC's hierboven.
create function public.platform_overview_stats()
returns table (
  total_organizations bigint,
  total_retreats bigint,
  active_retreats bigint,
  total_leads bigint,
  leads_last_30_days bigint,
  total_participants bigint,
  platform_matching_candidates bigint,
  platform_introductions bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    (select count(*) from public.organizations where archived_at is null) as total_organizations,
    (select count(*) from public.retreats where archived_at is null) as total_retreats,
    (select count(*) from public.retreats
      where archived_at is null and status in ('inschrijving_open', 'bijna_vol')) as active_retreats,
    (select count(*) from public.leads) as total_leads,
    (select count(*) from public.leads where created_at >= now() - interval '30 days') as leads_last_30_days,
    (select count(*) from public.participants) as total_participants,
    (select count(*) from public.leads
      where platform_matching_consent = true and status not in ('geboekt', 'verloren')) as platform_matching_candidates,
    (select count(*) from public.platform_lead_matches) as platform_introductions
  where public.is_platform_admin();
$$;

comment on function public.platform_overview_stats is
  'Platformbrede aggregaten voor de super user (is_platform_admin). Geeft nul rijen terug voor iedereen anders -- alleen tellingen, nooit individuele rijen van andere organisaties.';

grant execute on function public.platform_overview_stats() to authenticated;
