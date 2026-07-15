import Link from "next/link";
import { globalStats, listCompaniesWithStats, listTasks } from "@/lib/db";
import { StatTile, CompanyDot, Badge, PageHeader } from "@/components/ui";
import { fmtInt, fmtEur, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function Home() {
  const stats = globalStats();
  const companies = listCompaniesWithStats();
  const openTasks = listTasks()
    .filter((t) => t.status !== "Erledigt")
    .slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Übersicht"
        sub="Alle Unternehmen, Pipelines und anstehenden Aufgaben auf einen Blick."
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Unternehmen" value={fmtInt(stats.companies)} />
        <StatTile label="Keywords in Top 10" value={fmtInt(stats.top10)} hint={`von ${fmtInt(stats.keywords)} getrackt`} />
        <StatTile label="Backlinks live" value={fmtInt(stats.liveLinks)} hint={`${fmtInt(stats.pipelineLinks)} in Pipeline`} />
        <StatTile label="Content in Arbeit" value={fmtInt(stats.contentOpen)} hint={`${fmtInt(stats.contentPublished)} veröffentlicht`} />
        <StatTile label="Offene Aufgaben" value={fmtInt(stats.tasksOpen)} />
        <StatTile label="Werbebudget je Monat" value={fmtEur(stats.adBudget)} hint="geplant + aktiv" />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Unternehmen</h2>
          <Link href="/unternehmen" className="text-xs text-accent hover:underline">
            Verwalten →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {companies.map((c) => (
            <Link key={c.id} href={`/unternehmen/${c.id}`} className="card block px-4 py-3 hover:border-[color:var(--accent)]">
              <div className="flex items-center gap-2">
                <CompanyDot slot={c.color_slot} />
                <span className="font-medium">{c.name}</span>
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {c.domain} · {c.industry}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink2">
                <span>
                  <span className="font-semibold text-ink">{c.top10_count}</span>/{c.keyword_count} Keywords Top 10
                </span>
                <span>
                  <span className="font-semibold text-ink">{c.live_links}</span> Links live
                </span>
                <span>
                  <span className="font-semibold text-ink">{c.pipeline_links}</span> Links in Pipeline
                </span>
                <span>
                  <span className="font-semibold text-ink">{c.tasks_open}</span> Aufgaben offen
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Nächste Aufgaben</h2>
          <Link href="/aufgaben" className="text-xs text-accent hover:underline">
            Alle Aufgaben →
          </Link>
        </div>
        <div className="card divide-y divide-[color:var(--line)]">
          {openTasks.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted">Keine offenen Aufgaben.</div>}
          {openTasks.map((t) => {
            const overdue = t.due_date != null && t.due_date < today;
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                {t.color_slot != null && <CompanyDot slot={t.color_slot} />}
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <Badge>{t.area}</Badge>
                {t.priority === "Hoch" && <Badge tone="warn">! Hoch</Badge>}
                <span className={`w-20 text-right text-xs ${overdue ? "font-medium text-bad" : "text-muted"}`}>
                  {fmtDate(t.due_date)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
