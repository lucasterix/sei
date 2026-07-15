// Stufe 2 — Qualifizierung: "Idee"-Ziele prüfen, bewerten (0–100), Kanal/Rechts-Gate zuordnen.
// Score < 40 → Abgelehnt (mit Begründung). Sonst → Recherche + score/channel gesetzt.
import { db, askJson, fetchText, logRun, loadEnv } from "./lib.mjs";

loadEnv();

function pageSummary(html) {
  if (!html) return "";
  const title = html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.trim() ?? "";
  const desc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["'](.*?)["']/is)?.[1]?.trim() ?? "";
  return `${title} — ${desc}`.slice(0, 300);
}

export async function qualify(batch = 12) {
  const rows = db()
    .prepare(
      `SELECT b.*, c.name AS company_name, c.industry, c.locations, c.domain
       FROM backlinks b JOIN companies c ON c.id = b.company_id
       WHERE b.status = 'Idee' AND (b.score IS NULL OR b.score = 0)
       ORDER BY b.id LIMIT ?`
    )
    .all(batch);

  let done = 0;
  for (const row of rows) {
    // Verzeichnis-Registrierungen brauchen keine KI-Bewertung
    if (row.channel === "registrierung") {
      db()
        .prepare("UPDATE backlinks SET score = 70, status = 'Recherche', updated_at = datetime('now') WHERE id = ?")
        .run(row.id);
      done++;
      continue;
    }

    const summary = row.source_url ? pageSummary(await fetchText(row.source_url)) : "";
    const verdict = await askJson(
      `Bewerte diese Backlink-Chance für eine weißhut arbeitende deutsche SEO-Agentur (Google-Spam-Policies + §7 UWG beachten).
Kunde: ${row.company_name} (${row.industry}, ${row.locations}, ${row.domain})
Ziel-Quelle: ${row.source} ${row.source_url || "(keine URL)"} — Typ ${row.link_type}
Seiten-Auszug: ${summary || "nicht abrufbar"}
Notiz: ${row.notes || "—"}

JSON: {"score": 0-100 (Relevanz×Qualität×Erreichbarkeit; Spam-/Linkverkaufs-Seiten <30),
"channel": "telefon|formular|email_int|email_bestand|journalist|registrierung",
"target_url": "/bester-zielpfad-beim-kunden", "anchor": "natürlicher Ankertext",
"reason": "1 Satz Begründung"}
Regel: deutsche Empfänger ohne Bestandsbeziehung NIE email_* → telefon oder formular.`,
      { maxTokens: 500 }
    );

    if (!verdict || typeof verdict.score !== "number") {
      // Ohne KI: neutraler Score, Kanal-Default nach Typ — Maschine bleibt lauffähig.
      const fallbackChannel = row.channel || (row.link_type === "Presse/PR" ? "journalist" : "telefon");
      db()
        .prepare("UPDATE backlinks SET score = 50, channel = ?, status = 'Recherche', updated_at = datetime('now') WHERE id = ?")
        .run(fallbackChannel, row.id);
      done++;
      continue;
    }

    const score = Math.max(0, Math.min(100, Math.round(verdict.score)));
    if (score < 40) {
      db()
        .prepare(
          "UPDATE backlinks SET score = ?, status = 'Abgelehnt', notes = trim(notes || ' | Abgelehnt (Engine): ' || ?), updated_at = datetime('now') WHERE id = ?"
        )
        .run(score, verdict.reason ?? "Score zu niedrig", row.id);
    } else {
      db()
        .prepare(
          `UPDATE backlinks SET score = ?, channel = ?, target_url = CASE WHEN target_url = '' THEN ? ELSE target_url END,
           anchor_text = CASE WHEN anchor_text = '' THEN ? ELSE anchor_text END,
           notes = trim(notes || ' | Engine: ' || ?), status = 'Recherche', updated_at = datetime('now') WHERE id = ?`
        )
        .run(score, verdict.channel ?? "telefon", verdict.target_url ?? "", verdict.anchor ?? "", verdict.reason ?? "", row.id);
    }
    done++;
  }
  logRun("qualify", `${done} Ziele qualifiziert`);
  return done;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  qualify();
}
