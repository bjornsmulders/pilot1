/**
 * Handmatig getypeerd voor de tabellen die slice 1 gebruikt. Zodra er een
 * gekoppeld Supabase-project is, vervang dit bestand door de gegenereerde types:
 *   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
 * en breid de Database-interface uit met de resterende tabellen uit
 * docs/database-schema.md naarmate latere slices ze aanspreken.
 *
 * Let op: alle rijtypes hieronder zijn bewust `type X = {...}` en geen
 * `interface` -- alleen object-literal type aliases krijgen van TypeScript een
 * impliciete index signature, wat nodig is om structureel te voldoen aan
 * `Record<string, unknown>` (het type dat @supabase/postgrest-js verwacht voor
 * `Row`/`Insert`/`Update`). Een `interface` faalt die check stilzwijgend en
 * degradeert elke query naar `never`.
 */

export type OrganizationRole = "owner" | "admin" | "coordinator" | "viewer";
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";
export type RetreatStatus =
  | "concept"
  | "inschrijving_open"
  | "bijna_vol"
  | "vol"
  | "afgerond"
  | "geannuleerd";

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  address: string | null;
  country: string;
  default_currency: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  status: "actief" | "gedeactiveerd";
  metadata: Record<string, unknown>;
  created_by: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  locale: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberRow = {
  id: string;
  organization_id: string;
  profile_id: string;
  role: OrganizationRole;
  status: "actief" | "gedeactiveerd";
  invited_by: string | null;
  created_at: string;
  updated_at: string;
};

export type InvitationRow = {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationRole;
  token_hash: string;
  status: InvitationStatus;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RetreatRow = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  location: string | null;
  country: string | null;
  start_date: string;
  end_date: string;
  capacity: number;
  price_per_person: number;
  currency: string;
  status: RetreatStatus;
  enrollment_visibility: "openbaar" | "besloten";
  booking_deadline: string | null;
  cover_image_url: string | null;
  internal_notes: string | null;
  public_slug: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RetreatTeamMemberRow = {
  id: string;
  retreat_id: string;
  organization_id: string;
  profile_id: string;
  role: "coordinator";
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organizations: TableDef<OrganizationRow>;
      profiles: TableDef<ProfileRow>;
      organization_members: TableDef<OrganizationMemberRow>;
      invitations: TableDef<InvitationRow>;
      retreats: TableDef<RetreatRow>;
      retreat_team_members: TableDef<RetreatTeamMemberRow>;
      audit_logs: TableDef<AuditLogRow>;
    };
    Views: {
      participant_current_consents: {
        Row: Record<string, unknown>;
        Relationships: [];
      };
    };
    Functions: {
      create_organization: {
        Args: {
          org_name: string;
          org_slug: string;
          org_contact_email: string | null;
          org_country: string | null;
        };
        Returns: OrganizationRow;
      };
      accept_invitation: {
        Args: { invitation_token: string };
        Returns: OrganizationMemberRow;
      };
      preview_invitation: {
        Args: { invitation_token: string };
        Returns: { organization_name: string; role: OrganizationRole; email: string }[];
      };
    };
  };
};
