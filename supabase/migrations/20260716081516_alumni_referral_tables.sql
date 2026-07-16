-- Alumni (module H) and referrals (module I).

create table public.alumni_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  home_region text,
  interests text[] not null default '{}',
  became_alumnus_at timestamptz not null default now(),
  reactivated_at timestamptz,
  status text not null default 'actief' check (status in ('actief', 'inactief')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id)
);

create index alumni_memberships_organization_id_idx on public.alumni_memberships (organization_id, status);

comment on table public.alumni_memberships is 'Zet een deelnemer om naar alumnus na afloop van een retreat.';

create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (participant_id)
);

comment on table public.referral_codes is 'Eén unieke referralcode per deelnemer/ambassadeur.';

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  referral_code_id uuid not null references public.referral_codes (id) on delete cascade,
  referrer_participant_id uuid not null references public.participants (id) on delete cascade,
  referred_lead_id uuid references public.leads (id) on delete set null,
  referred_participant_id uuid references public.participants (id) on delete set null,
  status text not null default 'geregistreerd'
    check (status in ('geregistreerd', 'geboekt', 'beloond', 'ongeldig')),
  reward_description text,
  reward_registered_at timestamptz,
  manual_discount_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (referred_lead_id),
  unique (referred_participant_id)
);

create index referrals_referrer_idx on public.referrals (referrer_participant_id);
create index referrals_organization_id_idx on public.referrals (organization_id, status);

comment on table public.referrals is 'Eén referral per verwezen lead/deelnemer (unique constraints voorkomen dubbele attributie). Attributieregels: docs/decisions.md.';
