// Gemeinsame Basis der Engine: DB, Env, Claude-Zugang (CLI → API → Fallback), Logging.
import { DatabaseSync } from "node:sqlite";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DB_PATH = path.join(ROOT, "dashboard", "data", "agentur.db");

export function loadEnv() {
  for (const f of [path.join(ROOT, "engine", ".env"), path.join(ROOT, "dashboard", ".env")]) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

let _db = null;
export function db() {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new DatabaseSync(DB_PATH);
  _db.exec("PRAGMA busy_timeout = 5000;");
  _db.exec("PRAGMA journal_mode = WAL;");
  // Engine-seitige Schema-Ergänzungen (idempotent; Dashboard legt Basistabellen an)
  _db.exec(`CREATE TABLE IF NOT EXISTS outreach_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backlink_id INTEGER,
    company_id INTEGER,
    channel TEXT DEFAULT '',
    language TEXT DEFAULT 'de',
    subject TEXT DEFAULT '',
    body TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Entwurf',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sent_at TEXT
  );
  CREATE TABLE IF NOT EXISTS engine_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    stage TEXT,
    summary TEXT
  );`);
  for (const sql of [
    "ALTER TABLE backlinks ADD COLUMN score INTEGER",
    "ALTER TABLE backlinks ADD COLUMN channel TEXT DEFAULT ''",
    "ALTER TABLE backlinks ADD COLUMN last_checked TEXT",
  ]) {
    try { _db.exec(sql); } catch { /* Spalte existiert schon */ }
  }
  return _db;
}

export function logRun(stage, summary) {
  db().prepare("INSERT INTO engine_runs (stage, summary) VALUES (?, ?)").run(stage, summary);
  console.log(`[${stage}] ${summary}`);
}

/**
 * Claude befragen. Reihenfolge: Claude-Code-CLI (`claude -p`, nutzt das Abo) →
 * Anthropic-API (ANTHROPIC_API_KEY) → null (Aufrufer nutzt Fallback).
 */
export async function askClaude(prompt, { system = "", maxTokens = 2000 } = {}) {
  if (process.env.ENGINE_NO_CLAUDE === "1") return null;
  // 1) Claude-Code-CLI headless
  try {
    const args = ["-p", prompt, "--output-format", "text"];
    if (system) args.push("--append-system-prompt", system);
    const { stdout } = await execFileP("claude", args, { timeout: 180000, maxBuffer: 4 * 1024 * 1024 });
    if (stdout?.trim()) return stdout.trim();
  } catch { /* CLI fehlt oder Fehler → API versuchen */ }
  // 2) Anthropic-API
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ENGINE_MODEL || "claude-sonnet-5",
        max_tokens: maxTokens,
        system: system || undefined,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim() || null;
  } catch {
    return null;
  }
}

/** Wie askClaude, aber erzwingt JSON-Antwort und parst robust. */
export async function askJson(prompt, opts = {}) {
  const raw = await askClaude(prompt + "\n\nAntworte AUSSCHLIESSLICH mit gültigem JSON, ohne Erklärtext.", opts);
  if (!raw) return null;
  const cleaned = raw.replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "").trim();
  for (const candidate of [cleaned, cleaned.match(/\[[\s\S]*\]|\{[\s\S]*\}/)?.[0]]) {
    if (!candidate) continue;
    try { return JSON.parse(candidate); } catch { /* nächster Versuch */ }
  }
  return null;
}

export function listCompanies() {
  return db().prepare("SELECT * FROM companies ORDER BY id").all();
}

export async function fetchText(url, timeout = 15000) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeout),
      headers: { "user-agent": "Mozilla/5.0 (Macintosh; SEO-Agentur-Monitor)" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Kanäle, die ohne menschliche Freigabe versendet werden dürfen (Legal-Gate). */
export function autoSendAllowed(channel) {
  const set = new Set(["journalist", "email_bestand"]);
  if (process.env.AUTO_SEND_INTERNATIONAL === "true") set.add("email_int");
  return set.has(channel);
}
