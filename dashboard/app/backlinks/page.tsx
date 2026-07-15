import { listBacklinks, listCompanies } from "@/lib/db";
import { createBacklink } from "@/app/actions";
import { AddPanel, Badge, CompanyDot, Field, PageHeader, StatTile, SubmitButton } from "@/components/ui";
import { FilterBar } from "@/components/FilterBar";
import { StatusSelect } from "@/components/StatusSelect";
import { DeleteButton } from "@/components/DeleteButton";
import { BACKLINK_STATUS, BACKLINK_TYPES, fmtEur, fmtInt } from "@/lib/format";
import type { Backlink } from "@/lib/db";

export const dynamic = "force-dynamic";

const PIPELINE: readonly string[] = ["Idee", "Recherche", "Kontaktiert", "Verhandlung", "Platziert", "Live"];

function LinkCard({ link, showCompany }: { link: Backlink; showCompany: boolean }) {
  return (
    <div className="card px-3 py-2.5 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium text-[13px]" title={link.source}>
            {link.source}
          </div>
          {showCompany && (
            <div className="mt-0.5 flex items-center gap-1 text-muted">
              <CompanyDot slot={link.color_slot} />
              {link.company_name.split(" ")[0]}
            </div>
          )}
        </div>
        <DeleteButton kind="backlink" id={link.id} label={link.source} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge>{link.link_type}</Badge>
        <Badge tone={link.tier === 1 ? "accent" : "warn"}>Tier {link.tier}</Badge>
        {link.rel !== "follow" && <Badge>{link.rel}</Badge>}
        {link.cost != null && <Badge>{fmtEur(link.cost)}</Badge>}
      </div>
      {link.anchor_text && (
        <div className="mt-1.5 truncate italic text-muted" title={`Anker: ${link.anchor_text}`}>
          „{link.anchor_text}“
        </div>
      )}
      {link.notes && (
        <div className="mt-1.5 line-clamp-2 text-ink2" title={link.notes}>
          {link.notes}
        </div>
      )}
      <div className="mt-2">
        <StatusSelect kind="backlink" id={link.id} value={link.status} options={BACKLINK_STATUS} />
      </div>
    </div>
  );
}

export default async function BacklinksPage({ searchParams }: { searchParams: Promise<{ firma?: string }> }) {
  const { firma } = await searchParams;
  const companyId = firma ? Number(firma) : undefined;
  const companies = listCompanies();
  const links = listBacklinks(companyId);
  const showCompany = !companyId && companies.length > 1;

  const live = links.filter((l) => l.status === "Live");
  const inPipeline = links.filter((l) => PIPELINE.includes(l.status) && l.status !== "Live");
  const closed = links.filter((l) => l.status === "Abgelehnt" || l.status === "Verloren");
  const spend = links
    .filter((l) => l.status === "Live" || l.status === "Platziert")
    .reduce((sum, l) => sum + (l.cost ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Backlink-Pipeline"
        sub="Vom Linkziel bis zum Live-Link. Tier 1 = verdienter Link zur Kundenseite, Tier 2 = Amplifikation über eigene Kanäle — kein gekauftes Tier-Spam-Netzwerk."
      />
      <FilterBar companies={companies} current={companyId} basePath="/backlinks" />

      <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Links live" value={fmtInt(live.length)} />
        <StatTile label="In Pipeline" value={fmtInt(inPipeline.length)} />
        <StatTile label="Abgelehnt / verloren" value={fmtInt(closed.length)} />
        <StatTile label="Kosten (platziert + live)" value={fmtEur(spend)} hint="Sponsoring → rel=sponsored" />
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {PIPELINE.map((status) => {
          const column = links.filter((l) => l.status === status);
          return (
            <div key={status} className="min-w-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink2">{status}</span>
                <span className="text-xs text-muted">{column.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {column.map((l) => (
                  <LinkCard key={l.id} link={l} showCompany={showCompany} />
                ))}
                {column.length === 0 && <div className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted hairline">leer</div>}
              </div>
            </div>
          );
        })}
      </div>

      {closed.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-muted">
            Abgelehnt / verloren ({closed.length}) anzeigen
          </summary>
          <div className="mt-2 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {closed.map((l) => (
              <LinkCard key={l.id} link={l} showCompany={showCompany} />
            ))}
          </div>
        </details>
      )}

      <div className="mt-4">
        <AddPanel label="Linkziel hinzufügen">
          <form action={createBacklink} className="grid gap-3 md:grid-cols-3">
            <Field label="Unternehmen *">
              <select name="company_id" required defaultValue={companyId ?? companies[0]?.id}>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quelle (Website/Organisation) *">
              <input name="source" required placeholder="z. B. Stadt Göttingen — Seniorenwegweiser" />
            </Field>
            <Field label="Quell-URL">
              <input name="source_url" placeholder="https://…" />
            </Field>
            <Field label="Ziel-URL (Pfad beim Kunden)">
              <input name="target_url" placeholder="/ratgeber/…" />
            </Field>
            <Field label="Wunsch-Ankertext">
              <input name="anchor_text" placeholder="natürlich halten, Marke > Money-Keyword" />
            </Field>
            <Field label="Typ">
              <select name="link_type">
                {BACKLINK_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Tier">
              <select name="tier" defaultValue="1">
                <option value="1">Tier 1 — Link zur Kundenseite</option>
                <option value="2">Tier 2 — Amplifikation eigener Platzierungen</option>
              </select>
            </Field>
            <Field label="Link-Attribut">
              <select name="rel">
                <option value="follow">follow</option>
                <option value="nofollow">nofollow</option>
                <option value="sponsored">sponsored (bezahlt!)</option>
                <option value="ugc">ugc</option>
              </select>
            </Field>
            <Field label="Status">
              <select name="status">
                {BACKLINK_STATUS.map((st) => (
                  <option key={st}>{st}</option>
                ))}
              </select>
            </Field>
            <Field label="Kosten (€, falls bezahlt)">
              <input name="cost" type="number" min={0} step="10" />
            </Field>
            <Field label="Kontakt / Ansprechpartner">
              <input name="contact" placeholder="Telefon bevorzugt — kein Kalt-Mailing (§7 UWG)" />
            </Field>
            <Field label="Notizen">
              <input name="notes" />
            </Field>
            <div className="flex items-end md:col-span-3">
              <SubmitButton>Linkziel anlegen</SubmitButton>
            </div>
          </form>
        </AddPanel>
      </div>

      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
        Rechtsrahmen: Kalt-E-Mail-Outreach an Unternehmen ist in Deutschland nach § 7 UWG bereits ab der ersten Mail
        abmahnfähig — Kontaktwege: Telefon (B2B), Kontaktformular, Journalistenanfragen (HEJA, Recherchescout), bestehende
        Netzwerke. Bezahlte Links (auch Sponsoring) brauchen <code>rel=&quot;sponsored&quot;</code> und beim Publisher eine
        Kennzeichnung als „Anzeige/Werbung“.
      </p>
    </div>
  );
}
