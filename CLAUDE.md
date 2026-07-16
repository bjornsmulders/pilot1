@AGENTS.md

# JourneyOS — projectinstructies

- Lees `docs/architecture.md` en `docs/decisions.md` voordat je code toevoegt —
  met name ADR-0001 (`proxy.ts` i.p.v. `middleware.ts`, Next.js 16-breaking change).
- Elke feature raakt in principe drie lagen: SQL-migratie + RLS
  (`supabase/migrations/`), server-side autorisatie (`src/lib/auth/`), en UI.
  Nooit alleen de frontend beveiligen — zie `docs/security.md`.
- Rollen: Owner, Admin, Coordinator, Viewer zijn stafrollen
  (`organization_members`). Participant is geen stafrol — deelnemers gebruiken een
  gehasht, vervalbaar token (`participant_invites`), geen Supabase Auth-account. Zie
  ADR-0002 in `docs/decisions.md`.
- Datum/tijd: database in UTC (`timestamptz`), UI toont `Europe/Amsterdam` via
  `src/lib/format.ts`.
- shadcn/ui-CLI is in deze omgeving geblokkeerd (proxy staat `ui.shadcn.com` niet
  toe); UI-componenten worden handmatig toegevoegd aan `src/components/ui/` in
  dezelfde stijl. Zie ADR-0004.
- Voor elke feature: migration → RLS → server-side validatie/autorisatie →
  UI (loading/lege/foutstatus) → auditlogging waar relevant → tests → lint +
  typecheck + tests groen → documentatie bijwerken. Zie "Definitie van klaar" in
  `docs/product-requirements.md`-geest (volledige lijst stond in de oorspronkelijke
  opdracht; kort samengevat hierboven).
- Geen medische dossiers, geen volledige WhatsApp-berichtinhoud opslaan, geen
  voorafgevinkte marketingtoestemming. Zie `docs/privacy.md`.
