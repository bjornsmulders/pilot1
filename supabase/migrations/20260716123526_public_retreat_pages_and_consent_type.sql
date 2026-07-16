-- Openbare retreatpagina's + publiek interesseformulier (module C), en een
-- nieuwe toestemmingscategorie voor de "laatste-kans"-functie (module H/I):
-- deelnemers die opt-in geven om benaderd te worden voor last-minute plekken
-- in ándere retreats van dezelfde organisator.

alter type consent_type add value if not exists 'laatste_kans_aanbiedingen';

-- Extra, aanvullende (permissive) SELECT-policy op retreats: naast de
-- bestaande staf-scoping mogen ook anonieme bezoekers een retreat lezen zodra
-- de organisator het expliciet openbaar heeft gezet. Postgres combineert
-- meerdere permissive policies voor dezelfde actie met OR, dus dit verzwakt
-- de bestaande tenant-scoping voor stafleden niet.
create policy retreats_public_select on public.retreats
  for select
  to anon, authenticated
  using (
    enrollment_visibility = 'openbaar'
    and archived_at is null
    and status in ('inschrijving_open', 'bijna_vol', 'vol')
  );

-- Enige geautoriseerde weg voor een anonieme bezoeker om een lead aan te
-- maken. Valideert dat het retreat daadwerkelijk openbaar en actief is,
-- zodat dit niet misbruikt kan worden om leads bij besloten/gearchiveerde
-- retreats te injecteren. Geen formele rate limiting op databaseniveau (zie
-- docs/decisions.md) -- bij misbruik in een latere slice toevoegen.
create function public.submit_public_lead(
  retreat_public_slug text,
  lead_name text,
  lead_email citext default null,
  lead_phone text default null,
  lead_desired_period text default null,
  lead_message text default null,
  lead_whatsapp_consent boolean default false,
  lead_marketing_consent boolean default false,
  lead_platform_matching_consent boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  matched_retreat public.retreats;
  new_lead_id uuid;
begin
  if btrim(coalesce(lead_name, '')) = '' then
    raise exception 'Vul een naam in.';
  end if;

  select * into matched_retreat
  from public.retreats
  where public_slug = retreat_public_slug
    and enrollment_visibility = 'openbaar'
    and archived_at is null
    and status in ('inschrijving_open', 'bijna_vol', 'vol')
  limit 1;

  if matched_retreat.id is null then
    raise exception 'Dit retreat is niet (meer) beschikbaar voor aanmelding.';
  end if;

  insert into public.leads (
    organization_id, retreat_id, name, email, phone, source,
    desired_period, whatsapp_consent, marketing_consent, platform_matching_consent,
    status, notes, score
  )
  values (
    matched_retreat.organization_id, matched_retreat.id, lead_name, lead_email, lead_phone,
    'publiek_formulier', lead_desired_period, lead_whatsapp_consent, lead_marketing_consent,
    lead_platform_matching_consent, 'nieuw', lead_message, 0
  )
  returning id into new_lead_id;

  insert into public.lead_activities (lead_id, organization_id, activity_type, description, score_delta)
  values (
    new_lead_id, matched_retreat.organization_id, 'interesseformulier_ingevuld',
    'Ingevuld via de openbare retreatpagina.', 10
  );

  update public.leads set score = 10 where id = new_lead_id;
end;
$$;

comment on function public.submit_public_lead is 'Enige weg voor anonieme bezoekers om een lead aan te maken, via de openbare retreatpagina.';

grant execute on function public.submit_public_lead(text, text, citext, text, text, text, boolean, boolean, boolean) to anon, authenticated;
