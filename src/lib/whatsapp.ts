/**
 * Alleen link-generatie voor `wa.me` (zie docs/whatsapp-strategy.md,
 * `WhatsAppLinkProvider`) -- geen API-call naar Meta, geen verzending vanuit
 * de server. Neemt aan dat het nummer een Nederlands mobiel nummer is
 * (product is bewust NL-only, zie docs/product-requirements.md), maar werkt
 * ook voor al-internationale nummers.
 */
export function formatWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `31${digits.slice(1)}`;
  return digits;
}

export function buildWaLink(phone: string, message: string): string | null {
  const number = formatWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
