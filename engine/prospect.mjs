// Stufe 1 — Prospecting: neue Linkchancen je Unternehmen finden.
// Quellen: (a) Verzeichnis-Katalog DE, (b) Claude-Recherche aus dem Unternehmensprofil.
// Dedup über Quelle+Unternehmen. Neue Ziele landen als Status "Idee" in der Pipeline.
import { db, askJson, listCompanies, logRun, loadEnv } from "./lib.mjs";

loadEnv();

const DIRECTORY_CATALOG = [
  ["Google Business Profile", "https://business.google.com", "registrierung"],
  ["Bing Places", "https://www.bingplaces.com", "registrierung"],
  ["Apple Business Connect", "https://businessconnect.apple.com", "registrierung"],
  ["Gelbe Seiten", "https://www.gelbeseiten.de", "registrierung"],
  ["Das Örtliche", "https://www.dasoertliche.de", "registrierung"],
  ["Das Telefonbuch", "https://www.dastelefonbuch.de", "registrierung"],
  ["11880.com", "https://www.11880.com", "registrierung"],
  ["Cylex", "https://www.cylex.de", "registrierung"],
  ["GoLocal", "https://www.golocal.de", "registrierung"],
  ["Yelp", "https://www.yelp.de", "registrierung"],
  ["GoYellow", "https://www.goyellow.de", "registrierung"],
  ["Stadtbranchenbuch", "https://www.stadtbranchenbuch.com", "registrierung"],
  ["Hotfrog", "https://www.hotfrog.de", "registrierung"],
  ["werkenntdenbesten", "https://www.werkenntdenbesten.de", "registrierung"],
];

function existingSources(companyId) {
  const list = db()
    .prepare("SELECT lower(source) AS s FROM backlinks WHERE company_id = ?")
    .all(companyId)
    .map((r) => r.s);
  return {
    has: (name) => {
      const n = String(name).toLowerCase();
      return list.some((s) => s.includes(n) || n.includes(s));
    },
    add: (name) => list.push(String(name).toLowerCase()),
    preview: () => list.slice(0, 60).join(", "),
  };
}

function insertProspect(companyId, p) {
  db()
    .prepare(
      `INSERT INTO backlinks (company_id, source, source_url, target_url, anchor_text, link_type, tier, rel, status, contact, notes, channel)
       VALUES (?, ?, ?, ?, ?, ?, 1, 'nofollow', 'Idee', ?, ?, ?)`
    )
    .run(
      companyId,
      p.source,
      p.source_url ?? "",
      p.target_url ?? "",
      p.anchor ?? "",
      p.link_type ?? "Sonstiges",
      p.contact ?? "",
      p.rationale ?? "",
      p.channel ?? ""
    );
}

export async function prospect(limitPerCompany = 8) {
  let total = 0;
  for (const company of listCompanies()) {
    const seen = existingSources(company.id);
    let added = 0;

    // (a) Katalog: fehlende Standard-Verzeichnisse auffüllen
    for (const [name, url, channel] of DIRECTORY_CATALOG) {
      if (added >= limitPerCompany) break;
      if (seen.has(name)) continue;
      insertProspect(company.id, {
        source: name,
        source_url: url,
        link_type: "Verzeichnis",
        channel,
        rationale: "Citation-Fundament (NAP exakt konsistent halten).",
      });
      seen.add(name);
      added++;
    }

    // (b) Claude-Recherche: branchen-/ortsspezifische Chancen
    if (added < limitPerCompany) {
      const ideas = await askJson(
        `Du bist Linkbuilding-Recherche-Agent einer deutschen Agentur (weißhut, Google-Spam-Policies beachten, keine Linkkauf-Netzwerke).
Unternehmen: ${company.name} — ${company.industry}. Region: ${company.locations}. Domain: ${company.domain}.
Profil-Notizen: ${company.notes}
Bereits erfasste Quellen (nicht wiederholen): ${seen.preview() || "keine"}

Nenne ${limitPerCompany - added} KONKRETE neue Backlink-Chancen (Kommunen/Wegweiser, Kammern, Verbände, Fachportale, Vereine/Sponsoring, Ressourcenlisten, Presse-Datenstory-Abnehmer). Für jede:
{"source": "Name", "source_url": "https://… oder leer", "link_type": "Verzeichnis|Gastbeitrag|Presse/PR|Partner/Verein|Sponsoring|Linkable Asset|Sonstiges", "channel": "telefon|formular|email_int|email_bestand|journalist|registrierung", "target_url": "/pfad-beim-kunden", "anchor": "natürlicher Anker", "rationale": "1 Satz warum", "contact": "Ansprechpartner-Hinweis oder leer"}
Als JSON-Array. Deutsche Ziele NIE mit channel email_* versehen (UWG!), außer es ist erkennbar eine Bestandsbeziehung.`,
        { maxTokens: 2500 }
      );
      if (Array.isArray(ideas)) {
        for (const idea of ideas) {
          if (added >= limitPerCompany) break;
          if (!idea?.source || seen.has(idea.source)) continue;
          insertProspect(company.id, idea);
          seen.add(idea.source);
          added++;
        }
      }
    }

    total += added;
    logRun("prospect", `${company.name}: ${added} neue Linkziele`);
  }
  return total;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  prospect().then((n) => logRun("prospect", `fertig, ${n} Ziele gesamt`));
}
