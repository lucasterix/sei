// Stufe 3 — Outreach: personalisierte Nachrichten für qualifizierte Ziele erzeugen,
// in die Queue legen und — nur auf rechtlich freigegebenen Kanälen bzw. nach
// manueller Genehmigung im Dashboard — per SMTP versenden.
import { db, askJson, autoSendAllowed, logRun, loadEnv } from "./lib.mjs";

loadEnv();

const MIN_SCORE = Number(process.env.OUTREACH_MIN_SCORE || 55);

function templateDraft(row) {
  const isRegistration = row.channel === "registrierung";
  return {
    language: "de",
    subject: isRegistration
      ? `Eintrag anlegen: ${row.source}`
      : `Anfrage: ${row.company_name} & ${row.source}`,
    body: isRegistration
      ? `Registrierungs-Auftrag für ${row.source} (${row.source_url}):\nNAP exakt wie Google Business Profile eintragen.\nFirma: ${row.company_name}\nZiel-URL: https://${row.domain}${row.target_url || "/"}`
      : `Gesprächs-/Formularleitfaden für ${row.source}:\n1) Bezug nennen (warum ${row.company_name} für deren Publikum relevant ist)\n2) Konkretes Angebot (Inhalt/Daten/Expertenstimme statt "Linktausch")\n3) Ziel: ${row.target_url || "/"} — Anker natürlich: "${row.anchor_text || row.company_name}"\nHinweis: Kein Kalt-E-Mail-Versand an deutsche Empfänger (§7 UWG).`,
  };
}

async function draftFor(row) {
  const draft = await askJson(
    `Schreibe eine kurze, ehrliche Outreach-Nachricht (kein Marketing-Sprech, kein "dofollow"-Vokabular, max. 130 Wörter) für diesen Kanal: ${row.channel}.
Absender: ${row.company_name} (${row.industry}, ${row.locations}) bzw. deren Agentur.
Empfänger: ${row.source} (${row.source_url || "URL unbekannt"}), Kontext: ${row.notes || row.link_type}.
Ziel: Inhalt/Kooperation vorschlagen, die für das Publikum des Empfängers echten Wert hat; Verweis auf https://${row.domain}${row.target_url || "/"} ergibt sich natürlich.
Bei channel=telefon: Gesprächsleitfaden in Stichpunkten. Bei channel=formular: Formular-Text. Bei channel=email_int: englisch, mit Opt-out-Schlusssatz. Sonst deutsch.
JSON: {"language":"de|en","subject":"…","body":"…"}`,
    { maxTokens: 700 }
  );
  return draft?.body ? draft : templateDraft(row);
}

async function sendMail(queueRow, contact) {
  if (!process.env.SMTP_HOST || !contact?.includes("@")) return false;
  let nodemailer;
  try {
    nodemailer = (await import("nodemailer")).default;
  } catch {
    return false;
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: contact,
    subject: queueRow.subject,
    text: queueRow.body,
  });
  return true;
}

export async function outreach(batch = 10) {
  const database = db();

  // 1) Entwürfe für qualifizierte Ziele ohne Queue-Eintrag erzeugen
  const candidates = database
    .prepare(
      `SELECT b.*, c.name AS company_name, c.industry, c.locations, c.domain
       FROM backlinks b JOIN companies c ON c.id = b.company_id
       WHERE b.status = 'Recherche' AND COALESCE(b.score, 0) >= ?
         AND NOT EXISTS (SELECT 1 FROM outreach_queue q WHERE q.backlink_id = b.id)
       ORDER BY b.score DESC LIMIT ?`
    )
    .all(MIN_SCORE, batch);

  for (const row of candidates) {
    const draft = await draftFor(row);
    database
      .prepare(
        `INSERT INTO outreach_queue (backlink_id, company_id, channel, language, subject, body, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, 'Entwurf', ?)`
      )
      .run(row.id, row.company_id, row.channel || "telefon", draft.language || "de", draft.subject || "", draft.body || "", `Score ${row.score} · ${row.source}`);
  }
  if (candidates.length) logRun("outreach", `${candidates.length} Entwürfe erzeugt`);

  // 2) Versand: automatisch nur bei AUTO_SEND + erlaubtem Kanal, sonst nur "Genehmigt"-Zeilen
  const sendables = database
    .prepare(
      `SELECT q.*, b.contact, b.source FROM outreach_queue q
       JOIN backlinks b ON b.id = q.backlink_id
       WHERE q.status IN ('Entwurf','Genehmigt') AND q.channel LIKE 'email%'`
    )
    .all();

  let sent = 0;
  for (const q of sendables) {
    const allowed =
      q.status === "Genehmigt" ||
      (process.env.AUTO_SEND === "true" && autoSendAllowed(q.channel));
    if (!allowed) continue;
    const ok = await sendMail(q, q.contact);
    if (ok) {
      database
        .prepare("UPDATE outreach_queue SET status = 'Gesendet', sent_at = datetime('now') WHERE id = ?")
        .run(q.id);
      database
        .prepare("UPDATE backlinks SET status = 'Kontaktiert', updated_at = datetime('now') WHERE id = ?")
        .run(q.backlink_id);
      sent++;
    }
  }
  logRun("outreach", `${sent} Nachrichten versendet (AUTO_SEND=${process.env.AUTO_SEND || "false"})`);
  return { drafted: candidates.length, sent };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  outreach();
}
