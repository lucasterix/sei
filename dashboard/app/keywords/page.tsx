import { keywordHistory, listCompanies, listKeywords } from "@/lib/db";
import { createKeyword, recordPosition } from "@/app/actions";
import { AddPanel, Badge, CompanyDot, EmptyState, Field, PageHeader, SubmitButton } from "@/components/ui";
import { FilterBar } from "@/components/FilterBar";
import { Sparkline } from "@/components/Sparkline";
import { DeleteButton } from "@/components/DeleteButton";
import { fmtCompact, INTENTS, PRIORITIES } from "@/lib/format";

export const dynamic = "force-dynamic";

function Delta({ latest, prev }: { latest: number | null; prev: number | null }) {
  if (latest == null || prev == null) return <span className="text-xs text-muted">–</span>;
  const diff = prev - latest; // Position kleiner = besser
  if (diff === 0) return <span className="text-xs text-muted">±0</span>;
  return diff > 0 ? (
    <span className="text-xs font-medium text-good">▲ {diff}</span>
  ) : (
    <span className="text-xs font-medium text-bad">▼ {Math.abs(diff)}</span>
  );
}

export default async function KeywordsPage({ searchParams }: { searchParams: Promise<{ firma?: string }> }) {
  const { firma } = await searchParams;
  const companyId = firma ? Number(firma) : undefined;
  const companies = listCompanies();
  const keywords = listKeywords(companyId);

  return (
    <div>
      <PageHeader
        title="Keywords & Rankings"
        sub="Positionen manuell erfassen oder später automatisch per Rank-Tracking-API (DataForSEO) befüllen."
      />
      <FilterBar companies={companies} current={companyId} basePath="/keywords" />

      {keywords.length === 0 ? (
        <EmptyState text="Noch keine Keywords erfasst — unten anlegen." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted hairline">
                <th className="px-4 py-2.5 font-medium">Keyword</th>
                <th className="px-3 py-2.5 font-medium">Unternehmen</th>
                <th className="px-3 py-2.5 font-medium">Intention</th>
                <th className="px-3 py-2.5 font-medium">Priorität</th>
                <th className="num px-3 py-2.5 font-medium">Volumen</th>
                <th className="num px-3 py-2.5 font-medium">Position</th>
                <th className="px-3 py-2.5 font-medium">Δ</th>
                <th className="px-3 py-2.5 font-medium">Verlauf</th>
                <th className="px-3 py-2.5 font-medium">Messung</th>
                <th className="px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--line)]">
              {keywords.map((k) => (
                <tr key={k.id} className="hover:bg-line/20">
                  <td className="px-4 py-2">
                    <div className="font-medium">{k.keyword}</div>
                    {k.target_url && <div className="text-xs text-muted">{k.target_url}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs text-ink2">
                      <CompanyDot slot={k.color_slot} />
                      {k.company_name.split(" ")[0]}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Badge>{k.intent}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    {k.priority === "Hoch" ? <Badge tone="accent">Hoch</Badge> : <Badge>{k.priority}</Badge>}
                  </td>
                  <td className="num px-3 py-2 text-ink2">{fmtCompact(k.search_volume)}</td>
                  <td className="num px-3 py-2 text-base font-semibold">
                    {k.latest_position ?? <span className="text-sm font-normal text-muted">–</span>}
                  </td>
                  <td className="px-3 py-2">
                    <Delta latest={k.latest_position} prev={k.prev_position} />
                  </td>
                  <td className="px-3 py-2">
                    <Sparkline values={keywordHistory(k.id)} />
                  </td>
                  <td className="px-3 py-2">
                    <form action={recordPosition} className="flex items-center gap-1">
                      <input type="hidden" name="keyword_id" value={k.id} />
                      <input
                        type="number"
                        name="position"
                        min={0}
                        max={200}
                        placeholder="Pos."
                        aria-label={`Neue Position für ${k.keyword}`}
                        className="w-16 !py-1 text-xs"
                      />
                      <button type="submit" className="rounded-md border px-1.5 py-1 text-xs text-ink2 hairline hover:text-accent" title="Position erfassen (leer = nicht in Top 200)">
                        ✓
                      </button>
                    </form>
                  </td>
                  <td className="px-2 py-2">
                    <DeleteButton kind="keyword" id={k.id} label={k.keyword} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <AddPanel label="Keyword hinzufügen">
          <form action={createKeyword} className="grid gap-3 md:grid-cols-3">
            <Field label="Unternehmen *">
              <select name="company_id" required defaultValue={companyId ?? companies[0]?.id}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Keyword *">
              <input name="keyword" required placeholder="z. B. betreuungsdienst göttingen" />
            </Field>
            <Field label="Ziel-URL (Pfad)">
              <input name="target_url" placeholder="/leistungen/…" />
            </Field>
            <Field label="Suchvolumen (mtl., geschätzt)">
              <input name="search_volume" type="number" min={0} />
            </Field>
            <Field label="Intention">
              <select name="intent">
                {INTENTS.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </Field>
            <Field label="Priorität">
              <select name="priority" defaultValue="Mittel">
                {PRIORITIES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <div className="flex items-end md:col-span-3">
              <SubmitButton>Keyword anlegen</SubmitButton>
            </div>
          </form>
        </AddPanel>
      </div>
    </div>
  );
}
