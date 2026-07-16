-- Row Level Security: the second, non-bypassable layer of authorization.
-- Every table below has RLS enabled with no default policy (deny by default).
-- Pattern used throughout:
--   * owner/admin/viewer  -> organization-wide read; owner/admin -> organization-wide write
--   * coordinator         -> read/write only on retreats they are assigned to
--     (retreat_team_members), never organization-wide
--   * participant         -> NOT handled here. Participants authenticate with a
--     hashed, expiring onboarding token instead of Supabase Auth (see
--     docs/decisions.md ADR-0002). Their self-service RLS policies are added in the
--     onboarding-slice migration, scoped strictly to "their own participant row".
--
-- Additional helper functions, layered on top of is_org_member / has_org_role /
-- is_retreat_team_member / can_access_retreat from the previous migration.

create function public.can_manage_retreat(target_retreat_id uuid, target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_org_role(target_org_id, array['owner', 'admin']::organization_role[])
    or public.is_retreat_team_member(target_retreat_id);
$$;

create function public.can_access_participant(target_participant_id uuid, target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.participants p
    where p.id = target_participant_id
      and p.organization_id = target_org_id
      and public.can_access_retreat(p.retreat_id, p.organization_id)
  );
$$;

create function public.can_manage_participant(target_participant_id uuid, target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.participants p
    where p.id = target_participant_id
      and p.organization_id = target_org_id
      and public.can_manage_retreat(p.retreat_id, p.organization_id)
  );
$$;

create function public.can_access_lead(target_lead_id uuid, target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.leads l
    where l.id = target_lead_id
      and l.organization_id = target_org_id
      and (
        public.has_org_role(target_org_id, array['owner', 'admin', 'viewer']::organization_role[])
        or (l.retreat_id is not null and public.is_retreat_team_member(l.retreat_id))
      )
  );
$$;

create function public.can_manage_lead(target_lead_id uuid, target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.leads l
    where l.id = target_lead_id
      and l.organization_id = target_org_id
      and (
        public.has_org_role(target_org_id, array['owner', 'admin']::organization_role[])
        or (l.retreat_id is not null and public.is_retreat_team_member(l.retreat_id))
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;

create policy organizations_select on public.organizations
  for select using (public.is_org_member(id));

create policy organizations_update on public.organizations
  for update using (public.has_org_role(id, array['owner']::organization_role[]))
  with check (public.has_org_role(id, array['owner']::organization_role[]));

-- No INSERT/DELETE policy: creation only via public.create_organization(), which
-- runs SECURITY DEFINER as the migration owner and therefore bypasses RLS. This
-- guarantees an organization can never exist without an owner membership.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from public.organization_members mine
      join public.organization_members theirs on theirs.organization_id = mine.organization_id
      where mine.profile_id = auth.uid()
        and mine.status = 'actief'
        and theirs.profile_id = profiles.id
        and theirs.status = 'actief'
    )
  );

create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- organization_members / invitations / audit_logs
-- ---------------------------------------------------------------------------
alter table public.organization_members enable row level security;

create policy organization_members_select on public.organization_members
  for select using (public.is_org_member(organization_id));

create policy organization_members_insert on public.organization_members
  for insert with check (public.has_org_role(organization_id, array['owner']::organization_role[]));

create policy organization_members_update on public.organization_members
  for update using (public.has_org_role(organization_id, array['owner']::organization_role[]))
  with check (public.has_org_role(organization_id, array['owner']::organization_role[]));

create policy organization_members_delete on public.organization_members
  for delete using (public.has_org_role(organization_id, array['owner']::organization_role[]));

alter table public.invitations enable row level security;

create policy invitations_select on public.invitations
  for select using (public.has_org_role(organization_id, array['owner']::organization_role[]));

create policy invitations_insert on public.invitations
  for insert with check (public.has_org_role(organization_id, array['owner']::organization_role[]));

create policy invitations_update on public.invitations
  for update using (public.has_org_role(organization_id, array['owner']::organization_role[]))
  with check (public.has_org_role(organization_id, array['owner']::organization_role[]));

create policy invitations_delete on public.invitations
  for delete using (public.has_org_role(organization_id, array['owner']::organization_role[]));

alter table public.audit_logs enable row level security;

create policy audit_logs_select on public.audit_logs
  for select using (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

create policy audit_logs_insert on public.audit_logs
  for insert with check (public.is_org_member(organization_id) and actor_id = auth.uid());

-- No UPDATE/DELETE policy anywhere: audit_logs is append-only.

-- ---------------------------------------------------------------------------
-- retreats / retreat_team_members
-- ---------------------------------------------------------------------------
alter table public.retreats enable row level security;

create policy retreats_select on public.retreats
  for select using (public.can_access_retreat(id, organization_id));

create policy retreats_insert on public.retreats
  for insert with check (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

create policy retreats_update on public.retreats
  for update using (public.can_manage_retreat(id, organization_id))
  with check (public.can_manage_retreat(id, organization_id));

-- No DELETE policy: retreats are archived (archived_at/status), never hard-deleted.

alter table public.retreat_team_members enable row level security;

create policy retreat_team_members_select on public.retreat_team_members
  for select using (public.is_org_member(organization_id));

create policy retreat_team_members_insert on public.retreat_team_members
  for insert with check (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

create policy retreat_team_members_delete on public.retreat_team_members
  for delete using (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

-- ---------------------------------------------------------------------------
-- leads / lead_activities
-- ---------------------------------------------------------------------------
alter table public.leads enable row level security;

create policy leads_select on public.leads
  for select using (
    public.has_org_role(organization_id, array['owner', 'admin', 'viewer']::organization_role[])
    or (retreat_id is not null and public.is_retreat_team_member(retreat_id))
  );

create policy leads_insert on public.leads
  for insert with check (
    public.has_org_role(organization_id, array['owner', 'admin']::organization_role[])
    or (retreat_id is not null and public.is_retreat_team_member(retreat_id))
  );

create policy leads_update on public.leads
  for update using (
    public.has_org_role(organization_id, array['owner', 'admin']::organization_role[])
    or (retreat_id is not null and public.is_retreat_team_member(retreat_id))
  ) with check (
    public.has_org_role(organization_id, array['owner', 'admin']::organization_role[])
    or (retreat_id is not null and public.is_retreat_team_member(retreat_id))
  );

create policy leads_delete on public.leads
  for delete using (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

alter table public.lead_activities enable row level security;

create policy lead_activities_select on public.lead_activities
  for select using (public.can_access_lead(lead_id, organization_id));

create policy lead_activities_insert on public.lead_activities
  for insert with check (public.can_manage_lead(lead_id, organization_id));

-- ---------------------------------------------------------------------------
-- participants and everything that hangs off a participant
-- ---------------------------------------------------------------------------
alter table public.participants enable row level security;

create policy participants_select on public.participants
  for select using (public.can_access_retreat(retreat_id, organization_id));

create policy participants_insert on public.participants
  for insert with check (public.can_manage_retreat(retreat_id, organization_id));

create policy participants_update on public.participants
  for update using (public.can_manage_retreat(retreat_id, organization_id))
  with check (public.can_manage_retreat(retreat_id, organization_id));

create policy participants_delete on public.participants
  for delete using (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

alter table public.participant_consents enable row level security;

create policy participant_consents_select on public.participant_consents
  for select using (public.can_access_participant(participant_id, organization_id));

create policy participant_consents_insert on public.participant_consents
  for insert with check (public.can_manage_participant(participant_id, organization_id));

alter table public.participant_invites enable row level security;

create policy participant_invites_select on public.participant_invites
  for select using (public.can_access_participant(participant_id, organization_id));

create policy participant_invites_insert on public.participant_invites
  for insert with check (public.can_manage_participant(participant_id, organization_id));

create policy participant_invites_update on public.participant_invites
  for update using (public.can_manage_participant(participant_id, organization_id))
  with check (public.can_manage_participant(participant_id, organization_id));

alter table public.onboarding_forms enable row level security;

create policy onboarding_forms_select on public.onboarding_forms
  for select using (public.can_access_retreat(retreat_id, organization_id));

create policy onboarding_forms_write on public.onboarding_forms
  for all using (public.can_manage_retreat(retreat_id, organization_id))
  with check (public.can_manage_retreat(retreat_id, organization_id));

alter table public.onboarding_questions enable row level security;

create policy onboarding_questions_select on public.onboarding_questions
  for select using (
    exists (
      select 1 from public.onboarding_forms f
      where f.id = onboarding_questions.onboarding_form_id
        and public.can_access_retreat(f.retreat_id, f.organization_id)
    )
  );

create policy onboarding_questions_write on public.onboarding_questions
  for all using (
    exists (
      select 1 from public.onboarding_forms f
      where f.id = onboarding_questions.onboarding_form_id
        and public.can_manage_retreat(f.retreat_id, f.organization_id)
    )
  ) with check (
    exists (
      select 1 from public.onboarding_forms f
      where f.id = onboarding_questions.onboarding_form_id
        and public.can_manage_retreat(f.retreat_id, f.organization_id)
    )
  );

alter table public.onboarding_answers enable row level security;

create policy onboarding_answers_staff_select on public.onboarding_answers
  for select using (
    exists (
      select 1 from public.onboarding_forms f
      where f.id = onboarding_answers.onboarding_form_id
        and public.can_access_retreat(f.retreat_id, f.organization_id)
    )
  );

create policy onboarding_answers_staff_write on public.onboarding_answers
  for all using (
    exists (
      select 1 from public.onboarding_forms f
      where f.id = onboarding_answers.onboarding_form_id
        and public.can_manage_retreat(f.retreat_id, f.organization_id)
    )
  ) with check (
    exists (
      select 1 from public.onboarding_forms f
      where f.id = onboarding_answers.onboarding_form_id
        and public.can_manage_retreat(f.retreat_id, f.organization_id)
    )
  );

alter table public.travel_plans enable row level security;

create policy travel_plans_select on public.travel_plans
  for select using (public.can_access_participant(participant_id, organization_id));

create policy travel_plans_write on public.travel_plans
  for all using (public.can_manage_participant(participant_id, organization_id))
  with check (public.can_manage_participant(participant_id, organization_id));

alter table public.dietary_requirements enable row level security;

create policy dietary_requirements_select on public.dietary_requirements
  for select using (public.can_access_participant(participant_id, organization_id));

create policy dietary_requirements_write on public.dietary_requirements
  for all using (public.can_manage_participant(participant_id, organization_id))
  with check (public.can_manage_participant(participant_id, organization_id));

-- ---------------------------------------------------------------------------
-- carpools / rooms
-- ---------------------------------------------------------------------------
alter table public.carpools enable row level security;

create policy carpools_select on public.carpools
  for select using (public.can_access_retreat(retreat_id, organization_id));

create policy carpools_write on public.carpools
  for all using (public.can_manage_retreat(retreat_id, organization_id))
  with check (public.can_manage_retreat(retreat_id, organization_id));

alter table public.carpool_members enable row level security;

create policy carpool_members_select on public.carpool_members
  for select using (
    exists (
      select 1 from public.carpools c
      where c.id = carpool_members.carpool_id
        and public.can_access_retreat(c.retreat_id, c.organization_id)
    )
  );

create policy carpool_members_write on public.carpool_members
  for all using (
    exists (
      select 1 from public.carpools c
      where c.id = carpool_members.carpool_id
        and public.can_manage_retreat(c.retreat_id, c.organization_id)
    )
  ) with check (
    exists (
      select 1 from public.carpools c
      where c.id = carpool_members.carpool_id
        and public.can_manage_retreat(c.retreat_id, c.organization_id)
    )
  );

alter table public.room_types enable row level security;

create policy room_types_select on public.room_types
  for select using (public.can_access_retreat(retreat_id, organization_id));

create policy room_types_write on public.room_types
  for all using (public.can_manage_retreat(retreat_id, organization_id))
  with check (public.can_manage_retreat(retreat_id, organization_id));

alter table public.rooms enable row level security;

create policy rooms_select on public.rooms
  for select using (public.can_access_retreat(retreat_id, organization_id));

create policy rooms_write on public.rooms
  for all using (public.can_manage_retreat(retreat_id, organization_id))
  with check (public.can_manage_retreat(retreat_id, organization_id));

alter table public.room_assignments enable row level security;

create policy room_assignments_select on public.room_assignments
  for select using (
    exists (
      select 1 from public.rooms r
      where r.id = room_assignments.room_id
        and public.can_access_retreat(r.retreat_id, r.organization_id)
    )
  );

create policy room_assignments_write on public.room_assignments
  for all using (
    exists (
      select 1 from public.rooms r
      where r.id = room_assignments.room_id
        and public.can_manage_retreat(r.retreat_id, r.organization_id)
    )
  ) with check (
    exists (
      select 1 from public.rooms r
      where r.id = room_assignments.room_id
        and public.can_manage_retreat(r.retreat_id, r.organization_id)
    )
  );

-- ---------------------------------------------------------------------------
-- schedule / announcements / files
-- ---------------------------------------------------------------------------
alter table public.schedule_items enable row level security;

create policy schedule_items_select on public.schedule_items
  for select using (public.can_access_retreat(retreat_id, organization_id));

create policy schedule_items_write on public.schedule_items
  for all using (public.can_manage_retreat(retreat_id, organization_id))
  with check (public.can_manage_retreat(retreat_id, organization_id));

alter table public.announcements enable row level security;

create policy announcements_select on public.announcements
  for select using (public.can_access_retreat(retreat_id, organization_id));

create policy announcements_write on public.announcements
  for all using (public.can_manage_retreat(retreat_id, organization_id))
  with check (public.can_manage_retreat(retreat_id, organization_id));

alter table public.files enable row level security;

create policy files_select on public.files
  for select using (
    public.is_org_member(organization_id)
    and (retreat_id is null or public.can_access_retreat(retreat_id, organization_id))
  );

create policy files_write on public.files
  for all using (
    public.has_org_role(organization_id, array['owner', 'admin']::organization_role[])
    or (retreat_id is not null and public.is_retreat_team_member(retreat_id))
  ) with check (
    public.has_org_role(organization_id, array['owner', 'admin']::organization_role[])
    or (retreat_id is not null and public.is_retreat_team_member(retreat_id))
  );

-- ---------------------------------------------------------------------------
-- alumni / referrals -- organization-wide, not retreat-scoped (post-retreat
-- relationship management is an owner/admin/viewer concern, not a coordinator one)
-- ---------------------------------------------------------------------------
alter table public.alumni_memberships enable row level security;

create policy alumni_memberships_select on public.alumni_memberships
  for select using (public.has_org_role(organization_id, array['owner', 'admin', 'viewer']::organization_role[]));

create policy alumni_memberships_write on public.alumni_memberships
  for all using (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

alter table public.referral_codes enable row level security;

create policy referral_codes_select on public.referral_codes
  for select using (public.has_org_role(organization_id, array['owner', 'admin', 'viewer']::organization_role[]));

create policy referral_codes_write on public.referral_codes
  for all using (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

alter table public.referrals enable row level security;

create policy referrals_select on public.referrals
  for select using (public.has_org_role(organization_id, array['owner', 'admin', 'viewer']::organization_role[]));

create policy referrals_write on public.referrals
  for all using (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

-- ---------------------------------------------------------------------------
-- payments -- financial data. Coordinators may read (need to know a participant's
-- payment status) but never write; writing is an owner/admin action. payment_events
-- is written exclusively by the Mollie webhook route handler using the service-role
-- key server-side, which bypasses RLS by design -- see docs/security.md.
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;

create policy payments_select on public.payments
  for select using (
    public.has_org_role(organization_id, array['owner', 'admin', 'viewer']::organization_role[])
    or public.is_retreat_team_member(retreat_id)
  );

create policy payments_write on public.payments
  for all using (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

alter table public.payment_events enable row level security;

create policy payment_events_select on public.payment_events
  for select using (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

-- ---------------------------------------------------------------------------
-- messaging (module G)
-- ---------------------------------------------------------------------------
alter table public.message_templates enable row level security;

create policy message_templates_select on public.message_templates
  for select using (public.is_org_member(organization_id));

create policy message_templates_write on public.message_templates
  for all using (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]))
  with check (public.has_org_role(organization_id, array['owner', 'admin']::organization_role[]));

alter table public.message_deliveries enable row level security;

create policy message_deliveries_select on public.message_deliveries
  for select using (public.is_org_member(organization_id));

create policy message_deliveries_write on public.message_deliveries
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id) and sent_by = auth.uid());
