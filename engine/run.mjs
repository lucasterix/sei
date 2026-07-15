#!/usr/bin/env node
// Orchestrator: kompletter Engine-Lauf (Cron-Einstiegspunkt).
//   node engine/run.mjs            → alle Stufen
//   node engine/run.mjs --dry      → ohne Claude/Versand (deterministische Fallbacks)
//   node engine/run.mjs prospect   → einzelne Stufe
import { loadEnv, logRun, db } from "./lib.mjs";
import { prospect } from "./prospect.mjs";
import { qualify } from "./qualify.mjs";
import { outreach } from "./outreach.mjs";
import { monitor } from "./monitor.mjs";

loadEnv();
const args = process.argv.slice(2);
if (args.includes("--dry")) {
  process.env.ENGINE_NO_CLAUDE = "1";
  process.env.AUTO_SEND = "false";
}
const stage = args.find((a) => !a.startsWith("--"));

const stages = { prospect, qualify, outreach, monitor };

const started = Date.now();
logRun("run", `Engine-Lauf startet (${stage || "alle Stufen"}${args.includes("--dry") ? ", dry" : ""})`);

if (stage && stages[stage]) {
  await stages[stage]();
} else {
  await prospect();
  await qualify();
  await outreach();
  await monitor();
}

const stats = db()
  .prepare(
    `SELECT
      (SELECT COUNT(*) FROM backlinks WHERE status = 'Idee') AS ideen,
      (SELECT COUNT(*) FROM backlinks WHERE status = 'Recherche') AS recherche,
      (SELECT COUNT(*) FROM backlinks WHERE status = 'Kontaktiert') AS kontaktiert,
      (SELECT COUNT(*) FROM backlinks WHERE status = 'Live') AS live,
      (SELECT COUNT(*) FROM outreach_queue WHERE status = 'Entwurf') AS entwuerfe,
      (SELECT COUNT(*) FROM outreach_queue WHERE status = 'Gesendet') AS gesendet`
  )
  .get();

logRun(
  "run",
  `fertig in ${Math.round((Date.now() - started) / 1000)}s — Pipeline: ${stats.ideen} Ideen · ${stats.recherche} Recherche · ${stats.kontaktiert} kontaktiert · ${stats.live} live | Queue: ${stats.entwuerfe} Entwürfe · ${stats.gesendet} gesendet`
);
