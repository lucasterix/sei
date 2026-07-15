// Stufe 4 — Monitoring: prüft platzierte/lebende Links, misst Rankings (DataForSEO,
// falls Zugang konfiguriert) und hält die Pipeline aktuell.
import { db, fetchText, logRun, loadEnv } from "./lib.mjs";

loadEnv();

async function checkLinks() {
  const rows = db()
    .prepare(
      `SELECT b.id, b.source, b.source_url, b.status, c.domain
       FROM backlinks b JOIN companies c ON c.id = b.company_id
       WHERE b.status IN ('Platziert','Live') AND b.source_url LIKE 'http%'`
    )
    .all();

  let live = 0, lost = 0;
  for (const row of rows) {
    // Plattform-Startseiten (kein Pfad) sind nicht verifizierbar → kein Urteil,
    // nur Zeitstempel (z. B. Google-Business-Profil, Verzeichnis-Roots).
    let checkable = false;
    try {
      checkable = new URL(row.source_url).pathname.length > 1;
    } catch { /* kaputte URL → nicht prüfbar */ }
    if (!checkable) {
      db().prepare("UPDATE backlinks SET last_checked = date('now') WHERE id = ?").run(row.id);
      continue;
    }
    const html = await fetchText(row.source_url);
    if (html === null) continue; // Quelle nicht erreichbar → kein Urteil
    const found = html.toLowerCase().includes(row.domain.toLowerCase());
    if (found) {
      db().prepare(
        "UPDATE backlinks SET status = 'Live', last_checked = date('now'), updated_at = datetime('now') WHERE id = ?"
      ).run(row.id);
      live++;
    } else if (row.status === "Live") {
      db().prepare(
        "UPDATE backlinks SET status = 'Verloren', last_checked = date('now'), notes = trim(notes || ' | Link nicht mehr gefunden (Engine-Check).'), updated_at = datetime('now') WHERE id = ?"
      ).run(row.id);
      lost++;
    } else {
      db().prepare("UPDATE backlinks SET last_checked = date('now') WHERE id = ?").run(row.id);
    }
  }
  logRun("monitor", `Link-Check: ${rows.length} geprüft, ${live} live bestätigt, ${lost} verloren`);
}

async function checkRankings() {
  const { DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD } = process.env;
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    logRun("monitor", "Rankings übersprungen (DATAFORSEO_LOGIN/PASSWORD fehlen)");
    return;
  }
  const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString("base64");
  const keywords = db()
    .prepare(
      `SELECT k.id, k.keyword, c.domain FROM keywords k JOIN companies c ON c.id = k.company_id
       WHERE NOT EXISTS (SELECT 1 FROM keyword_checks kc WHERE kc.keyword_id = k.id AND kc.checked_at = date('now'))`
    )
    .all();

  let measured = 0;
  for (const kw of keywords) {
    try {
      const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/regular", {
        method: "POST",
        headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
        body: JSON.stringify([{ keyword: kw.keyword, language_code: "de", location_code: 2276, depth: 100 }]),
      });
      const data = await res.json();
      const items = data?.tasks?.[0]?.result?.[0]?.items ?? [];
      const hit = items.find((i) => (i.domain || "").includes(kw.domain));
      db()
        .prepare("INSERT INTO keyword_checks (keyword_id, checked_at, position) VALUES (?, date('now'), ?)")
        .run(kw.id, hit ? hit.rank_absolute : null);
      measured++;
    } catch { /* Einzelfehler ignorieren, nächstes Keyword */ }
  }
  logRun("monitor", `Rankings: ${measured}/${keywords.length} Keywords gemessen (google.de)`);
}

export async function monitor() {
  await checkLinks();
  await checkRankings();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  monitor();
}
