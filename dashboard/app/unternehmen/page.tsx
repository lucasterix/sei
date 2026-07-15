import Link from "next/link";
import { listCompaniesWithStats } from "@/lib/db";
import { createCompany } from "@/app/actions";
import { AddPanel, CompanyDot, Field, PageHeader, SubmitButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function CompaniesPage() {
  const companies = listCompaniesWithStats();

  return (
    <div>
      <PageHeader
        title="Unternehmen"
        sub="Jedes betreute Unternehmen ist ein Mandant mit eigenen Keywords, Pipelines und Aufgaben."
      />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted hairline">
              <th className="px-4 py-2.5 font-medium">Unternehmen</th>
              <th className="px-4 py-2.5 font-medium">Branche</th>
              <th className="px-4 py-2.5 font-medium">Standorte</th>
              <th className="num px-4 py-2.5 font-medium">Keywords</th>
              <th className="num px-4 py-2.5 font-medium">Top 10</th>
              <th className="num px-4 py-2.5 font-medium">Links live</th>
              <th className="num px-4 py-2.5 font-medium">Aufgaben</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--line)]">
            {companies.map((c) => (
              <tr key={c.id} className="hover:bg-line/20">
                <td className="px-4 py-2.5">
                  <Link href={`/unternehmen/${c.id}`} className="flex items-center gap-2 font-medium hover:text-accent">
                    <CompanyDot slot={c.color_slot} />
                    {c.name}
                  </Link>
                  <div className="ml-[18px] text-xs text-muted">{c.domain}</div>
                </td>
                <td className="px-4 py-2.5 text-ink2">{c.industry}</td>
                <td className="max-w-56 truncate px-4 py-2.5 text-xs text-ink2" title={c.locations}>
                  {c.locations}
                </td>
                <td className="num px-4 py-2.5">{c.keyword_count}</td>
                <td className="num px-4 py-2.5">{c.top10_count}</td>
                <td className="num px-4 py-2.5">{c.live_links}</td>
                <td className="num px-4 py-2.5">{c.tasks_open}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <AddPanel label="Unternehmen anlegen">
          <form action={createCompany} className="grid gap-3 md:grid-cols-2">
            <Field label="Name *">
              <input name="name" required placeholder="Muster GmbH" />
            </Field>
            <Field label="Domain *">
              <input name="domain" required placeholder="muster.de" />
            </Field>
            <Field label="Branche">
              <input name="industry" placeholder="z. B. Handwerk, Pflege, Software" />
            </Field>
            <Field label="Standorte / Einzugsgebiet">
              <input name="locations" placeholder="z. B. Göttingen, Kassel" />
            </Field>
            <Field label="Notizen (CMS, Besonderheiten, Produkte)">
              <textarea name="notes" rows={2} />
            </Field>
            <div className="flex items-end">
              <SubmitButton>Anlegen</SubmitButton>
            </div>
          </form>
        </AddPanel>
      </div>
    </div>
  );
}
