import { listIntegrations } from "@/lib/db";
import { PageHeader, StatusBadge } from "@/components/ui";
import { StatusSelect } from "@/components/StatusSelect";
import { INTEGRATION_STATUS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const integrations = listIntegrations();
  const missing = integrations.filter((i) => i.status !== "Aktiv").length;

  return (
    <div>
      <PageHeader
        title="Integrationen & Lücken"
        sub={`Die operative Lückenliste der Agentur: ${missing} von ${integrations.length} Bausteinen sind noch nicht aktiv. Reihenfolge: erst kostenlose Google-Zugänge, dann Bezahl-APIs.`}
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted hairline">
              <th className="px-4 py-2.5 font-medium">Baustein</th>
              <th className="px-3 py-2.5 font-medium">Kategorie</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Hinweise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--line)]">
            {integrations.map((i) => (
              <tr key={i.id} className="hover:bg-line/20">
                <td className="px-4 py-2.5 font-medium">{i.name}</td>
                <td className="px-3 py-2.5 text-xs text-ink2">{i.category}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={i.status} />
                    <StatusSelect kind="integration" id={i.id} value={i.status} options={INTEGRATION_STATUS} />
                  </div>
                </td>
                <td className="max-w-md px-3 py-2.5 text-xs text-ink2">{i.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="card px-4 py-3 text-sm">
          <h2 className="mb-2 font-semibold">Datenhaltung</h2>
          <p className="text-ink2">
            Alle Daten liegen lokal in <code>dashboard/data/agentur.db</code> (SQLite). Backup = Datei kopieren. Für ein
            Team-Setup später auf einen kleinen Server (z. B. Hetzner) deployen — Next.js-App + SQLite-Datei genügen.
          </p>
        </section>
        <section className="card px-4 py-3 text-sm">
          <h2 className="mb-2 font-semibold">Nächste Ausbaustufen</h2>
          <ul className="list-disc space-y-1 pl-5 text-ink2">
            <li>DataForSEO-Anbindung: Rankings nächtlich automatisch erfassen (API-Route + Cron).</li>
            <li>GSC-Import: Klicks/Impressionen je Unternehmen in die Übersicht.</li>
            <li>Monats-Report als PDF je Unternehmen (Export aus diesem Dashboard).</li>
            <li>Bewertungs-Monitoring (Google Reviews) je Standort.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
