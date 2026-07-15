"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import {
  BACKLINK_STATUS,
  CONTENT_STATUS,
  CAMPAIGN_STATUS,
  TASK_STATUS,
  INTEGRATION_STATUS,
  OUTREACH_STATUS,
} from "@/lib/format";

export type ItemKind = "backlink" | "content" | "campaign" | "task" | "integration" | "keyword" | "outreach";

const TARGETS: Record<ItemKind, { table: string; statuses: readonly string[]; touch?: boolean }> = {
  backlink: { table: "backlinks", statuses: BACKLINK_STATUS, touch: true },
  content: { table: "content_items", statuses: CONTENT_STATUS },
  campaign: { table: "campaigns", statuses: CAMPAIGN_STATUS },
  task: { table: "tasks", statuses: TASK_STATUS },
  integration: { table: "integrations", statuses: INTEGRATION_STATUS },
  keyword: { table: "keywords", statuses: [] },
  outreach: { table: "outreach_queue", statuses: OUTREACH_STATUS },
};

function refresh() {
  revalidatePath("/", "layout");
}

const s = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const n = (fd: FormData, key: string): number | null => {
  const raw = s(fd, key).replace(",", ".");
  if (!raw) return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
};

export async function setStatus(kind: ItemKind, id: number, status: string) {
  const target = TARGETS[kind];
  if (!target || !target.statuses.includes(status)) return;
  const touch = target.touch ? ", updated_at = datetime('now')" : "";
  getDb().prepare(`UPDATE ${target.table} SET status = ?${touch} WHERE id = ?`).run(status, id);
  refresh();
}

export async function removeItem(kind: ItemKind, id: number) {
  const target = TARGETS[kind];
  if (!target || kind === "integration") return;
  getDb().prepare(`DELETE FROM ${target.table} WHERE id = ?`).run(id);
  refresh();
}

export async function createCompany(fd: FormData) {
  const name = s(fd, "name");
  const domain = s(fd, "domain").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!name || !domain) return;
  const slot = (getDb().prepare("SELECT COUNT(*) AS n FROM companies").get() as { n: number }).n + 1;
  getDb().prepare(
    "INSERT INTO companies (name, domain, industry, locations, notes, color_slot) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(name, domain, s(fd, "industry"), s(fd, "locations"), s(fd, "notes"), slot);
  refresh();
}

export async function createKeyword(fd: FormData) {
  const companyId = n(fd, "company_id");
  const keyword = s(fd, "keyword").toLowerCase();
  if (!companyId || !keyword) return;
  getDb().prepare(
    "INSERT INTO keywords (company_id, keyword, target_url, search_volume, intent, priority) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(companyId, keyword, s(fd, "target_url"), n(fd, "search_volume"), s(fd, "intent") || "Lokal", s(fd, "priority") || "Mittel");
  refresh();
}

export async function recordPosition(fd: FormData) {
  const keywordId = n(fd, "keyword_id");
  const position = n(fd, "position");
  if (!keywordId) return;
  getDb().prepare("INSERT INTO keyword_checks (keyword_id, checked_at, position) VALUES (?, date('now'), ?)").run(
    keywordId,
    position && position > 0 ? Math.round(position) : null
  );
  refresh();
}

export async function createBacklink(fd: FormData) {
  const companyId = n(fd, "company_id");
  const source = s(fd, "source");
  if (!companyId || !source) return;
  getDb().prepare(
    `INSERT INTO backlinks (company_id, source, source_url, target_url, anchor_text, link_type, tier, rel, status, cost, contact, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    companyId,
    source,
    s(fd, "source_url"),
    s(fd, "target_url"),
    s(fd, "anchor_text"),
    s(fd, "link_type") || "Verzeichnis",
    n(fd, "tier") ?? 1,
    s(fd, "rel") || "follow",
    s(fd, "status") || "Idee",
    n(fd, "cost"),
    s(fd, "contact"),
    s(fd, "notes")
  );
  refresh();
}

export async function createContent(fd: FormData) {
  const companyId = n(fd, "company_id");
  const title = s(fd, "title");
  if (!companyId || !title) return;
  getDb().prepare(
    `INSERT INTO content_items (company_id, title, target_keyword, format, status, planned_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(companyId, title, s(fd, "target_keyword"), s(fd, "format") || "Blogartikel", s(fd, "status") || "Idee", s(fd, "planned_date") || null, s(fd, "notes"));
  refresh();
}

export async function createCampaign(fd: FormData) {
  const companyId = n(fd, "company_id");
  const name = s(fd, "name");
  if (!companyId || !name) return;
  getDb().prepare(
    "INSERT INTO campaigns (company_id, platform, name, monthly_budget, goal, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(companyId, s(fd, "platform") || "Google Ads", name, n(fd, "monthly_budget"), s(fd, "goal"), s(fd, "status") || "Geplant", s(fd, "notes"));
  refresh();
}

export async function createTask(fd: FormData) {
  const title = s(fd, "title");
  if (!title) return;
  getDb().prepare(
    "INSERT INTO tasks (company_id, title, area, due_date, priority, status, notes) VALUES (?, ?, ?, ?, ?, 'Offen', ?)"
  ).run(n(fd, "company_id"), title, s(fd, "area") || "Sonstiges", s(fd, "due_date") || null, s(fd, "priority") || "Mittel", s(fd, "notes"));
  refresh();
}
