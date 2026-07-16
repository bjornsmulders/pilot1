-- Payments via Mollie (module J) and WhatsApp/e-mail assistant records (module G).

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  retreat_id uuid not null references public.retreats (id) on delete cascade,
  type text not null check (type in ('aanbetaling', 'volledige_betaling', 'overig')),
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  status payment_status not null default 'niet_betaald',
  provider text not null default 'mollie' check (provider in ('mollie', 'handmatig')),
  mollie_payment_id text unique,
  checkout_url text,
  paid_at timestamptz,
  refunded_amount numeric(10, 2) not null default 0 check (refunded_amount >= 0),
  idempotency_key text unique,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_organization_id_idx on public.payments (organization_id);
create index payments_participant_id_idx on public.payments (participant_id);
create index payments_retreat_id_idx on public.payments (retreat_id, status);

comment on table public.payments is 'Betalingen (Mollie of handmatig geregistreerd, zodat organisatoren buiten JourneyOS om kunnen innen).';

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type text not null,
  mollie_event_id text,
  webhook_delivery_id text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index payment_events_payment_id_idx on public.payment_events (payment_id, received_at desc);

comment on table public.payment_events is 'Ruwe Mollie-webhookevents; verwerking is idempotent op basis van payment-status, niet op event-aanwezigheid alleen.';

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  key text not null,
  name text not null,
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'email')),
  body text not null,
  is_default boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, key)
);

comment on table public.message_templates is 'Berichttemplates voor de WhatsApp-assistent (module G), inclusief variabelen zoals {{voornaam}}.';

create table public.message_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  participant_id uuid references public.participants (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  template_id uuid references public.message_templates (id) on delete set null,
  channel text not null check (channel in ('whatsapp_link', 'email', 'mock')),
  rendered_preview text check (rendered_preview is null or char_length(rendered_preview) <= 500),
  status text not null default 'voorbereid'
    check (status in ('voorbereid', 'gekopieerd', 'geopend_in_whatsapp', 'verzonden_bevestigd', 'mislukt')),
  sent_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index message_deliveries_organization_id_idx on public.message_deliveries (organization_id, created_at desc);
create index message_deliveries_participant_id_idx on public.message_deliveries (participant_id);

comment on table public.message_deliveries is 'Handmatig geregistreerde verzendstatus. rendered_preview is een korte, ingekorte preview -- nooit de volledige privéberichtinhoud.';
