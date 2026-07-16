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
export type LeadStatus =
  | "nieuw"
  | "geinteresseerd"
  | "warm"
  | "gesprek_gepland"
  | "geboekt"
  | "verloren";
export type BookingStatus =
  | "optie"
  | "gereserveerd"
  | "bevestigd"
  | "geannuleerd"
  | "aanwezig"
  | "no_show";
export type PaymentStatus =
  | "niet_betaald"
  | "gedeeltelijk_betaald"
  | "betaald"
  | "mislukt"
  | "terugbetaald"
  | "geannuleerd";
export type ConsentType =
  | "verwerking_uitvoering"
  | "zichtbaar_voor_deelnemers"
  | "alumni_activiteiten"
  | "marketing_organisator"
  | "marketing_journeyos"
  | "laatste_kans_aanbiedingen";

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
  is_platform_admin: boolean;
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

export type LeadRow = {
  id: string;
  organization_id: string;
  retreat_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  desired_period: string | null;
  destination: string | null;
  budget_range: string | null;
  party_size: number | null;
  whatsapp_consent: boolean;
  marketing_consent: boolean;
  platform_matching_consent: boolean;
  status: LeadStatus;
  follow_up_date: string | null;
  notes: string | null;
  score: number;
  is_waitlisted: boolean;
  converted_participant_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadActivityRow = {
  id: string;
  lead_id: string;
  organization_id: string;
  activity_type: string;
  description: string | null;
  score_delta: number;
  created_by: string | null;
  created_at: string;
};

export type ParticipantRow = {
  id: string;
  organization_id: string;
  retreat_id: string;
  lead_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  onboarding_status: "niet_gestart" | "gestart" | "voltooid";
  invitation_status: "niet_verzonden" | "verzonden" | "geopend" | "voltooid" | "verlopen" | "ingetrokken";
  source: string | null;
  referral_code_used: string | null;
  internal_notes: string | null;
  is_alumnus: boolean;
  anonymized_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ParticipantConsentRow = {
  id: string;
  participant_id: string;
  organization_id: string;
  consent_type: ConsentType;
  granted: boolean;
  source: string;
  policy_version: string;
  granted_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type AlumniMembershipRow = {
  id: string;
  organization_id: string;
  participant_id: string;
  home_region: string | null;
  interests: string[];
  became_alumnus_at: string;
  reactivated_at: string | null;
  status: "actief" | "inactief";
  created_at: string;
  updated_at: string;
};

export type MessageTemplateRow = {
  id: string;
  organization_id: string;
  key: string;
  name: string;
  channel: "whatsapp" | "email";
  body: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformMatchingCandidateRow = {
  id: string;
  organization_id: string;
  organization_name: string;
  retreat_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  created_at: string;
};

export type PlatformMatchingRetreatRow = {
  id: string;
  organization_id: string;
  organization_name: string;
  title: string;
  start_date: string;
  end_date: string;
  capacity: number;
  price_per_person: number;
  status: RetreatStatus;
};

export type PlatformOverviewStatsRow = {
  total_organizations: number;
  total_retreats: number;
  active_retreats: number;
  total_leads: number;
  leads_last_30_days: number;
  total_participants: number;
  platform_matching_candidates: number;
  platform_introductions: number;
};

export type MessageDeliveryRow = {
  id: string;
  organization_id: string;
  participant_id: string | null;
  lead_id: string | null;
  template_id: string | null;
  channel: "whatsapp_link" | "email" | "mock";
  rendered_preview: string | null;
  status: "voorbereid" | "gekopieerd" | "geopend_in_whatsapp" | "verzonden_bevestigd" | "mislukt";
  sent_by: string | null;
  created_at: string;
  updated_at: string;
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
      leads: TableDef<LeadRow>;
      lead_activities: TableDef<LeadActivityRow>;
      participants: TableDef<ParticipantRow>;
      participant_consents: TableDef<ParticipantConsentRow>;
      alumni_memberships: TableDef<AlumniMembershipRow>;
      message_templates: TableDef<MessageTemplateRow>;
      message_deliveries: TableDef<MessageDeliveryRow>;
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
      submit_public_lead: {
        Args: {
          retreat_public_slug: string;
          lead_name: string;
          lead_email: string | null;
          lead_phone: string | null;
          lead_desired_period: string | null;
          lead_message: string | null;
          lead_whatsapp_consent: boolean;
          lead_marketing_consent: boolean;
          lead_platform_matching_consent: boolean;
        };
        Returns: undefined;
      };
      list_platform_matching_candidates: {
        Args: Record<string, never>;
        Returns: PlatformMatchingCandidateRow[];
      };
      list_platform_matching_retreats: {
        Args: Record<string, never>;
        Returns: PlatformMatchingRetreatRow[];
      };
      introduce_lead_to_retreat: {
        Args: { source_lead_id: string; target_retreat_id: string };
        Returns: LeadRow;
      };
      platform_overview_stats: {
        Args: Record<string, never>;
        Returns: PlatformOverviewStatsRow[];
      };
    };
  };
};
