import { listCompanies, listContent } from "@/lib/db";
import { createContent } from "@/app/actions";
import { AddPanel, Badge, CompanyDot, Field, PageHeader, SubmitButton } from "@/components/ui";
import { FilterBar } from "@/components/FilterBar";
import { StatusSelect } from "@/components/StatusSelect";
import { DeleteButton } from "@/components/DeleteButton";
import { CONTENT_FORMATS, CONTENT_STATUS, fmtDate } from "@/lib/format";
import type { ContentItem } from "@/lib/db";

export const dynamic = "force-dynamic";

function ContentCard({ item, showCompany }: { item: ContentItem; showCompany: boolean }) {
  return (
    <div className="card px-3 py-2.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-[13px] font-medium leading-snug" title={item.title}>
          {item.title}
        </div>
        <DeleteButton kind="content" id={item.id} label={item.title} />
      </div>
      {showCompany && (
        <div className="mt-1 flex items-center gap-1 text-muted">
          <CompanyDot slot={item.color_slot} />
          {item.company_name.split(" ")[0]}
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge>{item.format}</Badge>
        {item.planned_date && <Badge>{fmtDate(item.planned_date)}</Badge>}
      </div>
      {item.target_keyword && (
        <div className="mt-1.5 truncate text-muted" title={item.target_keyword}>
          → {item.target_keyword}
        </div>
      )}
      {item.published_url && (
        <a href={item.published_url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-accent hover:underline">
          {item.published_url}
        </a>
      )}
      {item.notes && (
        <div className="mt-1.5 line-clamp-2 text-ink2" title={item.notes}>
          {item.notes}
        </div>
      )}
      <div className="mt-2">
        <StatusSelect kind="content" id={item.id} value={item.status} options={CONTENT_STATUS} />
      </div>
    </div>
  );
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ firma?: string }> }) {
  const { firma } = await searchParams;
  const companyId = firma ? Number(firma) : undefined;
  const companies = listCompanies();
  const items = listContent(companyId);
  const showCompany = !companyId && companies.length > 1;

  return (
    <div>
      <PageHeader
        title="Content-Pipeline"
        sub="Von der Idee bis zur Veröffentlichung — produziert wird mit claude-blog (/blog write), Qualität sichert der Review-Schritt."
      />
      <FilterBar companies={companies} current={companyId} basePath="/content" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {CONTENT_STATUS.map((status) => {
          const column = items.filter((i) => i.status === status);
          return (
            <div key={status} className="min-w-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink2">{status}</span>
                <span className="text-xs text-muted">{column.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {column.map((i) => (
                  <ContentCard key={i.id} item={i} showCompany={showCompany} />
                ))}
                {column.length === 0 && (
                  <div className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted hairline">leer</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <AddPanel label="Content-Idee anlegen">
          <form action={createContent} className="grid gap-3 md:grid-cols-3">
            <Field label="Unternehmen *">
              <select name="company_id" required defaultValue={companyId ?? companies[0]?.id}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Titel / Arbeitstitel *">
              <input name="title" required placeholder="z. B. Verhinderungspflege beantragen: Anleitung" />
            </Field>
            <Field label="Ziel-Keyword">
              <input name="target_keyword" placeholder="verhinderungspflege beantragen" />
            </Field>
            <Field label="Format">
              <select name="format">
                {CONTENT_FORMATS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </Field>
            <Field label="Geplant für">
              <input name="planned_date" type="date" />
            </Field>
            <Field label="Notizen / Briefing-Stichpunkte">
              <input name="notes" />
            </Field>
            <div className="flex items-end md:col-span-3">
              <SubmitButton>Idee anlegen</SubmitButton>
            </div>
          </form>
        </AddPanel>
      </div>

      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
        Workflow-Tipp: Briefing mit <code>/blog brief</code>, Artikel mit <code>/blog write</code>, Qualitätscheck mit{" "}
        <code>/blog analyze</code> (90/100-Gate), danach hier auf „Review“ und nach Freigabe auf „Veröffentlicht“ setzen.
        Linkable Assets (Rechner, Statistik-Seiten) sind die Content-Stücke, die passiv Backlinks verdienen.
      </p>
    </div>
  );
}
