# WhatsApp-strategie (module G)

## Uitgangspunt

JourneyOS bouwt **geen WhatsApp-vervanger** en **geen onofficiële automatisering**.
Geen browserscraping, geen ongeautoriseerde bots, geen automatische analyse van
privégesprekken. WhatsApp blijft het kanaal; JourneyOS is de assistent die de
organisator helpt om sneller, consistenter en zonder kopieerwerk-uit-Excel te
communiceren.

## Wat JourneyOS wél doet

- Berichttemplates beheren (met variabelen zoals `{{voornaam}}`, `{{retreat}}`,
  `{{onboarding_link}}`).
- Een bericht vooraf invullen op basis van een template + deelnemergegevens.
- Een `wa.me`-link genereren met de vooraf ingevulde, correct URL-geëncodeerde tekst.
- Het bericht laten kopiëren en/of WhatsApp (web/app) openen.
- De verzendstatus **handmatig** laten registreren door de organisator
  (`message_deliveries.status`): voorbereid → gekopieerd → geopend in WhatsApp →
  verzonden bevestigd (of mislukt).
- Groepsuitnodigingsteksten en groepsberichten voorbereiden als tekst — het
  daadwerkelijk aanmaken van een WhatsApp-groep gebeurt door de organisator zelf,
  tenzij ooit aantoonbaar officiële toegang (WhatsApp Business/Cloud API)
  beschikbaar is.

## Berichtenassistent (module G, app-laag afgerond)

`/instellingen/berichten` (owner/admin) beheert `message_templates`
(sleutel/naam/kanaal/tekst met `{{voornaam}}`/`{{retreat}}`-variabelen). Op de
lead- en deelnemerdetailpagina kiest een staflid een template; `MessageComposer`
rendert 'm live (`src/lib/messaging.ts`, `renderTemplate`) en toont een "Open in
WhatsApp"-knop (`buildWaLink`). Bij klikken opent de eigen WhatsApp van de
organisator mét vooraf ingevulde tekst, en wordt tegelijk een `message_deliveries`-
rij gelogd (`status = 'geopend_in_whatsapp'`) als handmatige verzendregistratie —
geen automatische deliverystatus, want er is geen WhatsApp-API-koppeling.
Autorisatie is hier strenger dan de RLS-ondergrens: coordinator alleen voor
toegewezen retreats, viewer nooit (zie `docs/security.md`).

## Directe WhatsApp-aanmelding op de openbare retreatpagina

Op `/retreat/[publicSlug]` staat (indien de organisatie een `contact_phone`
heeft ingesteld) een knop "Meld je aan via WhatsApp" naast het interesseformulier
— een kant-en-klare `wa.me/<nummer>?text=<vooraf-ingevulde-tekst>`-link
(`src/lib/whatsapp.ts`, `buildWaLink`). Dezelfde link-only aanpak als de rest van
deze strategie: geen API-call, geen automatische verwerking van het antwoord. Het
interesseformulier zelf vraagt telefoonnummer als verplicht veld (i.p.v.
e-mailadres) omdat dat voor de organisator het bruikbaarste kanaal is.

## Standaardtemplates

Geseed per organisatie (`message_templates`, `is_default = true`), door de
organisator zelf te bewerken: welkom, onboarding invullen, reisgegevens ontbreken,
dieetwensen ontbreken, betaling ontbreekt, programma gewijzigd, eten is klaar,
activiteit start binnenkort, feedback invullen, fotoalbum delen, early access
volgend retreat, uitnodiging alumni-event, referralverzoek.

## `MessageProvider`-interface

```ts
// src/lib/messaging/types.ts
export interface PrepareMessageInput {
  templateKey: string
  variables: Record<string, string>
  recipient: { name: string; phone?: string; email?: string }
}

export interface PreparedMessage {
  body: string           // volledig ingevulde tekst
  channel: 'whatsapp_link' | 'email' | 'mock'
  waLink?: string         // alleen voor whatsapp_link
}

export interface MessageProvider {
  prepareMessage(input: PrepareMessageInput): Promise<PreparedMessage>
  recordDelivery(input: {
    organizationId: string
    participantId?: string
    leadId?: string
    templateId?: string
    channel: PreparedMessage['channel']
    status: 'voorbereid' | 'gekopieerd' | 'geopend_in_whatsapp' | 'verzonden_bevestigd' | 'mislukt'
  }): Promise<void>
}
```

Implementaties (`src/lib/messaging/`):

- **`MockMessageProvider`** — voor tests en lokale ontwikkeling zonder externe
  afhankelijkheden; slaat niets extern op, gebruikt voor Vitest.
- **`WhatsAppLinkProvider`** — bouwt de `wa.me/<nummer>?text=<encoded>`-link. Geen
  verzending, geen API-call naar Meta. Alleen linkgeneratie + status-registratie.
- **`EmailMessageProvider`** — verstuurt via Resend wanneer de organisator e-mail
  kiest in plaats van WhatsApp voor hetzelfde template.

Alle drie implementeren dezelfde interface, zodat de UI en de server actions nooit
weten (of hoeven te weten) welk kanaal actief is.

### Uitbreidbaar naar WhatsApp Cloud API

Wanneer een organisator aantoonbaar officiële toegang heeft (Meta Business
verificatie + WhatsApp Cloud API-token), kan een `WhatsAppCloudApiProvider` worden
toegevoegd die dezelfde `MessageProvider`-interface implementeert en `recordDelivery`
automatisch bijwerkt op basis van échte delivery-webhooks, in plaats van handmatige
registratie. Geen enkele aanroepende code (server actions, UI) hoeft daarvoor te
wijzigen — dat is precies waarom de interface nu al zo is opgezet.

## Wat nooit wordt opgeslagen

- De volledige inhoud van verzonden/ontvangen WhatsApp-berichten.
- Automatisch geanalyseerde gespreksdata.
- Alleen een korte, ingekorte `rendered_preview` (max. 500 tekens) wordt bewaard, en
  uitsluitend zodat de organisator later kan zien wélk bericht bij welke actie hoorde.
