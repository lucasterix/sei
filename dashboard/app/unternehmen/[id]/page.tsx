import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, listBacklinks, listCompaniesWithStats, listContent, listTasks } from "@/lib/db";
import { Badge, CompanyDot, PageHeader, StatTile, StatusBadge } from "@/components/ui";
import { fmtDate, fmtInt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CompanyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = getCompany(Number(id));
  if (!company) notFound();

  const stats = listCompaniesWithStats().find((c) => c.id === company.id)!;
  const tasks = listTasks(company.id).filter((t) => t.status !== "Erledigt").slice(0, 8);
  const backlinks = listBacklinks(company.id);
  const content = listContent(company.id).filter((c) => c.status !== "Veröffentlicht").slice(0, 6);

  const pipelineCounts = new Map<string, number>();
  for (const b of backlinks) pipelineCounts.set(b.status, (pipelineCounts.get(b.status) ?? 0) + 1);

  const quickLinks = [
    { href: `/keywords?firma=${company.id}`, label: "Keywords & Rankings" },
    { href: `/backlinks?firma=${company.id}`, label: "Backlink-Pipeline" },
    { href: `/content?firma=${company.id}`, label: "Content-Pipeline" },
    { href: `/ads?firma=${company.id}`, label: "Kampagnen" },
    { href: `/aufgaben?firma=${company.id}`, label: "Aufgaben" },
  ];

  return (
    <div>
      <PageHeader
        title={company.name}
        sub={`${company.industry} · ${company.locations}`}
      >
        <a
          href={`https://${company.domain}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-accent hover:underline"
        >
          {company.domain} ↗
        </a>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        {quickLinks.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-full border px-3 py-1 text-xs text-ink2 hairline hover:text-accent">
            {l.label} →
          </Link>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Keywords in Top 10" value={fmtInt(stats.top10_count)} hint={`von ${fmtInt(stats.keyword_count)} getrackt`} />
        <StatTile label="Backlinks live" value={fmtInt(stats.live_links)} hint={`${fmtInt(stats.pipeline_links)} in Pipeline`} />
        <StatTile label="Content in Arbeit" value={fmtInt(stats.content_open)} />
        <StatTile label="Offene Aufgaben" value={fmtInt(stats.tasks_open)} />
      </section>

      {company.notes && (
        <section className="card mt-4 px-4 py-3 text-sm text-ink2">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Profil-Notizen</div>
          {company.notes}
        </section>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card">
          <div className="border-b px-4 py-2.5 text-sm font-semibold hairline">Nächste Aufgaben</div>
          <div className="divide-y divide-[color:var(--line)]">
            {tasks.length === 0 && <div className="px-4 py-5 text-center text-sm text-muted">Keine offenen Aufgaben.</div>}
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 px-4 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate" title={t.notes || t.title}>
                  {t.title}
                </span>
                <Badge>{t.area}</Badge>
                <span className="w-20 text-right text-xs text-muted">{fmtDate(t.due_date)}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="card">
            <div className="border-b px-4 py-2.5 text-sm font-semibold hairline">Backlink-Pipeline</div>
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {backlinks.length === 0 && <span className="text-sm text-muted">Noch keine Linkziele erfasst.</span>}
              {[...pipelineCounts.entries()].map(([status, count]) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  <StatusBadge status={status} />
                  <span className="text-xs font-medium">{count}</span>
                </span>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="border-b px-4 py-2.5 text-sm font-semibold hairline">Content in Arbeit</div>
            <div className="divide-y divide-[color:var(--line)]">
              {content.length === 0 && <div className="px-4 py-5 text-center text-sm text-muted">Nichts in Arbeit.</div>}
              {content.map((ci) => (
                <div key={ci.id} className="flex items-center gap-2 px-4 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{ci.title}</span>
                  <Badge>{ci.format}</Badge>
                  <StatusBadge status={ci.status} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
