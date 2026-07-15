const int = new Intl.NumberFormat("de-DE");
const compact = new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 1 });
const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function fmtInt(n: number | null | undefined): string {
  return n == null ? "–" : int.format(n);
}

export function fmtCompact(n: number | null | undefined): string {
  return n == null ? "–" : compact.format(n);
}

export function fmtEur(n: number | null | undefined): string {
  return n == null ? "–" : eur.format(n);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Kategorialer Farb-Slot (feste Reihenfolge) für ein Unternehmen. */
export function companyColor(slot: number): string {
  const s = ((slot - 1) % 8) + 1;
  return `var(--c${s})`;
}

export const BACKLINK_STATUS = [
  "Idee",
  "Recherche",
  "Kontaktiert",
  "Verhandlung",
  "Platziert",
  "Live",
  "Abgelehnt",
  "Verloren",
] as const;

export const CONTENT_STATUS = ["Idee", "Briefing", "Entwurf", "Review", "Veröffentlicht"] as const;

export const CAMPAIGN_STATUS = ["Geplant", "Aktiv", "Pausiert", "Beendet"] as const;

export const TASK_STATUS = ["Offen", "In Arbeit", "Erledigt"] as const;

export const INTEGRATION_STATUS = ["Fehlt", "In Einrichtung", "Aktiv"] as const;

export const OUTREACH_STATUS = ["Entwurf", "Genehmigt", "Gesendet", "Beantwortet", "Verworfen"] as const;

/** Kanal-Taxonomie der Engine inkl. Rechts-Gate-Hinweis (§7 UWG). */
export const CHANNEL_LABELS: Record<string, string> = {
  journalist: "Journalistenanfrage · auto-versendbar",
  email_int: "E-Mail international · auto per Schalter",
  email_bestand: "E-Mail Bestandskontakt · auto-versendbar",
  formular: "Kontaktformular · manuell einreichen",
  telefon: "Telefon · Gesprächsleitfaden",
  registrierung: "Verzeichnis-Registrierung",
};

export const BACKLINK_TYPES = [
  "Verzeichnis",
  "Gastbeitrag",
  "Presse/PR",
  "Partner/Verein",
  "Sponsoring",
  "Linkable Asset",
  "Forum/Community",
  "Sonstiges",
] as const;

export const CONTENT_FORMATS = ["Blogartikel", "Ratgeber", "Landingpage", "Tool/Rechner", "FAQ", "Video"] as const;

export const TASK_AREAS = ["Technik", "Content", "Backlinks", "Local SEO", "Ads", "Reporting", "Sonstiges"] as const;

export const INTENTS = ["Lokal", "Informational", "Transaktional", "Navigational"] as const;

export const PRIORITIES = ["Hoch", "Mittel", "Niedrig"] as const;
