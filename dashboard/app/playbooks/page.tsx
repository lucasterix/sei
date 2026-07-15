import { listCompanies } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { CopyButton } from "@/components/CopyButton";

export const dynamic = "force-dynamic";

function CommandRow({ cmd, desc }: { cmd: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <code className="min-w-0 flex-1 truncate rounded bg-line/40 px-2 py-1 text-xs" title={cmd}>
        {cmd}
      </code>
      <span className="hidden w-64 shrink-0 text-xs text-muted lg:block">{desc}</span>
      <CopyButton text={cmd} />
    </div>
  );
}

export default function PlaybooksPage() {
  const companies = listCompanies();

  return (
    <div>
      <PageHeader
        title="Playbooks"
        sub="Fertige Claude-Code-Kommandos je Unternehmen — die Repos claude-seo, claude-blog und claude-ads sind die ausführenden Werkzeuge, dieses Dashboard ist die Steuerung."
      />

      <section className="card mb-6">
        <div className="border-b px-4 py-2.5 text-sm font-semibold hairline">Einmalige Einrichtung (Claude Code)</div>
        <div className="divide-y divide-[color:var(--line)]">
          <CommandRow cmd="/plugin marketplace add AgriciDaniel/claude-seo" desc="SEO-Audit-Suite installieren" />
          <CommandRow cmd="/plugin install claude-seo@agricidaniel-claude-seo" desc="" />
          <CommandRow cmd="/plugin marketplace add AgriciDaniel/claude-blog" desc="Content-Suite installieren" />
          <CommandRow cmd="/plugin marketplace add AgriciDaniel/claude-ads" desc="Paid-Media-Suite installieren" />
          <CommandRow cmd="/seo google setup" desc="Google-APIs (GSC, PSI, CrUX, GA4) verbinden" />
        </div>
      </section>

      {companies.map((c) => {
        const url = `https://${c.domain}`;
        return (
          <section key={c.id} className="card mb-6">
            <div className="border-b px-4 py-2.5 text-sm font-semibold hairline">{c.name}</div>

            <div className="border-b px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-muted hairline">
              claude-seo — Analyse & Technik
            </div>
            <div className="divide-y divide-[color:var(--line)]">
              <CommandRow cmd={`/seo audit ${url}`} desc="Voll-Audit (25 Skills, PDF-Report)" />
              <CommandRow cmd={`/seo local ${url}`} desc="Local-SEO-Audit inkl. GBP" />
              <CommandRow cmd={`/seo schema ${url}`} desc="Schema prüfen & generieren (LocalBusiness!)" />
              <CommandRow cmd={`/seo geo ${url}`} desc="AI-Search-Optimierung (ChatGPT/Perplexity)" />
              <CommandRow cmd={`/seo drift baseline ${url}`} desc="Monitoring-Baseline setzen, monatlich vergleichen" />
              <CommandRow cmd={`/seo backlinks ${c.domain}`} desc="Linkprofil (Moz/Bing/CommonCrawl, kostenlos)" />
            </div>

            <div className="border-b px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-muted hairline">
              claude-blog — Content-Produktion
            </div>
            <div className="divide-y divide-[color:var(--line)]">
              <CommandRow cmd={`/blog strategy ${c.industry || c.domain}`} desc="Themen-Strategie für die Nische" />
              <CommandRow cmd={`/blog calendar ${c.domain}`} desc="Redaktionskalender erzeugen" />
              <CommandRow cmd={`/blog write <thema aus Content-Pipeline>`} desc="Artikel schreiben (5-Gate-Qualität)" />
              <CommandRow cmd={`/blog analyze <datei>`} desc="100-Punkte-Audit vor Veröffentlichung" />
            </div>

            <div className="px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-widest text-muted">
              claude-ads — Paid Media
            </div>
            <div className="divide-y divide-[color:var(--line)]">
              <CommandRow cmd="/ads setup" desc="Profil & Konten verbinden (read-only Start)" />
              <CommandRow cmd="/ads audit google" desc="Google-Ads-Konto auditieren" />
              <CommandRow cmd={`/ads plan`} desc="Kanäle/Budgets planen (→ Kampagnen-Seite pflegen)" />
            </div>
          </section>
        );
      })}

      <section className="card">
        <div className="border-b px-4 py-2.5 text-sm font-semibold hairline">Monats-Workflow je Unternehmen</div>
        <ol className="list-decimal space-y-1.5 px-9 py-4 text-sm text-ink2">
          <li>
            <code>/seo drift compare</code> — was hat sich technisch/inhaltlich verändert?
          </li>
          <li>Rankings erfassen (Keywords-Seite; später automatisch via DataForSEO).</li>
          <li>Backlink-Pipeline pflegen: 3–5 neue Linkziele recherchieren, Status aktualisieren, Journalistenanfragen (HEJA/Recherchescout) prüfen.</li>
          <li>
            1–2 Content-Stücke produzieren (<code>/blog write</code>) und veröffentlichen; Content-Pipeline aktualisieren.
          </li>
          <li>Google Business Profile: Beitrag posten, neue Bewertungen beantworten, Fotos aktualisieren.</li>
          <li>
            Ads: <code>/ads monitor</code>, Budgets/Pacing prüfen, Kampagnen-Seite aktualisieren.
          </li>
          <li>Kurz-Report an das Unternehmen: Was getan, was erreicht (Top-10-Keywords, neue Links, Anfragen), was kommt.</li>
        </ol>
      </section>
    </div>
  );
}
