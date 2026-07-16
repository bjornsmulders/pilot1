-- Completes the team-invitation loop (module A). Invited users cannot read the
-- invitations table directly (RLS restricts it to owners, see rls_policies
-- migration) -- they only ever have the plaintext token from the e-mail/WhatsApp
-- link. This SECURITY DEFINER function validates that token server-side and is
-- the only way an invitation can be redeemed, mirroring the create_organization
-- pattern (ADR-0003) and the participant-token approach (ADR-0002).

-- Read-only preview so the invite page can show "je bent uitgenodigd voor
-- <organisatie> als <rol>" before the user logs in. Deliberately returns
-- nothing (empty set) for an invalid/expired token rather than raising, so the
-- page can render a neutral "ongeldige link" state without leaking whether a
-- token ever existed.
create function public.preview_invitation(invitation_token text)
returns table (organization_name text, role organization_role, email citext)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select o.name, i.role, i.email
  from public.invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token_hash = encode(digest(invitation_token, 'sha256'), 'hex')
    and i.status = 'pending'
    and i.expires_at > now()
  limit 1;
$$;

comment on function public.preview_invitation is 'Toont organisatienaam/rol voor een geldig, niet-verlopen uitnodigingstoken zonder de uitnodiging te verbruiken.';

grant execute on function public.preview_invitation(text) to anon, authenticated;

create function public.accept_invitation(invitation_token text)
returns public.organization_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_email citext;
  matched_invitation public.invitations;
  new_membership public.organization_members;
begin
  if current_user_id is null then
    raise exception 'Log in met het e-mailadres waarop de uitnodiging is verstuurd.';
  end if;

  select email into current_user_email from auth.users where id = current_user_id;

  select * into matched_invitation
  from public.invitations
  where token_hash = encode(digest(invitation_token, 'sha256'), 'hex')
    and status = 'pending'
    and expires_at > now()
  limit 1;

  if matched_invitation.id is null then
    raise exception 'Deze uitnodiging is ongeldig of verlopen.';
  end if;

  if matched_invitation.email <> current_user_email then
    raise exception 'Deze uitnodiging is verstuurd naar een ander e-mailadres. Log in met %.', matched_invitation.email;
  end if;

  insert into public.organization_members (organization_id, profile_id, role, status, invited_by)
  values (matched_invitation.organization_id, current_user_id, matched_invitation.role, 'actief', matched_invitation.invited_by)
  on conflict (organization_id, profile_id) do update
    set role = excluded.role, status = 'actief'
  returning * into new_membership;

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = matched_invitation.id;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (
    matched_invitation.organization_id,
    current_user_id,
    'uitnodiging.geaccepteerd',
    'organization_member',
    new_membership.id,
    jsonb_build_object('rol', matched_invitation.role)
  );

  return new_membership;
end;
$$;

comment on function public.accept_invitation is 'Valideert een uitnodigingstoken en maakt de organization_members-rij aan. Enige geautoriseerde weg om een uitnodiging te accepteren.';

grant execute on function public.accept_invitation(text) to authenticated;

-- pgcrypto's digest() is used above for the sha-256 hash (consistent with the
-- application-side hashToken() in src/lib/tokens.ts).
