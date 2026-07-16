-- Configurable onboarding checklist (module E). The structured, strongly-typed
-- domain tables (travel_plans, dietary_requirements, rooms, ...) hold the core
-- required fields; onboarding_questions/answers track completion percentage and
-- allow an organizer to add a handful of retreat-specific extra questions.

create table public.onboarding_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  title text not null default 'Onboarding',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (retreat_id)
);

comment on table public.onboarding_forms is 'Eén onboardingformulier per retreat.';

create table public.onboarding_questions (
  id uuid primary key default gen_random_uuid(),
  onboarding_form_id uuid not null references public.onboarding_forms (id) on delete cascade,
  section text not null,
  key text not null,
  label text not null,
  input_type text not null check (input_type in ('text', 'textarea', 'select', 'boolean', 'date', 'time')),
  options jsonb,
  required boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (onboarding_form_id, key)
);

create index onboarding_questions_form_idx on public.onboarding_questions (onboarding_form_id, sort_order);

comment on table public.onboarding_questions is 'Extra, organisator-specifieke onboardingvragen bovenop de standaardvelden.';

create table public.onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  onboarding_form_id uuid not null references public.onboarding_forms (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  question_id uuid not null references public.onboarding_questions (id) on delete cascade,
  value text,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (participant_id, question_id)
);

create index onboarding_answers_participant_idx on public.onboarding_answers (participant_id);

comment on table public.onboarding_answers is 'Antwoorden van een deelnemer op de extra onboardingvragen.';
