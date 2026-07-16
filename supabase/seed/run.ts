/**
 * Seeddata voor de JourneyOS-pilot: drie organisaties met realistische,
 * fictieve gegevens (zie docs/pilot-setup.md en opdracht-sectie 12).
 *
 * Gebruikt de service-role key en omzeilt daarmee bewust RLS -- dit script mag
 * NOOIT tegen een productieproject draaien. Vereist NEXT_PUBLIC_SUPABASE_URL en
 * SUPABASE_SERVICE_ROLE_KEY in .env.local (npm run db:seed laadt dat bestand).
 *
 * Idempotent-ish: draait op basis van vaste e-mailadressen/slugs, dus een
 * tweede run faalt op unique constraints in plaats van dubbele data aan te
 * maken. Voor een schone herstart: `supabase db reset` en dan opnieuw seeden.
 */
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Ontbrekende env-vars: NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn vereist. " +
      "Zie docs/pilot-setup.md."
  );
  process.exit(1);
}

// Geen Database-generic hier: het seedscript raakt bewust ook tabellen die nog
// niet in src/lib/supabase/database.types.ts staan (die bevat vooralsnog alleen
// de slice-1 tabellen). Zie de kanttekening bovenaan dat bestand.
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_PASSWORD = "JourneyOS-Pilot-2026!";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function newToken() {
  return randomBytes(32).toString("base64url");
}

async function ensureUser(email: string, fullName: string) {
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) return found.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    throw new Error(`Kon gebruiker ${email} niet aanmaken: ${error?.message}`);
  }
  return data.user.id;
}

async function upsertOrganization(input: {
  name: string;
  slug: string;
  country: string;
  contactEmail: string;
  ownerId: string;
}) {
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      country: input.country,
      contact_email: input.contactEmail,
      created_by: input.ownerId,
    })
    .select("id")
    .single();

  if (error || !org) throw new Error(`Organisatie ${input.name} aanmaken mislukt: ${error?.message}`);

  await supabase.from("organization_members").insert({
    organization_id: org.id,
    profile_id: input.ownerId,
    role: "owner",
    status: "actief",
  });

  return org.id as string;
}

async function addMember(organizationId: string, profileId: string, role: string) {
  await supabase
    .from("organization_members")
    .upsert(
      { organization_id: organizationId, profile_id: profileId, role, status: "actief" },
      { onConflict: "organization_id,profile_id" }
    );
}

async function insertRetreat(organizationId: string, retreat: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("retreats")
    .insert({ organization_id: organizationId, ...retreat })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Retreat aanmaken mislukt: ${error?.message}`);
  return data.id as string;
}

const DEFAULT_MESSAGE_TEMPLATES: { key: string; name: string; body: string }[] = [
  { key: "welkom", name: "Welkom", body: "Hoi {{voornaam}}, welkom bij {{retreat}}! Fijn dat je erbij bent." },
  {
    key: "onboarding_invullen",
    name: "Onboarding invullen",
    body: "Hoi {{voornaam}}, wil je je onboarding voor {{retreat}} invullen via {{onboarding_link}}? Kost je 5 minuten.",
  },
  {
    key: "reisgegevens_ontbreken",
    name: "Reisgegevens ontbreken",
    body: "Hoi {{voornaam}}, we missen nog je reisgegevens voor {{retreat}}. Kun je die aanvullen via {{onboarding_link}}?",
  },
  {
    key: "dieetwensen_ontbreken",
    name: "Dieetwensen ontbreken",
    body: "Hoi {{voornaam}}, heb je nog dieetwensen of allergieën die we moeten weten voor {{retreat}}?",
  },
  {
    key: "betaling_ontbreekt",
    name: "Betaling ontbreekt",
    body: "Hoi {{voornaam}}, we zien nog een openstaand bedrag voor {{retreat}}. Kun je dit binnenkort regelen?",
  },
  {
    key: "programma_gewijzigd",
    name: "Programma gewijzigd",
    body: "Hoi {{voornaam}}, het programma van {{retreat}} is licht gewijzigd. Check de laatste versie in je onboarding.",
  },
  { key: "eten_is_klaar", name: "Eten is klaar", body: "Het eten is klaar! Kom naar de eetzaal 🍽️" },
  {
    key: "activiteit_start_binnenkort",
    name: "Activiteit start binnenkort",
    body: "De volgende activiteit begint over 15 minuten bij {{locatie}}.",
  },
  {
    key: "feedback_invullen",
    name: "Feedback invullen",
    body: "Hoi {{voornaam}}, wat vond je van {{retreat}}? We horen graag je feedback: {{feedback_link}}.",
  },
  {
    key: "fotoalbum_delen",
    name: "Fotoalbum delen",
    body: "De foto's van {{retreat}} staan online: {{album_link}}. Geniet van de herinneringen!",
  },
  {
    key: "early_access_volgend_retreat",
    name: "Early access volgend retreat",
    body: "Hoi {{voornaam}}, als oud-deelnemer mag jij als eerste inschrijven voor ons volgende retreat: {{retreat_link}}.",
  },
  {
    key: "uitnodiging_alumni_event",
    name: "Uitnodiging alumni-event",
    body: "Hoi {{voornaam}}, we organiseren een alumni-event op {{datum}}. Leuk als je erbij bent!",
  },
  {
    key: "referralverzoek",
    name: "Referralverzoek",
    body: "Hoi {{voornaam}}, ken je iemand die ook baat zou hebben bij {{retreat}}? Deel je referralcode: {{referral_link}}.",
  },
];

async function seedMessageTemplates(organizationId: string) {
  const rows = DEFAULT_MESSAGE_TEMPLATES.map((t) => ({
    organization_id: organizationId,
    key: t.key,
    name: t.name,
    channel: "whatsapp",
    body: t.body,
    is_default: true,
  }));
  await supabase.from("message_templates").upsert(rows, { onConflict: "organization_id,key" });
}

async function seedOrg1() {
  console.log("Seed organisatie 1: Stille Kracht Retreats (Mallorca)");

  const ownerId = await ensureUser("elena@stillekracht.nl", "Elena de Groot");
  const adminId = await ensureUser("marco@stillekracht.nl", "Marco Jansen");
  const orgId = await upsertOrganization({
    name: "Stille Kracht Retreats",
    slug: "stille-kracht-retreats",
    country: "Nederland",
    contactEmail: "info@stillekracht.nl",
    ownerId,
  });
  await addMember(orgId, adminId, "admin");
  await seedMessageTemplates(orgId);

  const upcomingRetreatId = await insertRetreat(orgId, {
    title: "Mallorca Voorjaarsretreat 2026",
    description: "Een week rust, yoga en reflectie in de heuvels van Mallorca.",
    location: "Sóller, Mallorca",
    country: "Spanje",
    start_date: "2026-05-10",
    end_date: "2026-05-17",
    capacity: 30,
    price_per_person: 2400,
    status: "inschrijving_open",
    enrollment_visibility: "openbaar",
    booking_deadline: "2026-04-10",
    created_by: ownerId,
  });

  await insertRetreat(orgId, {
    title: "Mallorca Najaarsretreat 2026",
    description: "Herfstretreat met gastspreker Naomi Reijnders over veerkracht.",
    location: "Sóller, Mallorca",
    country: "Spanje",
    start_date: "2026-10-04",
    end_date: "2026-10-11",
    capacity: 30,
    price_per_person: 2450,
    status: "concept",
    enrollment_visibility: "besloten",
    booking_deadline: "2026-09-04",
    created_by: ownerId,
  });

  const pastRetreatId = await insertRetreat(orgId, {
    title: "Mallorca Retreat 2025",
    description: "Afgerond retreat -- bron voor alumni en referrals.",
    location: "Sóller, Mallorca",
    country: "Spanje",
    start_date: "2025-05-12",
    end_date: "2025-05-19",
    capacity: 28,
    price_per_person: 2300,
    status: "afgerond",
    enrollment_visibility: "besloten",
    created_by: ownerId,
  });

  // Leads voor het voorjaarsretreat -- diverse statussen en bronnen.
  const leadsData = [
    { name: "Sanne Verhoeven", email: "sanne.verhoeven@example.com", status: "warm", source: "instagram" },
    { name: "Bram Koster", email: "bram.koster@example.com", status: "gesprek_gepland", source: "website" },
    { name: "Fatima El Idrissi", email: "fatima.elidrissi@example.com", status: "nieuw", source: "referral" },
    { name: "Willem Bakker", email: "willem.bakker@example.com", status: "geinteresseerd", source: "website" },
    { name: "Nina Peters", email: "nina.peters@example.com", status: "verloren", source: "instagram" },
    { name: "Diederik van Es", email: "diederik.vanes@example.com", status: "geboekt", source: "website" },
  ];
  for (const lead of leadsData) {
    const { data: leadRow } = await supabase
      .from("leads")
      .insert({
        organization_id: orgId,
        retreat_id: upcomingRetreatId,
        name: lead.name,
        email: lead.email,
        phone: "+31 6 1234 5678",
        source: lead.source,
        desired_period: "Mei 2026",
        destination: "Mallorca",
        budget_range: "€2000 - €2500",
        party_size: 1,
        whatsapp_consent: true,
        marketing_consent: false,
        status: lead.status,
        follow_up_date: "2026-02-01",
        score: lead.status === "warm" ? 40 : lead.status === "gesprek_gepland" ? 60 : 10,
        created_by: ownerId,
      })
      .select("id")
      .single();

    if (leadRow) {
      await supabase.from("lead_activities").insert({
        lead_id: leadRow.id,
        organization_id: orgId,
        activity_type: "interesseformulier_ingevuld",
        description: "Lead heeft het publieke interesseformulier ingevuld.",
        score_delta: 10,
        created_by: ownerId,
      });
    }
  }

  // Deelnemers voor het voorjaarsretreat: bewust een mix van volledige en
  // onvolledige onboarding, zodat "ontbrekende gegevens" zichtbaar is.
  const participants = [
    { name: "Lotte Hermans", email: "lotte.hermans@example.com", booking: "bevestigd", payment: "betaald", onboarding: "voltooid", diet: true, travel: true, room: true },
    { name: "Sven de Wit", email: "sven.dewit@example.com", booking: "bevestigd", payment: "gedeeltelijk_betaald", onboarding: "gestart", diet: true, travel: false, room: false },
    { name: "Amara Osei", email: "amara.osei@example.com", booking: "gereserveerd", payment: "niet_betaald", onboarding: "niet_gestart", diet: false, travel: false, room: false },
    { name: "Tobias Meijer", email: "tobias.meijer@example.com", booking: "bevestigd", payment: "betaald", onboarding: "voltooid", diet: true, travel: true, room: true },
    { name: "Julia Vos", email: "julia.vos@example.com", booking: "optie", payment: "niet_betaald", onboarding: "niet_gestart", diet: false, travel: false, room: false },
    { name: "Ruben Dijkstra", email: "ruben.dijkstra@example.com", booking: "bevestigd", payment: "betaald", onboarding: "gestart", diet: true, travel: true, room: false },
    { name: "Emma Willems", email: "emma.willems@example.com", booking: "bevestigd", payment: "betaald", onboarding: "voltooid", diet: true, travel: true, room: true },
  ];

  const roomTypeId = (
    await supabase
      .from("room_types")
      .insert({
        organization_id: orgId,
        retreat_id: upcomingRetreatId,
        name: "Tweepersoonskamer met terras",
        capacity: 2,
        description: "Standaardkamer met uitzicht op de olijfgaarden.",
      })
      .select("id")
      .single()
  ).data?.id as string;

  let roomCounter = 1;
  for (const p of participants) {
    const { data: participantRow } = await supabase
      .from("participants")
      .insert({
        organization_id: orgId,
        retreat_id: upcomingRetreatId,
        full_name: p.name,
        email: p.email,
        phone: "+31 6 9876 5432",
        booking_status: p.booking,
        payment_status: p.payment,
        onboarding_status: p.onboarding,
        invitation_status: p.onboarding === "niet_gestart" ? "verzonden" : "voltooid",
        source: "website",
        created_by: ownerId,
      })
      .select("id")
      .single();

    if (!participantRow) continue;
    const participantId = participantRow.id as string;

    await supabase.from("participant_consents").insert([
      {
        participant_id: participantId,
        organization_id: orgId,
        consent_type: "verwerking_uitvoering",
        granted: true,
        source: "onboardingformulier",
        policy_version: "2026-01",
        granted_at: new Date().toISOString(),
      },
      {
        participant_id: participantId,
        organization_id: orgId,
        consent_type: "marketing_journeyos",
        granted: false,
        source: "onboardingformulier",
        policy_version: "2026-01",
      },
    ]);

    const token = newToken();
    await supabase.from("participant_invites").insert({
      participant_id: participantId,
      organization_id: orgId,
      token_hash: hashToken(token),
      status: p.onboarding === "voltooid" ? "gebruikt" : "actief",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      issued_by: ownerId,
      used_at: p.onboarding === "voltooid" ? new Date().toISOString() : null,
    });

    if (p.diet) {
      await supabase.from("dietary_requirements").insert({
        participant_id: participantId,
        organization_id: orgId,
        diet_type: "Vegetarisch",
        allergies: "Noten",
      });
    }

    if (p.travel) {
      await supabase.from("travel_plans").insert({
        participant_id: participantId,
        organization_id: orgId,
        transport_type: "vliegtuig",
        departure_location: "Eindhoven",
        airport: "Eindhoven Airport (EIN)",
        flight_number: "HV5321",
        arrival_time: "2026-05-10T14:20:00Z",
        departure_time: "2026-05-17T18:40:00Z",
        carpool_offered: true,
        carpool_requested: false,
      });
    }

    if (p.room && roomTypeId) {
      const { data: room } = await supabase
        .from("rooms")
        .upsert(
          {
            room_type_id: roomTypeId,
            retreat_id: upcomingRetreatId,
            organization_id: orgId,
            name: `Kamer ${roomCounter}`,
            capacity: 2,
          },
          { onConflict: "retreat_id,name" }
        )
        .select("id")
        .single();
      roomCounter += 1;

      if (room) {
        await supabase.from("room_assignments").upsert(
          { room_id: room.id, participant_id: participantId, organization_id: orgId },
          { onConflict: "participant_id" }
        );
      }
    }

    if (p.payment !== "niet_betaald") {
      await supabase.from("payments").insert({
        organization_id: orgId,
        participant_id: participantId,
        retreat_id: upcomingRetreatId,
        type: p.payment === "betaald" ? "volledige_betaling" : "aanbetaling",
        amount: p.payment === "betaald" ? 2400 : 500,
        status: p.payment,
        provider: "handmatig",
        paid_at: new Date().toISOString(),
        created_by: ownerId,
      });
    }
  }

  // Alumni + referrals vanuit het afgeronde retreat van 2025.
  const { data: alumnusParticipant } = await supabase
    .from("participants")
    .insert({
      organization_id: orgId,
      retreat_id: pastRetreatId,
      full_name: "Isabel Groen",
      email: "isabel.groen@example.com",
      phone: "+31 6 1111 2222",
      booking_status: "aanwezig",
      payment_status: "betaald",
      onboarding_status: "voltooid",
      invitation_status: "voltooid",
      is_alumnus: true,
      source: "website",
      created_by: ownerId,
    })
    .select("id")
    .single();

  if (alumnusParticipant) {
    await supabase.from("alumni_memberships").insert({
      organization_id: orgId,
      participant_id: alumnusParticipant.id,
      home_region: "Noord-Brabant",
      interests: ["yoga", "schrijven", "wandelen"],
      became_alumnus_at: "2025-05-19T00:00:00Z",
      status: "actief",
    });

    const { data: referralCode } = await supabase
      .from("referral_codes")
      .insert({
        organization_id: orgId,
        participant_id: alumnusParticipant.id,
        code: "ISABEL10",
      })
      .select("id")
      .single();

    if (referralCode) {
      const { data: referredLead } = await supabase
        .from("leads")
        .insert({
          organization_id: orgId,
          retreat_id: upcomingRetreatId,
          name: "Petra Smeets",
          email: "petra.smeets@example.com",
          source: "referral",
          status: "warm",
          whatsapp_consent: true,
          marketing_consent: false,
          score: 20,
          created_by: ownerId,
        })
        .select("id")
        .single();

      if (referredLead) {
        await supabase.from("referrals").insert({
          organization_id: orgId,
          referral_code_id: referralCode.id,
          referrer_participant_id: alumnusParticipant.id,
          referred_lead_id: referredLead.id,
          status: "geregistreerd",
        });
      }
    }
  }
}

async function seedOrg2() {
  console.log("Seed organisatie 2: Bosrand Retreats (kleinschalig, veel retreats)");

  const ownerId = await ensureUser("youssef@bosrandretreats.nl", "Youssef El Amrani");
  const coordinatorId = await ensureUser("hanneke@bosrandretreats.nl", "Hanneke Smit");
  const orgId = await upsertOrganization({
    name: "Bosrand Retreats",
    slug: "bosrand-retreats",
    country: "Nederland",
    contactEmail: "info@bosrandretreats.nl",
    ownerId,
  });
  await addMember(orgId, coordinatorId, "coordinator");
  await seedMessageTemplates(orgId);

  const retreatDefs = [
    { title: "Weekendretreat Veluwe -- Maart", start: "2026-03-06", end: "2026-03-08", capacity: 8, price: 395, status: "inschrijving_open" },
    { title: "Midweek Ardennen -- April", start: "2026-04-13", end: "2026-04-17", capacity: 6, price: 690, status: "bijna_vol" },
    { title: "Weekendretreat Veluwe -- Juni", start: "2026-06-05", end: "2026-06-07", capacity: 8, price: 395, status: "concept" },
  ];

  let assignedRetreatId: string | null = null;
  for (const [index, r] of retreatDefs.entries()) {
    const retreatId = await insertRetreat(orgId, {
      title: r.title,
      description: "Kleinschalig retreat met persoonlijke aandacht.",
      location: index === 1 ? "Ardennen, België" : "Veluwe, Nederland",
      country: index === 1 ? "België" : "Nederland",
      start_date: r.start,
      end_date: r.end,
      capacity: r.capacity,
      price_per_person: r.price,
      status: r.status,
      enrollment_visibility: "openbaar",
      created_by: ownerId,
    });
    if (index === 0) assignedRetreatId = retreatId;

    // Een paar deelnemers per klein retreat.
    for (let i = 1; i <= 3; i += 1) {
      await supabase.from("participants").insert({
        organization_id: orgId,
        retreat_id: retreatId,
        full_name: `Deelnemer ${i} - ${r.title}`,
        email: `deelnemer${i}.${index}@example.com`,
        booking_status: i === 1 ? "bevestigd" : "optie",
        payment_status: i === 1 ? "betaald" : "niet_betaald",
        onboarding_status: i === 1 ? "voltooid" : "niet_gestart",
        invitation_status: i === 1 ? "voltooid" : "niet_verzonden",
        source: "instagram",
        created_by: ownerId,
      });
    }
  }

  if (assignedRetreatId) {
    await supabase.from("retreat_team_members").upsert(
      { retreat_id: assignedRetreatId, organization_id: orgId, profile_id: coordinatorId, role: "coordinator" },
      { onConflict: "retreat_id,profile_id" }
    );
  }

  const leadRow = await supabase
    .from("leads")
    .insert({
      organization_id: orgId,
      name: "Karlijn Mulder",
      email: "karlijn.mulder@example.com",
      source: "instagram",
      desired_period: "Voorjaar 2026",
      destination: "Veluwe",
      status: "nieuw",
      whatsapp_consent: true,
      marketing_consent: true,
      score: 5,
      created_by: ownerId,
    })
    .select("id")
    .single();

  if (leadRow.data) {
    await supabase.from("lead_activities").insert({
      lead_id: leadRow.data.id,
      organization_id: orgId,
      activity_type: "interesseformulier_ingevuld",
      score_delta: 5,
      created_by: ownerId,
    });
  }
}

async function seedOrg3() {
  console.log("Seed organisatie 3: Tenantisolatie Testorganisatie");

  const ownerId = await ensureUser("owner@tenant-test.dev", "Tenant Test Owner");
  const orgId = await upsertOrganization({
    name: "Tenantisolatie Testorganisatie",
    slug: "tenantisolatie-test",
    country: "Nederland",
    contactEmail: "owner@tenant-test.dev",
    ownerId,
  });

  const retreatId = await insertRetreat(orgId, {
    title: "Testretreat (niet zichtbaar voor andere organisaties)",
    description: "Uitsluitend voor geautomatiseerde tenantisolatietests.",
    location: "Utrecht",
    country: "Nederland",
    start_date: "2026-08-01",
    end_date: "2026-08-03",
    capacity: 5,
    price_per_person: 100,
    status: "concept",
    created_by: ownerId,
  });

  await supabase.from("leads").insert({
    organization_id: orgId,
    retreat_id: retreatId,
    name: "Test Lead",
    email: "test.lead@tenant-test.dev",
    status: "nieuw",
    whatsapp_consent: false,
    marketing_consent: false,
    score: 0,
    created_by: ownerId,
  });

  await supabase.from("participants").insert({
    organization_id: orgId,
    retreat_id: retreatId,
    full_name: "Test Deelnemer",
    email: "test.deelnemer@tenant-test.dev",
    booking_status: "optie",
    payment_status: "niet_betaald",
    onboarding_status: "niet_gestart",
    invitation_status: "niet_verzonden",
    created_by: ownerId,
  });
}

async function main() {
  await seedOrg1();
  await seedOrg2();
  await seedOrg3();
  console.log("\nSeed voltooid. Alle seedgebruikers hebben wachtwoord:", SEED_PASSWORD);
  console.log("Log bijvoorbeeld in als elena@stillekracht.nl om organisatie 1 te bekijken.");
}

main().catch((error) => {
  console.error("Seed mislukt:", error);
  process.exit(1);
});
