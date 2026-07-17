-- Veilige onboarding (module E). Deelnemers hebben geen Supabase Auth-account
-- (ADR-0002) -- toegang loopt uitsluitend via een gehasht, vervalbaar token in
-- `participant_invites`. In plaats van een eigen, brede RLS-leestoegang voor
-- `anon` op travel_plans/dietary_requirements (zoals in ADR-0002 nog los
-- geschetst), volgt deze migratie het patroon dat de rest van deze pilot al
-- gebruikt voor anonieme toegang (submit_public_lead, submit_public_review,
-- accept_invitation): een paar smalle SECURITY DEFINER-functies die de token
-- zelf hashen/valideren en daarna namens de deelnemer lezen/schrijven. Er is
-- dus geen enkele publieke SELECT/INSERT-policy op de onderliggende tabellen
-- nodig -- de functie is de enige geautoriseerde weg.

create function public.preview_onboarding_invite(invite_token text)
returns table (
  participant_full_name text,
  retreat_title text,
  retreat_location text,
  retreat_start_date date,
  retreat_end_date date,
  travel_transport_type text,
  travel_departure_location text,
  travel_airport text,
  travel_flight_number text,
  travel_arrival_time timestamptz,
  travel_departure_time timestamptz,
  travel_carpool_offered boolean,
  travel_carpool_requested boolean,
  travel_notes text,
  diet_type text,
  diet_allergies text,
  diet_other_notes text
)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  invite public.participant_invites;
  hashed text;
begin
  hashed := encode(digest(invite_token, 'sha256'), 'hex');

  select * into invite
  from public.participant_invites
  where token_hash = hashed
    and status in ('actief', 'gebruikt')
    and expires_at > now();

  if invite.id is null then
    raise exception 'Deze link is ongeldig of verlopen.';
  end if;

  update public.participant_invites
  set request_count = request_count + 1, last_request_at = now()
  where id = invite.id;

  return query
  select
    p.full_name, r.title, r.location, r.start_date, r.end_date,
    tp.transport_type, tp.departure_location, tp.airport, tp.flight_number,
    tp.arrival_time, tp.departure_time, tp.carpool_offered, tp.carpool_requested, tp.notes,
    dr.diet_type, dr.allergies, dr.other_notes
  from public.participants p
  join public.retreats r on r.id = p.retreat_id
  left join public.travel_plans tp on tp.participant_id = p.id
  left join public.dietary_requirements dr on dr.participant_id = p.id
  where p.id = invite.participant_id;
end;
$$;

comment on function public.preview_onboarding_invite is
  'Enige weg voor een deelnemer om zijn eigen onboardinggegevens te lezen, op basis van een geldig token. Verhoogt request_count/last_request_at (eenvoudige rate-limiting-registratie, geen harde blokkade -- zie docs/decisions.md).';

grant execute on function public.preview_onboarding_invite(text) to anon, authenticated;

create function public.submit_onboarding(
  invite_token text,
  transport_type text default null,
  departure_location text default null,
  airport text default null,
  flight_number text default null,
  arrival_time timestamptz default null,
  departure_time timestamptz default null,
  carpool_offered boolean default false,
  carpool_requested boolean default false,
  travel_notes text default null,
  diet_type text default null,
  diet_allergies text default null,
  diet_other_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  invite public.participant_invites;
  hashed text;
begin
  hashed := encode(digest(invite_token, 'sha256'), 'hex');

  select * into invite
  from public.participant_invites
  where token_hash = hashed
    and status in ('actief', 'gebruikt')
    and expires_at > now();

  if invite.id is null then
    raise exception 'Deze link is ongeldig of verlopen.';
  end if;

  if transport_type is not null then
    insert into public.travel_plans (
      participant_id, organization_id, transport_type, departure_location,
      airport, flight_number, arrival_time, departure_time,
      carpool_offered, carpool_requested, notes
    )
    values (
      invite.participant_id, invite.organization_id, transport_type, departure_location,
      airport, flight_number, arrival_time, departure_time,
      carpool_offered, carpool_requested, travel_notes
    )
    on conflict (participant_id) do update set
      transport_type = excluded.transport_type,
      departure_location = excluded.departure_location,
      airport = excluded.airport,
      flight_number = excluded.flight_number,
      arrival_time = excluded.arrival_time,
      departure_time = excluded.departure_time,
      carpool_offered = excluded.carpool_offered,
      carpool_requested = excluded.carpool_requested,
      notes = excluded.notes,
      updated_at = now();
  end if;

  if diet_type is not null or diet_allergies is not null or diet_other_notes is not null then
    insert into public.dietary_requirements (
      participant_id, organization_id, diet_type, allergies, other_notes
    )
    values (invite.participant_id, invite.organization_id, diet_type, diet_allergies, diet_other_notes)
    on conflict (participant_id) do update set
      diet_type = excluded.diet_type,
      allergies = excluded.allergies,
      other_notes = excluded.other_notes,
      updated_at = now();
  end if;

  update public.participants
  set onboarding_status = 'voltooid',
      invitation_status = 'voltooid'
  where id = invite.participant_id;

  update public.participant_invites
  set status = 'gebruikt', used_at = now()
  where id = invite.id;
end;
$$;

comment on function public.submit_onboarding is
  'Enige weg voor een deelnemer om zijn reisgegevens/dieetwensen op te slaan, op basis van een geldig token. Upsert (herhaald invullen mag, overschrijft het vorige antwoord).';

grant execute on function public.submit_onboarding(
  text, text, text, text, text, timestamptz, timestamptz, boolean, boolean, text, text, text, text
) to anon, authenticated;
