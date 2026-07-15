// Stufe 5 — Journalistenanfragen: der vollautonome Outreach-Kanal.
// Anfragen (HEJA, Recherchescout, Featured …) landen als .txt in engine/inbox/
// (manuell abgelegt oder von inbox.mjs aus dem Postfach geholt). Die Engine matcht
// jede Anfrage gegen die Mandanten und legt eine Antwort in die Outreach-Queue —
// Kanal "journalist" ist auto-versendbar, denn hier ist die Zusendung erbeten.
import fs from "node:fs";
import path from "node:path";
import { ROOT, db, askJson, listCompanies, logRun, loadEnv } from "./lib.mjs";

loadEnv();

const INBOX = path.join(ROOT, "engine", "inbox");
const DONE = path.join(INBOX, "verarbeitet");

export async function journalist() {
  fs.mkdirSync(DONE, { recursive: true });
  const files = fs
    .readdirSync(INBOX)
    .filter((f) => f.endsWith(".txt"))
    .map((f) => path.join(INBOX, f));

  if (files.length === 0) {
    logRun("journalist", "keine neuen Anfragen in engine/inbox/");
    return 0;
  }

  const companies = listCompanies();
  const profile = companies
    .map((c) => `- id=${c.id}: ${c.name} | ${c.industry} | ${c.locations} | ${c.domain} | ${c.notes.slice(0, 160)}`)
    .join("\n");

  let handled = 0;
  for (const file of files) {
    const request = fs.readFileSync(file, "utf8").slice(0, 6000);
    const match = await askJson(
      `Eine Journalistenanfrage (HARO-Prinzip: Redaktion bittet um Expertenstimme/Daten). Prüfe, ob eines unserer Unternehmen als Experte passt.

MANDANTEN:
${profile}

ANFRAGE:
${request}

Wenn ein Mandant gut passt: verfasse die Antwort — kurz (max. 180 Wörter), konkret, zitierfähig (2-3 prägnante Expertensätze in Anführungszeichen), mit Vorstellungszeile (Rolle/Firma/Region; Personenname als Platzhalter [NAME]) und Angebot für Rückfragen. Keine Werbefloskeln, kein Link-Betteln — die Quellenangabe ergibt sich redaktionell.
WICHTIG: Erfinde KEINE konkreten Zahlen, Quoten oder Fakten über den Mandanten. Wo eine Zahl das Zitat stärken würde, setze einen Platzhalter wie [ZAHL PRÜFEN: z. B. Anteil der Kunden, die X]. Aussagen nur, soweit sie aus dem Mandantenprofil belegbar sind.
JSON: {"company_id": <id oder null wenn keiner passt>, "outlet": "Medium/Absender falls erkennbar", "topic": "Thema in 5 Worten", "subject": "Antwort-Betreff", "body": "vollständige Antwort", "reason": "1 Satz warum passend/unpassend"}`,
      { maxTokens: 900 }
    );

    if (!match) {
      logRun("journalist", `${path.basename(file)}: übersprungen (kein Claude verfügbar) — Datei bleibt liegen`);
      continue;
    }

    if (!match.company_id) {
      fs.renameSync(file, path.join(DONE, path.basename(file)));
      logRun("journalist", `${path.basename(file)}: kein passender Mandant (${match.reason ?? ""})`);
      handled++;
      continue;
    }

    const company = companies.find((c) => c.id === Number(match.company_id));
    if (!company) continue;

    // Presse-Chance in der Backlink-Pipeline anlegen + Antwortentwurf in die Queue
    const backlinkId = db()
      .prepare(
        `INSERT INTO backlinks (company_id, source, source_url, link_type, tier, rel, status, channel, score, notes)
         VALUES (?, ?, '', 'Presse/PR', 1, 'follow', 'Recherche', 'journalist', 80, ?)`
      )
      .run(company.id, match.outlet || "Journalistenanfrage", `Anfrage: ${match.topic ?? ""} — ${match.reason ?? ""}`)
      .lastInsertRowid;

    db()
      .prepare(
        `INSERT INTO outreach_queue (backlink_id, company_id, channel, language, subject, body, status, notes)
         VALUES (?, ?, 'journalist', 'de', ?, ?, 'Entwurf', ?)`
      )
      .run(Number(backlinkId), company.id, match.subject ?? "Ihre Anfrage", match.body ?? "", `Quelle: ${path.basename(file)} · ${match.topic ?? ""}`);

    fs.renameSync(file, path.join(DONE, path.basename(file)));
    logRun("journalist", `${path.basename(file)} → ${company.name} (${match.topic ?? "Thema"}) — Antwort in Queue`);
    handled++;
  }
  return handled;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  journalist();
}
