import type { ReactNode } from "react";
import { companyColor } from "@/lib/format";

/** Kategorialer Farbpunkt eines Unternehmens (Identität, feste Slot-Reihenfolge). */
export function CompanyDot({ slot }: { slot: number }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: companyColor(slot) }}
    />
  );
}

type Tone = "neutral" | "good" | "bad" | "warn" | "accent";

const toneClass: Record<Tone, string> = {
  neutral: "border-line text-ink2",
  good: "border-[color:var(--good)] text-good",
  bad: "border-[color:var(--bad)] text-bad",
  warn: "border-[color:var(--warn)] text-ink2",
  accent: "border-[color:var(--accent)] text-accent",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-4 ${toneClass[tone]}`}>
      {children}
    </span>
  );
}

/** Status immer mit Icon + Text — Farbe trägt nie allein die Bedeutung. */
export function StatusBadge({ status }: { status: string }) {
  if (["Live", "Veröffentlicht", "Erledigt", "Aktiv", "Beantwortet", "Gesendet"].includes(status)) {
    return <Badge tone="good">✓ {status}</Badge>;
  }
  if (status === "Abgelehnt" || status === "Verloren" || status === "Verworfen") {
    return <Badge tone="bad">✕ {status}</Badge>;
  }
  return <Badge>{status}</Badge>;
}

/**
 * Stat-Kachel nach dataviz-Kontrakt: Label (Satzform) · Wert (semibold,
 * proportionale Ziffern) · optionales Delta (vorzeichenbehaftet, Farbe =
 * Richtung × „ist hoch gut?") · optionaler Zusatz.
 */
export function StatTile({
  label,
  value,
  delta,
  deltaGood,
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaGood?: boolean;
  hint?: string;
}) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight">{value}</span>
        {delta && <span className={`text-xs font-medium ${deltaGood ? "text-good" : "text-bad"}`}>{delta}</span>}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-ink2">{sub}</p>}
      </div>
      {children}
    </header>
  );
}

/** Einklappbares Formular-Panel („+ Hinzufügen"). */
export function AddPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="card group">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-accent">
        + {label}
      </summary>
      <div className="border-t px-4 py-4 hairline">{children}</div>
    </details>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ink2">
      {label}
      {children}
    </label>
  );
}

export function SubmitButton({ children = "Speichern" }: { children?: ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
    >
      {children}
    </button>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="card px-4 py-8 text-center text-sm text-muted">{text}</div>;
}
