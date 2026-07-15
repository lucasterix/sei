// Setup-Check ("Doctor"): zeigt, welche Fähigkeiten der Engine aktiv sind.
//   npm run engine:check
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { db, DB_PATH, loadEnv } from "./lib.mjs";

const execFileP = promisify(execFile);
loadEnv();

function row(label, ok, hint) {
  console.log(`${ok ? "✅" : "⬜"} ${label.padEnd(34)} ${ok ? "aktiv" : `fehlt — ${hint}`}`);
}

let claudeCli = false;
try {
  await execFileP("claude", ["--version"], { timeout: 10000 });
  claudeCli = true;
} catch { /* nicht im PATH */ }

const counts = db()
  .prepare(
    `SELECT (SELECT COUNT(*) FROM companies) AS c, (SELECT COUNT(*) FROM backlinks) AS b,
            (SELECT COUNT(*) FROM outreach_queue) AS q, (SELECT COUNT(*) FROM engine_runs) AS r`
  )
  .get();

console.log("Engine-Setup-Check\n==================");
console.log(`DB: ${DB_PATH} — ${counts.c} Unternehmen · ${counts.b} Linkziele · ${counts.q} Queue · ${counts.r} Läufe\n`);

row("Claude-CLI (claude -p)", claudeCli, "Claude Code installieren/einloggen");
row("Anthropic-API-Key (Fallback)", !!process.env.ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY in engine/.env");
row("Rankings (DataForSEO)", !!process.env.DATAFORSEO_LOGIN, "DATAFORSEO_LOGIN/PASSWORD in engine/.env");
row("E-Mail-Versand (SMTP)", !!process.env.SMTP_HOST, "SMTP_HOST/USER/PASS in engine/.env");
row("Postfach-Erkennung (IMAP)", !!process.env.IMAP_HOST, "IMAP_HOST/USER/PASS in engine/.env");
row("Auto-Versand-Schalter", process.env.AUTO_SEND === "true", "AUTO_SEND=true (Rechts-Gates beachten!)");
console.log(
  `\nIntelligenz: ${claudeCli ? "Claude-CLI" : process.env.ANTHROPIC_API_KEY ? "Anthropic-API" : "nur Fallbacks (Kataloge/Templates)"}`
);
console.log("Automatisieren: crontab-Zeile in engine/README.md");
