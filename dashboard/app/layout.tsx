import type { Metadata } from "next";
import { NavLink } from "@/components/NavLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO-Steuerzentrale",
  description: "Multi-Unternehmen-Steuerung für SEO, Backlinks, Content und Ads",
};

const NAV: Array<{ section: string; items: Array<{ href: string; label: string }> }> = [
  {
    section: "Steuerung",
    items: [
      { href: "/", label: "Übersicht" },
      { href: "/unternehmen", label: "Unternehmen" },
      { href: "/aufgaben", label: "Aufgaben" },
    ],
  },
  {
    section: "Organische Suche",
    items: [
      { href: "/keywords", label: "Keywords & Rankings" },
      { href: "/backlinks", label: "Backlink-Pipeline" },
      { href: "/outreach", label: "Outreach-Queue" },
      { href: "/content", label: "Content-Pipeline" },
    ],
  },
  {
    section: "Paid & Automation",
    items: [
      { href: "/ads", label: "Kampagnen" },
      { href: "/playbooks", label: "Playbooks" },
    ],
  },
  {
    section: "System",
    items: [{ href: "/einstellungen", label: "Integrationen" }],
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-[1400px]">
          <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r px-4 py-6 hairline md:flex">
            <div className="mb-6 px-3">
              <div className="text-sm font-semibold tracking-tight">SEO-Steuerzentrale</div>
              <div className="text-xs text-muted">Agentur-Cockpit</div>
            </div>
            <nav className="flex flex-1 flex-col gap-5">
              {NAV.map((group) => (
                <div key={group.section}>
                  <div className="mb-1 px-3 text-[10px] font-medium uppercase tracking-widest text-muted">
                    {group.section}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <NavLink key={item.href} href={item.href} label={item.label} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="px-3 text-[11px] leading-relaxed text-muted">
              Lokale Daten: <code>data/agentur.db</code>
            </div>
          </aside>
          <main className="min-w-0 flex-1 px-6 py-8 md:px-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
