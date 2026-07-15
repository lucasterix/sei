// Postfach-Anbindung (optional, aktiviert sich mit IMAP_HOST in engine/.env):
// (a) Antworten auf gesendete Outreach-Mails erkennen → Queue-Status "Beantwortet"
// (b) Journalistenanfragen-Mails (Ordner IMAP_JOURNALIST_FOLDER) → engine/inbox/*.txt
//     für journalist.mjs exportieren.
import fs from "node:fs";
import path from "node:path";
import { ROOT, db, logRun, loadEnv } from "./lib.mjs";

loadEnv();

export async function inbox() {
  const { IMAP_HOST, IMAP_USER, IMAP_PASS } = process.env;
  if (!IMAP_HOST || !IMAP_USER || !IMAP_PASS) {
    logRun("inbox", "übersprungen (IMAP_HOST/USER/PASS fehlen)");
    return;
  }
  let ImapFlow;
  try {
    ({ ImapFlow } = await import("imapflow"));
  } catch {
    logRun("inbox", "übersprungen (imapflow nicht installiert — npm install)");
    return;
  }

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: Number(process.env.IMAP_PORT || 993),
    secure: true,
    auth: { user: IMAP_USER, pass: IMAP_PASS },
    logger: false,
  });
  await client.connect();

  // (a) Antwort-Erkennung: ungelesene Mails gegen gesendete Betreffs matchen
  const sent = db()
    .prepare("SELECT id, subject FROM outreach_queue WHERE status = 'Gesendet'")
    .all();
  let answered = 0;
  const lock = await client.getMailboxLock("INBOX");
  try {
    for await (const msg of client.fetch({ seen: false }, { envelope: true })) {
      const subject = (msg.envelope.subject || "").toLowerCase();
      const hit = sent.find((s) => s.subject && subject.includes(s.subject.toLowerCase().slice(0, 60)));
      if (hit) {
        db()
          .prepare("UPDATE outreach_queue SET status = 'Beantwortet', notes = trim(notes || ' | Antwort von ' || ?) WHERE id = ?")
          .run(msg.envelope.from?.[0]?.address ?? "unbekannt", hit.id);
        answered++;
      }
    }
  } finally {
    lock.release();
  }
  logRun("inbox", `${answered} Antworten erkannt`);

  // (b) Journalistenanfragen exportieren
  const folder = process.env.IMAP_JOURNALIST_FOLDER;
  if (folder) {
    const inboxDir = path.join(ROOT, "engine", "inbox");
    fs.mkdirSync(inboxDir, { recursive: true });
    let exported = 0;
    const jLock = await client.getMailboxLock(folder);
    try {
      for await (const msg of client.fetch({ seen: false }, { envelope: true, bodyParts: ["text"] })) {
        const text = msg.bodyParts?.get("text")?.toString("utf8") ?? "";
        const name = `anfrage-${msg.uid}.txt`;
        fs.writeFileSync(
          path.join(inboxDir, name),
          `Von: ${msg.envelope.from?.[0]?.address ?? "?"}\nBetreff: ${msg.envelope.subject ?? "?"}\n\n${text}`.slice(0, 8000)
        );
        await client.messageFlagsAdd(msg.uid, ["\\Seen"], { uid: true });
        exported++;
      }
    } finally {
      jLock.release();
    }
    logRun("inbox", `${exported} Journalistenanfragen nach engine/inbox/ exportiert`);
  }

  await client.logout();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  inbox();
}
