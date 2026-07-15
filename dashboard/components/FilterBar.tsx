import Link from "next/link";
import type { Company } from "@/lib/db";
import { CompanyDot } from "@/components/ui";

/** Unternehmens-Filter als Chip-Zeile (eine Filterzeile oberhalb der Inhalte). */
export function FilterBar({ companies, current, basePath }: { companies: Company[]; current?: number; basePath: string }) {
  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
      active ? "border-[color:var(--accent)] font-medium text-accent" : "text-ink2 hairline hover:text-ink"
    }`;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Link href={basePath} className={chip(!current)}>
        Alle Unternehmen
      </Link>
      {companies.map((c) => (
        <Link key={c.id} href={`${basePath}?firma=${c.id}`} className={chip(current === c.id)}>
          <CompanyDot slot={c.color_slot} />
          {c.name.split(" ")[0]}
        </Link>
      ))}
    </div>
  );
}
