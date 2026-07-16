-- Generic updated_at maintenance and an owner-protection guard.

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'organizations', 'profiles', 'organization_members', 'invitations',
    'retreats', 'leads', 'participants', 'onboarding_forms', 'travel_plans',
    'carpools', 'room_types', 'rooms', 'dietary_requirements', 'schedule_items',
    'announcements', 'alumni_memberships', 'referrals', 'payments',
    'message_templates', 'message_deliveries'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end;
$$;

-- Guarantee every organization always keeps at least one active owner.
create function public.prevent_last_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  remaining_owners integer;
  affected_org uuid;
begin
  affected_org := coalesce(old.organization_id, new.organization_id);

  if (tg_op = 'DELETE' and old.role = 'owner' and old.status = 'actief')
     or (tg_op = 'UPDATE' and old.role = 'owner' and old.status = 'actief'
         and (new.role <> 'owner' or new.status <> 'actief')) then
    select count(*) into remaining_owners
    from public.organization_members
    where organization_id = affected_org
      and role = 'owner'
      and status = 'actief'
      and id <> old.id;

    if remaining_owners = 0 then
      raise exception 'Een organisatie moet minimaal één actieve eigenaar behouden.';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger organization_members_prevent_last_owner
  before update or delete on public.organization_members
  for each row execute function public.prevent_last_owner_removal();
