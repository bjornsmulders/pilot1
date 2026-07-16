const AMSTERDAM_TZ = "Europe/Amsterdam";

/**
 * Alle timestamps liggen in de database in UTC. Deze helpers zetten ze om naar
 * Europe/Amsterdam voor weergave — nooit andersom opslaan.
 */
export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: AMSTERDAM_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatDateShort(value: string | Date) {
  return formatDate(value, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: AMSTERDAM_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateRange(start: string | Date, end: string | Date) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatCurrencyEUR(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatPercentage(value: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}
