-- Helper functions used by RLS policies and by the application layer.
-- All are SECURITY DEFINER + STABLE with a pinned search_path so they cannot be
-- hijacked, and so they can read organization_members without recursing through
-- that table's own RLS policies.

create function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org_id
      and m.profile_id = auth.uid()
      and m.status = 'actief'
  );
$$;

comment on function public.is_org_member is 'True als de ingelogde gebruiker een actief lid is van de organisatie, ongeacht rol.';

create function public.has_org_role(target_org_id uuid, allowed_roles organization_role[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org_id
      and m.profile_id = auth.uid()
      and m.status = 'actief'
      and m.role = any (allowed_roles)
  );
$$;

comment on function public.has_org_role is 'True als de ingelogde gebruiker in de organisatie één van de opgegeven rollen heeft.';

create function public.is_retreat_team_member(target_retreat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.retreat_team_members rtm
    where rtm.retreat_id = target_retreat_id
      and rtm.profile_id = auth.uid()
  );
$$;

comment on function public.is_retreat_team_member is 'True als de ingelogde gebruiker als coordinator aan dit specifieke retreat is toegewezen.';

-- A coordinator only sees retreats they are assigned to; owner/admin/viewer see
-- every retreat in the organization. Used both directly in RLS and mirrored in
-- src/lib/auth/permissions.ts for the server-side authorization layer.
create function public.can_access_retreat(target_retreat_id uuid, target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_org_role(target_org_id, array['owner', 'admin', 'viewer']::organization_role[])
    or public.is_retreat_team_member(target_retreat_id);
$$;

comment on function public.can_access_retreat is 'Combineert org-brede rollen met de coordinator-scoping op retreatniveau.';

-- Atomically creates an organization and its first owner membership. Direct INSERT
-- on organizations is not allowed via RLS (see rls_policies migration) precisely so
-- that every organization is guaranteed to have an owner from the moment it exists.
create function public.create_organization(
  org_name text,
  org_slug text,
  org_contact_email citext default null,
  org_country text default 'Nederland'
)
returns public.organizations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_org public.organizations;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Alleen ingelogde gebruikers kunnen een organisatie aanmaken.';
  end if;

  insert into public.organizations (name, slug, contact_email, country, created_by)
  values (org_name, org_slug, org_contact_email, coalesce(org_country, 'Nederland'), current_user_id)
  returning * into new_org;

  insert into public.organization_members (organization_id, profile_id, role, status)
  values (new_org.id, current_user_id, 'owner', 'actief');

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (new_org.id, current_user_id, 'organisatie.aangemaakt', 'organization', new_org.id, jsonb_build_object('naam', org_name));

  return new_org;
end;
$$;

comment on function public.create_organization is 'Enige geautoriseerde manier om een organisatie aan te maken; garandeert org + owner-membership in één transactie.';

grant execute on function public.create_organization(text, text, citext, text) to authenticated;
