import { lastEngineRuns, listCompanies, listOutreach } from "@/lib/db";
import { Badge, CompanyDot, EmptyState, PageHeader, StatTile, StatusBadge } from "@/components/ui";
import { FilterBar } from "@/components/FilterBar";
import { StatusSelect } from "@/components/StatusSelect";
import { DeleteButton } from "@/components/DeleteButton";
import { CopyButton } from "@/components/CopyButton";
import { CHANNEL_LABELS, fmtDate, fmtInt, OUTREACH_STATUS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OutreachPage({ searchParams }: { searchParams: Promise<{ firma?: string }> }) {
  const { firma } = await searchParams;
  const companyId = firma ? Number(firma) : undefined;
  const companies = listCompanies();
  const items = listOutreach(companyId);
  const runs = lastEngineRuns(6);

  const drafts = items.filter((i) => i.status === "Entwurf").length;
  const sent = items.filter((i) => i.status === "Gesendet" || i.status === "Beantwortet").length;

  return (
    <div>
      <PageHeader
        title="Outreach-Queue"
        sub="Von der Engine erzeugte Nachrichten. Erlaubte Kanäle versendet sie selbst (AUTO_SEND); alles andere wartet hier auf „Genehmigt“ — oder wird als Telefon-/Formular-Leitfaden abgearbeitet."
      />
      <FilterBar companies={companies} current={companyId} basePath="/outreach" />

      <section className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="Entwürfe warten" value={fmtInt(drafts)} />
        <StatTile label="Gesendet / beantwortet" value={fmtInt(sent)} />
        <StatTile label="Einträge gesamt" value={fmtInt(items.length)} />
      </section>

      {items.length === 0 ? (
        <EmptyState text="Queue ist leer — Engine starten: node engine/run.mjs" />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((i) => (
            <details key={i.id} className="card group">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5 text-sm md:flex-nowrap">
                {i.color_slot != null && <CompanyDot slot={i.color_slot} />}
                <span className="min-w-0 flex-1 truncate font-medium">{i.subject || "(ohne Betreff)"}</span>
                <Badge>{CHANNEL_LABELS[i.channel] ?? i.channel ?? "—"}</Badge>
                {i.language === "en" && <Badge>EN</Badge>}
                <StatusBadge status={i.status} />
                <StatusSelect kind="outreach" id={i.id} value={i.status} options={OUTREACH_STATUS} />
                <DeleteButton kind="outreach" id={i.id} label={i.subject || `Eintrag ${i.id}`} />
              </summary>
              <div className="border-t px-4 py-3 hairline">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>Ziel: {i.source ?? "—"}</span>
                  <span>· erstellt {fmtDate(i.created_at)}</span>
                  {i.sent_at && <span>· gesendet {fmtDate(i.sent_at)}</span>}
                  {i.notes && <span>· {i.notes}</span>}
                  <CopyButton text={i.body} />
                </div>
                <pre className="whitespace-pre-wrap rounded-lg bg-line/30 px-3 py-2 text-xs leading-relaxed">
                  {i.body}
                </pre>
              </div>
            </details>
          ))}
        </div>
      )}

      <section className="card mt-6">
        <div className="border-b px-4 py-2.5 text-sm font-semibold hairline">Letzte Engine-Läufe</div>
        <div className="divide-y divide-[color:var(--line)]">
          {runs.length === 0 && (
            <div className="px-4 py-4 text-sm text-muted">
              Noch kein Lauf protokolliert. Start: <code>node engine/run.mjs</code> (Test: <code>--dry</code>), Automatisierung siehe <code>engine/README.md</code>.
            </div>
          )}
          {runs.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2 text-xs">
              <span className="w-32 shrink-0 text-muted">{r.started_at}</span>
              <Badge>{r.stage}</Badge>
              <span className="min-w-0 flex-1 truncate text-ink2" title={r.summary}>
                {r.summary}
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
        Rechts-Gate: Kalt-E-Mails an deutsche Empfänger versendet die Engine nie selbst (§ 7 UWG) — sie liefert dafür
        Telefon-Leitfäden und Formular-Texte. „Genehmigt“ setzen heißt: bewusste menschliche Entscheidung, auf eigenes Risiko.
      </p>
    </div>
  );
}
