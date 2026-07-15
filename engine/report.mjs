// Monatsbericht je Unternehmen: getan → erreicht → geplant, direkt aus der DB.
// Ausgabe: reports/<domain>/<jahr-monat>.md — versionierbar, kundentauglich als
// Basis für den Versand. Läuft ohne externe Dienste.
import fs from "node:fs";
import path from "node:path";
import { ROOT, db, listCompanies, logRun, loadEnv } from "./lib.mjs";

loadEnv();

const DAYS = 30;

function rankingDeltas(companyId) {
  const keywords = db()
    .prepare("SELECT id, keyword FROM keywords WHERE company_id = ?")
    .all(companyId);
  const deltas = [];
  for (const kw of keywords) {
    const checks = db()
      .prepare(
        `SELECT position FROM keyword_checks
         WHERE keyword_id = ? AND position IS NOT NULL AND checked_at >= date('now', '-${DAYS + 5} day')
         ORDER BY checked_at ASC, id ASC`
      )
      .all(kw.id);
    if (checks.length >= 2) {
      const first = checks[0].position;
      const last = checks[checks.length - 1].position;
      deltas.push({ keyword: kw.keyword, from: first, to: last, delta: first - last });
    }
  }
  return deltas.sort((a, b) => b.delta - a.delta);
}

export function report() {
  const month = new Date().toISOString().slice(0, 7);
  let written = 0;

  for (const company of listCompanies()) {
    const one = (sql, ...params) => db().prepare(sql).get(...params);
    const all = (sql, ...params) => db().prepare(sql).all(...params);

    const newLive = all(
      `SELECT source, link_type FROM backlinks WHERE company_id = ? AND status = 'Live'
       AND updated_at >= datetime('now', '-${DAYS} day') ORDER BY updated_at DESC`,
      company.id
    );
    const pipeline = one(
      `SELECT
        SUM(CASE WHEN status IN ('Idee','Recherche') THEN 1 ELSE 0 END) AS vorbereitet,
        SUM(CASE WHEN status IN ('Kontaktiert','Verhandlung','Platziert') THEN 1 ELSE 0 END) AS laufend,
        SUM(CASE WHEN status = 'Live' THEN 1 ELSE 0 END) AS live
       FROM backlinks WHERE company_id = ?`,
      company.id
    );
    const outreach = one(
      `SELECT
        SUM(CASE WHEN status = 'Gesendet' AND sent_at >= datetime('now', '-${DAYS} day') THEN 1 ELSE 0 END) AS gesendet,
        SUM(CASE WHEN status = 'Beantwortet' THEN 1 ELSE 0 END) AS beantwortet,
        SUM(CASE WHEN status = 'Entwurf' THEN 1 ELSE 0 END) AS wartend
       FROM outreach_queue WHERE company_id = ?`,
      company.id
    );
    const publishedContent = all(
      `SELECT title, published_url FROM content_items WHERE company_id = ? AND status = 'Veröffentlicht'
       AND created_at >= datetime('now', '-${DAYS} day')`,
      company.id
    );
    const doneTasks = all(
      `SELECT title FROM tasks WHERE company_id = ? AND status = 'Erledigt' ORDER BY id DESC LIMIT 10`,
      company.id
    );
    const nextSteps = all(
      `SELECT title, due_date FROM tasks WHERE company_id = ? AND status != 'Erledigt'
       ORDER BY priority = 'Hoch' DESC, COALESCE(due_date,'9999') ASC LIMIT 6`,
      company.id
    );
    const deltas = rankingDeltas(company.id);
    const up = deltas.filter((d) => d.delta > 0).slice(0, 5);
    const down = deltas.filter((d) => d.delta < 0).slice(-3);

    const lines = [
      `# Monatsbericht ${month} — ${company.name}`,
      "",
      `Zeitraum: letzte ${DAYS} Tage · erstellt automatisch von der Agentur-Engine am ${new Date().toISOString().slice(0, 10)}`,
      "",
      "## Ergebnisse",
      "",
      `- **Backlinks:** ${pipeline.live ?? 0} live gesamt, davon ${newLive.length} neu in diesem Zeitraum` +
        (newLive.length ? ` (${newLive.map((l) => l.source).join(", ")})` : ""),
      `- **Pipeline:** ${pipeline.vorbereitet ?? 0} vorbereitet · ${pipeline.laufend ?? 0} in Ansprache/Verhandlung`,
      `- **Outreach:** ${outreach.gesendet ?? 0} versendet · ${outreach.beantwortet ?? 0} beantwortet · ${outreach.wartend ?? 0} Entwürfe wartend`,
      `- **Content:** ${publishedContent.length} veröffentlicht` +
        (publishedContent.length ? ` (${publishedContent.map((c) => c.title).join("; ")})` : ""),
      "",
      "## Rankings (google.de)",
      "",
      deltas.length === 0
        ? "_Noch keine ausreichende Messreihe (Rankings-Automatik: DataForSEO-Zugang in engine/.env)._"
        : [
            up.length ? "**Verbesserungen:**" : "_Keine Verbesserungen im Zeitraum._",
            ...up.map((d) => `- „${d.keyword}“: ${d.from} → ${d.to} (**+${d.delta}**)`),
            down.length ? "\n**Beobachten:**" : "",
            ...down.map((d) => `- „${d.keyword}“: ${d.from} → ${d.to} (${d.delta})`),
          ]
            .filter(Boolean)
            .join("\n"),
      "",
      "## Erledigt",
      "",
      doneTasks.length ? doneTasks.map((t) => `- ${t.title}`).join("\n") : "_—_",
      "",
      "## Nächste Schritte",
      "",
      nextSteps.map((t) => `- ${t.title}${t.due_date ? ` (bis ${t.due_date})` : ""}`).join("\n") || "_—_",
      "",
    ];

    const dir = path.join(ROOT, "reports", company.domain.replace(/[^a-z0-9.-]/gi, "_"));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${month}.md`), lines.join("\n"));
    written++;
  }
  logRun("report", `${written} Monatsbericht(e) → reports/`);
  return written;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  report();
}
