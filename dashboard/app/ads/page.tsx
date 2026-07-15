import { listCampaigns, listCompanies } from "@/lib/db";
import { createCampaign } from "@/app/actions";
import { AddPanel, CompanyDot, EmptyState, Field, PageHeader, StatTile, SubmitButton } from "@/components/ui";
import { FilterBar } from "@/components/FilterBar";
import { StatusSelect } from "@/components/StatusSelect";
import { DeleteButton } from "@/components/DeleteButton";
import { CAMPAIGN_STATUS, fmtEur, fmtInt } from "@/lib/format";

export const dynamic = "force-dynamic";

const PLATFORMS = ["Google Ads", "Meta Ads", "LinkedIn Ads", "Microsoft Ads", "TikTok Ads", "YouTube Ads", "Sonstige"];

export default async function AdsPage({ searchParams }: { searchParams: Promise<{ firma?: string }> }) {
  const { firma } = await searchParams;
  const companyId = firma ? Number(firma) : undefined;
  const companies = listCompanies();
  const campaigns = listCampaigns(companyId);

  const active = campaigns.filter((c) => c.status === "Aktiv");
  const planned = campaigns.filter((c) => c.status === "Geplant");
  const budget = campaigns
    .filter((c) => c.status === "Aktiv" || c.status === "Geplant")
    .reduce((sum, c) => sum + (c.monthly_budget ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Kampagnen"
        sub="Paid-Media-Planung je Unternehmen — Audits, Struktur und Monitoring laufen über claude-ads (/ads plan, /ads audit)."
      />
      <FilterBar companies={companies} current={companyId} basePath="/ads" />

      <section className="mb-4 grid grid-cols-3 gap-3">
        <StatTile label="Aktive Kampagnen" value={fmtInt(active.length)} />
        <StatTile label="Geplante Kampagnen" value={fmtInt(planned.length)} />
        <StatTile label="Budget je Monat" value={fmtEur(budget)} hint="aktiv + geplant" />
      </section>

      {campaigns.length === 0 ? (
        <EmptyState text="Noch keine Kampagnen — unten anlegen." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted hairline">
                <th className="px-4 py-2.5 font-medium">Kampagne</th>
                <th className="px-3 py-2.5 font-medium">Unternehmen</th>
                <th className="px-3 py-2.5 font-medium">Plattform</th>
                <th className="num px-3 py-2.5 font-medium">Budget/Monat</th>
                <th className="px-3 py-2.5 font-medium">Ziel</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Notizen</th>
                <th className="px-2 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--line)]">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-line/20">
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs text-ink2">
                      <CompanyDot slot={c.color_slot} />
                      {c.company_name.split(" ")[0]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-ink2">{c.platform}</td>
                  <td className="num px-3 py-2.5">{fmtEur(c.monthly_budget)}</td>
                  <td className="px-3 py-2.5 text-ink2">{c.goal}</td>
                  <td className="px-3 py-2.5">
                    <StatusSelect kind="campaign" id={c.id} value={c.status} options={CAMPAIGN_STATUS} />
                  </td>
                  <td className="max-w-56 truncate px-3 py-2.5 text-xs text-muted" title={c.notes}>
                    {c.notes}
                  </td>
                  <td className="px-2 py-2.5">
                    <DeleteButton kind="campaign" id={c.id} label={c.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4">
        <AddPanel label="Kampagne anlegen">
          <form action={createCampaign} className="grid gap-3 md:grid-cols-3">
            <Field label="Unternehmen *">
              <select name="company_id" required defaultValue={companyId ?? companies[0]?.id}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kampagnenname *">
              <input name="name" required placeholder="z. B. Local Search Göttingen" />
            </Field>
            <Field label="Plattform">
              <select name="platform">
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Budget je Monat (€)">
              <input name="monthly_budget" type="number" min={0} step="50" />
            </Field>
            <Field label="Ziel / KPI">
              <input name="goal" placeholder="z. B. Anfragen, Bewerbungen, Demos" />
            </Field>
            <Field label="Notizen">
              <input name="notes" placeholder="Conversion-Tracking vor Start prüfen!" />
            </Field>
            <div className="flex items-end md:col-span-3">
              <SubmitButton>Kampagne anlegen</SubmitButton>
            </div>
          </form>
        </AddPanel>
      </div>
    </div>
  );
}
