import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

// Eine DB-Instanz pro Prozess (Next.js Hot-Reload-sicher über globalThis).
// Lazy geöffnet, damit der Import keinen Seiteneffekt hat (Next-Build startet
// mehrere Worker-Prozesse); busy_timeout lässt parallele Zugriffe warten.
const globalForDb = globalThis as unknown as { __agencyDb?: DatabaseSync };

function open(): DatabaseSync {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "agentur.db"));
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__agencyDb) {
    globalForDb.__agencyDb = open();
  }
  return globalForDb.__agencyDb;
}

function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      industry TEXT DEFAULT '',
      locations TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      color_slot INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      keyword TEXT NOT NULL,
      target_url TEXT DEFAULT '',
      search_volume INTEGER,
      intent TEXT DEFAULT 'Lokal',
      priority TEXT DEFAULT 'Mittel',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS keyword_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword_id INTEGER NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
      checked_at TEXT NOT NULL,
      position INTEGER
    );

    CREATE TABLE IF NOT EXISTS backlinks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      source TEXT NOT NULL,
      source_url TEXT DEFAULT '',
      target_url TEXT DEFAULT '',
      anchor_text TEXT DEFAULT '',
      link_type TEXT DEFAULT 'Verzeichnis',
      tier INTEGER NOT NULL DEFAULT 1,
      rel TEXT DEFAULT 'follow',
      status TEXT NOT NULL DEFAULT 'Idee',
      cost REAL,
      contact TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      target_keyword TEXT DEFAULT '',
      format TEXT DEFAULT 'Blogartikel',
      status TEXT NOT NULL DEFAULT 'Idee',
      planned_date TEXT,
      published_url TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      platform TEXT NOT NULL DEFAULT 'Google Ads',
      name TEXT NOT NULL,
      monthly_budget REAL,
      goal TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Geplant',
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      area TEXT DEFAULT 'Sonstiges',
      due_date TEXT,
      priority TEXT DEFAULT 'Mittel',
      status TEXT NOT NULL DEFAULT 'Offen',
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'API',
      status TEXT NOT NULL DEFAULT 'Fehlt',
      notes TEXT DEFAULT ''
    );
  `);

  seed(db);
}

/** Demo-/Startdaten für Unternehmen Nr. 1 — nur wenn die DB leer ist. */
function seed(db: DatabaseSync) {
  // IMMEDIATE-Transaktion + erneuter Count-Check: verhindert Doppel-Seed,
  // wenn mehrere Prozesse (Build-Worker) gleichzeitig initialisieren.
  db.exec("BEGIN IMMEDIATE;");
  try {
    seedInTx(db);
    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  }
}

function seedInTx(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM companies").get() as { n: number };
  if (count.n > 0) return;

  const insCompany = db.prepare(
    "INSERT INTO companies (name, domain, industry, locations, notes, color_slot) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const frohzeit = insCompany.run(
    "FrohZeit Gesundheitsdienstleistungen GmbH",
    "froehlichdienste.de",
    "Ambulante Betreuung & Pflege",
    "Göttingen, Northeim, Hildesheim, Karlsruhe (+ weitere Standorte)",
    "Wix-Website, dünner Content, kein Blog, kein Schema-Markup. Nebengeschäft: Betreuungssoftware FRIEDA (B2B) und Gründungsberatung. Bestehendes Linkable Asset: Pflegegeldrechner.",
    1
  ).lastInsertRowid as number;

  const insKeyword = db.prepare(
    "INSERT INTO keywords (company_id, keyword, target_url, search_volume, intent, priority) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insCheck = db.prepare(
    "INSERT INTO keyword_checks (keyword_id, checked_at, position) VALUES (?, ?, ?)"
  );

  // Wochenweise Demo-Messpunkte, letzte = heute.
  const weekly = (offsetWeeks: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetWeeks * 7);
    return d.toISOString().slice(0, 10);
  };

  const seedKeywords: Array<{
    kw: string; url: string; vol: number | null; intent: string; prio: string; history: (number | null)[];
  }> = [
    { kw: "betreuungsdienst göttingen", url: "/standorte/goettingen", vol: 170, intent: "Lokal", prio: "Hoch", history: [14, 12, 12, 9, 8, 7] },
    { kw: "alltagsbegleitung göttingen", url: "/leistungen/alltagsbegleitung", vol: 90, intent: "Lokal", prio: "Hoch", history: [22, 19, 15, 16, 12, 11] },
    { kw: "verhinderungspflege göttingen", url: "/leistungen/verhinderungspflege", vol: 70, intent: "Lokal", prio: "Hoch", history: [null, 28, 25, 21, 18, 14] },
    { kw: "haushaltshilfe pflegekasse", url: "/ratgeber/haushaltshilfe-pflegekasse", vol: 1900, intent: "Transaktional", prio: "Mittel", history: [null, null, 45, 38, 31, 28] },
    { kw: "entlastungsbetrag §45b sgb xi", url: "/ratgeber/entlastungsbetrag", vol: 4400, intent: "Informational", prio: "Hoch", history: [null, null, null, 52, 44, 37] },
    { kw: "pflegegeldrechner", url: "/pflegegeldrechner", vol: 8100, intent: "Informational", prio: "Hoch", history: [31, 29, 24, 22, 19, 17] },
    { kw: "wohnumfeldverbessernde maßnahmen", url: "/leistungen/wohnumfeld", vol: 2900, intent: "Informational", prio: "Mittel", history: [40, 35, 33, 27, 26, 22] },
    { kw: "betreuungsdienst gründen", url: "/beratung/gruendung", vol: 480, intent: "Informational", prio: "Mittel", history: [18, 15, 13, 13, 10, 9] },
    { kw: "betreuungssoftware", url: "/software/frieda", vol: 320, intent: "Transaktional", prio: "Mittel", history: [null, 44, 39, 33, 30, 26] },
    { kw: "erste hilfe kurs göttingen", url: "/kurse/erste-hilfe", vol: 1300, intent: "Lokal", prio: "Niedrig", history: [55, 51, 48, 45, 47, 41] },
  ];

  for (const k of seedKeywords) {
    const id = insKeyword.run(frohzeit, k.kw, k.url, k.vol, k.intent, k.prio).lastInsertRowid as number;
    k.history.forEach((pos, i) => {
      if (pos !== null) insCheck.run(id, weekly(k.history.length - 1 - i), pos);
    });
  }

  const insBacklink = db.prepare(
    `INSERT INTO backlinks (company_id, source, source_url, target_url, anchor_text, link_type, tier, rel, status, cost, contact, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const seedBacklinks: Array<[string, string, string, string, string, number, string, string, number | null, string, string]> = [
    ["Google Business Profile (alle Standorte)", "https://business.google.com", "/", "FrohZeit Betreuungsdienst", "Verzeichnis", 1, "nofollow", "Live", null, "", "Wichtigster Local-Hebel — Kategorie, Fotos, Beiträge, Q&A pflegen."],
    ["Bing Places", "https://www.bingplaces.com", "/", "FrohZeit", "Verzeichnis", 1, "nofollow", "Recherche", null, "", "Datenquelle für ChatGPT-Lokalsuche — kostenlos eintragen."],
    ["11880.com", "https://www.11880.com", "/", "Betreuungsdienst Göttingen", "Verzeichnis", 1, "nofollow", "Kontaktiert", null, "", "NAP exakt wie GBP halten."],
    ["Gelbe Seiten", "https://www.gelbeseiten.de", "/", "FrohZeit Gesundheitsdienstleistungen", "Verzeichnis", 1, "nofollow", "Idee", null, "", ""],
    ["pflege.de Anbieterverzeichnis", "https://www.pflege.de", "/leistungen/alltagsbegleitung", "Betreuungsdienst", "Verzeichnis", 1, "nofollow", "Recherche", null, "", "Branchenrelevantestes Verzeichnis für Pflege/Betreuung."],
    ["Stadt Göttingen — Seniorenwegweiser", "https://www.goettingen.de", "/", "FrohZeit Betreuungsdienst", "Partner/Verein", 1, "follow", "Idee", null, "Seniorenbeauftragte:r der Stadt", "Kommunale Wegweiser verlinken lokale Anbieter — telefonisch anfragen (kein Kalt-Mailing, §7 UWG)."],
    ["Pflegestützpunkt Landkreis Göttingen", "", "/", "Anbieter Entlastungsleistungen", "Partner/Verein", 1, "follow", "Idee", null, "", "Anerkannte Anbieter nach §45b werden gelistet."],
    ["Göttinger Tageblatt", "https://www.goettinger-tageblatt.de", "/ratgeber/entlastungsbetrag", "Studie Pflege in Südniedersachsen", "Presse/PR", 1, "follow", "Idee", null, "Lokalredaktion", "Datenstory: 'Entlastungsbetrag: So viel Geld lassen Familien in Südniedersachsen liegen'."],
    ["Fachblog Pflegehilfe (Gastbeitrag)", "", "/ratgeber/verhinderungspflege", "Verhinderungspflege richtig beantragen", "Gastbeitrag", 1, "follow", "Verhandlung", null, "", "Nur echtes Fachportal, natürlicher Anker."],
    ["SC Weende / Sportverein Sponsoring", "", "/", "FrohZeit", "Sponsoring", 1, "sponsored", "Idee", 250, "", "Bezahlter Link → rel='sponsored' + Kennzeichnung beim Verein. Wert: lokale Prominenz."],
    ["wlw.de (FRIEDA Software, B2B)", "https://www.wlw.de", "/software/frieda", "Betreuungssoftware", "Verzeichnis", 1, "nofollow", "Idee", null, "", "B2B-Sichtbarkeit für das Softwareprodukt."],
    ["LinkedIn-Artikel → verweist auf Tageblatt-Beitrag", "", "", "Studie Pflege Südniedersachsen", "Linkable Asset", 2, "nofollow", "Idee", null, "", "'Weißes Tier 2': verdiente Platzierung über eigene Kanäle verstärken (Amplifikation, kein Spam)."],
  ];
  for (const b of seedBacklinks) insBacklink.run(frohzeit, ...b);

  const insContent = db.prepare(
    `INSERT INTO content_items (company_id, title, target_keyword, format, status, planned_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const seedContent: Array<[string, string, string, string, string | null, string]> = [
    ["Entlastungsbetrag §45b: Anspruch prüfen und richtig nutzen", "entlastungsbetrag §45b sgb xi", "Ratgeber", "Briefing", weekly(-1), "Kern-Ratgeber, FAQ-Schema, CTA auf Kontakt. Mit /blog write erstellen."],
    ["Verhinderungspflege beantragen: Schritt-für-Schritt-Anleitung", "verhinderungspflege göttingen", "Ratgeber", "Idee", null, "Formular-Links der Kassen, lokale CTA-Boxen je Standort."],
    ["Landingpage: Alltagsbegleitung in Göttingen", "alltagsbegleitung göttingen", "Landingpage", "Entwurf", weekly(0), "Echter Lokalbezug: Team, Referenzen, Einzugsgebiet — keine Doorway-Page!"],
    ["Pflegegeldrechner aktualisieren (Werte 2026) + FAQ-Schema", "pflegegeldrechner", "Tool/Rechner", "Idee", null, "Bestehendes Linkable Asset stärken — zieht passiv Links."],
    ["Haushaltshilfe über die Pflegekasse abrechnen: So geht's", "haushaltshilfe pflegekasse", "Blogartikel", "Idee", null, "Hoher Suchvolumen-Hebel, national."],
    ["FRIEDA Betreuungssoftware: Funktionen & Preise", "betreuungssoftware", "Landingpage", "Idee", null, "Produktmarketing B2B, Basis für Google-Ads-Kampagne."],
  ];
  for (const c of seedContent) insContent.run(frohzeit, ...c);

  const insCampaign = db.prepare(
    `INSERT INTO campaigns (company_id, platform, name, monthly_budget, goal, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insCampaign.run(frohzeit, "Google Ads", "Betreuung Göttingen — Local Search", 600, "Anfragen Betreuung/Entlastung", "Geplant", "Mit /ads plan strukturieren; Conversion-Tracking zuerst!");
  insCampaign.run(frohzeit, "Meta Ads", "Mitarbeitergewinnung Alltagsbegleiter:innen", 400, "Bewerbungen", "Geplant", "Personalmangel = Wachstumsbremse; Recruiting-Funnel.");
  insCampaign.run(frohzeit, "Google Ads", "FRIEDA Software (B2B)", 300, "Demo-Anfragen", "Geplant", "Suchkampagne auf 'betreuungssoftware' u. ä.");

  const insTask = db.prepare(
    `INSERT INTO tasks (company_id, title, area, due_date, priority, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const seedTasks: Array<[string, string, number, string, string, string]> = [
    ["Google Business Profile für alle Standorte claimen & vollständig ausbauen", "Local SEO", 3, "Hoch", "In Arbeit", "Primärkategorie = wichtigster Einzelfaktor. Einzugsgebiete definieren."],
    ["Google Search Console + GA4 einrichten und verifizieren", "Reporting", 3, "Hoch", "Offen", "Ohne GSC keine Datenbasis für alles Weitere."],
    ["/seo audit https://froehlichdienste.de ausführen (claude-seo)", "Technik", 5, "Hoch", "Offen", "Voll-Audit als Baseline, PDF-Report ablegen."],
    ["LocalBusiness-Schema (JSON-LD) je Standortseite einbauen", "Technik", 10, "Hoch", "Offen", "Auf Wix über 'Benutzerdefinierter Code' pro Seite."],
    ["NAP-Konsistenz-Audit: alle bestehenden Einträge erfassen", "Local SEO", 7, "Mittel", "Offen", "Schreibweise exakt vereinheitlichen (Str./Straße, Rufnummern)."],
    ["Bewertungsprozess aufsetzen (QR-Karte + Nachfass im Bestandskontakt)", "Local SEO", 14, "Hoch", "Offen", "Neutral bitten, keine Anreize (UWG + Google-Richtlinie). Auf alle antworten."],
    ["Wix-Zugang beschaffen & prüfen ob Blog dort sinnvoll ist", "Technik", 7, "Hoch", "Offen", "Alternativ: Ratgeber-Hub als Subdomain (z. B. Astro/Next) erwägen."],
    ["Anmeldung Journalistenanfragen: HEJA + Recherchescout + Featured", "Backlinks", 14, "Mittel", "Offen", "Ein Monitoring für alle Kunden — Expertenprofil FrohZeit anlegen."],
    ["Standortseiten mit echtem Lokalbezug ausbauen (keine Doorway-Pages)", "Content", 21, "Mittel", "Offen", "Min. 400-600 Wörter unique, Team/Referenzen/Karte je Standort."],
  ];
  for (const t of seedTasks) {
    const due = new Date();
    due.setDate(due.getDate() + t[2]);
    insTask.run(frohzeit, t[0], t[1], due.toISOString().slice(0, 10), t[3], t[4], t[5]);
  }

  const insIntegration = db.prepare(
    "INSERT INTO integrations (name, category, status, notes) VALUES (?, ?, ?, ?)"
  );
  const seedIntegrations: Array<[string, string, string, string]> = [
    ["Google Search Console", "Google (kostenlos)", "Fehlt", "Klicks, Impressionen, Positionen, Indexierung. Service-Account oder OAuth; Property je Kunde."],
    ["Google Analytics 4", "Google (kostenlos)", "Fehlt", "Data API für Traffic/Conversions in Reports."],
    ["Google Business Profile", "Google (kostenlos)", "In Einrichtung", "Profil-Pflege + Performance-API (Anrufe, Routen, Aufrufe)."],
    ["Bing Webmaster Tools + Bing Places", "Microsoft (kostenlos)", "Fehlt", "Bing speist ChatGPT-Lokalsuche — Pflichttermin."],
    ["PageSpeed Insights / CrUX API", "Google (kostenlos)", "Fehlt", "Core Web Vitals für Audits & Monitoring (claude-seo nutzt das)."],
    ["DataForSEO (SERP + Labs)", "API (bezahlt)", "Fehlt", "Rank-Tracking google.de + Suchvolumen. Pay-as-you-go, von claude-seo als MCP unterstützt."],
    ["Backlink-Daten (DataForSEO Backlinks / Ahrefs / Moz)", "API (bezahlt)", "Fehlt", "Linkprofil-Monitoring + Konkurrenz-Gap. claude-seo: /seo backlinks nutzt Moz/Bing/CommonCrawl als Gratis-Basis."],
    ["Wix-Zugang froehlichdienste.de", "CMS-Zugang", "Fehlt", "Ohne CMS-Zugang keine On-Page-Umsetzung. Prüfen: Blog auf Wix vs. separater Ratgeber-Hub."],
    ["Google Ads + Conversion-Tracking", "Ads", "Fehlt", "Konto-Zugriff (MCC) für claude-ads; Conversions vor Kampagnenstart."],
    ["Meta Business Suite", "Ads", "Fehlt", "Für Recruiting-Kampagnen."],
    ["Journalistenanfragen (HEJA, Recherchescout, Featured)", "Backlinks/PR", "Fehlt", "Ein Monitoring, alle Kunden — legaler Outreach-Kanal (kein Kalt-Mailing!)."],
    ["Bewertungs-Workflow (QR-Karten, Antwort-Prozess)", "Local SEO", "Fehlt", "Anzahl × Schnitt × Aktualität — Rezenz zählt am stärksten."],
    ["claude-seo Plugin", "Claude Code", "Aktiv", "/seo audit, /seo local, /seo schema, /seo drift …"],
    ["claude-blog Plugin", "Claude Code", "Aktiv", "/blog strategy, /blog write, /blog calendar …"],
    ["claude-ads Plugin", "Claude Code", "Aktiv", "/ads setup, /ads audit, /ads plan … (read-only bis Freigabe)"],
  ];
  for (const i of seedIntegrations) insIntegration.run(...i);
}

// ---------- Typen ----------

export interface Company {
  id: number;
  name: string;
  domain: string;
  industry: string;
  locations: string;
  notes: string;
  color_slot: number;
  created_at: string;
}

export interface CompanyWithStats extends Company {
  keyword_count: number;
  top10_count: number;
  live_links: number;
  pipeline_links: number;
  content_open: number;
  tasks_open: number;
}

export interface KeywordRow {
  id: number;
  company_id: number;
  company_name: string;
  color_slot: number;
  keyword: string;
  target_url: string;
  search_volume: number | null;
  intent: string;
  priority: string;
  latest_position: number | null;
  prev_position: number | null;
}

export interface Backlink {
  id: number;
  company_id: number;
  company_name: string;
  color_slot: number;
  source: string;
  source_url: string;
  target_url: string;
  anchor_text: string;
  link_type: string;
  tier: number;
  rel: string;
  status: string;
  cost: number | null;
  contact: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: number;
  company_id: number;
  company_name: string;
  color_slot: number;
  title: string;
  target_keyword: string;
  format: string;
  status: string;
  planned_date: string | null;
  published_url: string;
  notes: string;
}

export interface Campaign {
  id: number;
  company_id: number;
  company_name: string;
  color_slot: number;
  platform: string;
  name: string;
  monthly_budget: number | null;
  goal: string;
  status: string;
  notes: string;
}

export interface Task {
  id: number;
  company_id: number | null;
  company_name: string | null;
  color_slot: number | null;
  title: string;
  area: string;
  due_date: string | null;
  priority: string;
  status: string;
  notes: string;
}

export interface Integration {
  id: number;
  name: string;
  category: string;
  status: string;
  notes: string;
}

// ---------- Abfragen ----------

const companyFilter = (companyId?: number) => (companyId ? " AND x.company_id = ? " : " ");

export function listCompanies(): Company[] {
  return getDb().prepare("SELECT * FROM companies ORDER BY id").all() as unknown as Company[];
}

export function getCompany(id: number): Company | undefined {
  return getDb().prepare("SELECT * FROM companies WHERE id = ?").get(id) as unknown as Company | undefined;
}

export function listCompaniesWithStats(): CompanyWithStats[] {
  return getDb()
    .prepare(
      `SELECT c.*,
        (SELECT COUNT(*) FROM keywords k WHERE k.company_id = c.id) AS keyword_count,
        (SELECT COUNT(*) FROM keywords k WHERE k.company_id = c.id AND (
          SELECT kc.position FROM keyword_checks kc WHERE kc.keyword_id = k.id ORDER BY kc.checked_at DESC, kc.id DESC LIMIT 1
        ) <= 10) AS top10_count,
        (SELECT COUNT(*) FROM backlinks b WHERE b.company_id = c.id AND b.status = 'Live') AS live_links,
        (SELECT COUNT(*) FROM backlinks b WHERE b.company_id = c.id AND b.status NOT IN ('Live','Abgelehnt','Verloren')) AS pipeline_links,
        (SELECT COUNT(*) FROM content_items ci WHERE ci.company_id = c.id AND ci.status != 'Veröffentlicht') AS content_open,
        (SELECT COUNT(*) FROM tasks t WHERE t.company_id = c.id AND t.status != 'Erledigt') AS tasks_open
      FROM companies c ORDER BY c.id`
    )
    .all() as unknown as CompanyWithStats[];
}

export function listKeywords(companyId?: number): KeywordRow[] {
  const sql = `SELECT x.*, c.name AS company_name, c.color_slot,
      (SELECT kc.position FROM keyword_checks kc WHERE kc.keyword_id = x.id ORDER BY kc.checked_at DESC, kc.id DESC LIMIT 1) AS latest_position,
      (SELECT kc.position FROM keyword_checks kc WHERE kc.keyword_id = x.id ORDER BY kc.checked_at DESC, kc.id DESC LIMIT 1 OFFSET 1) AS prev_position
    FROM keywords x JOIN companies c ON c.id = x.company_id
    WHERE 1=1 ${companyFilter(companyId)}
    ORDER BY c.id, x.priority = 'Hoch' DESC, x.search_volume DESC`;
  const stmt = getDb().prepare(sql);
  return (companyId ? stmt.all(companyId) : stmt.all()) as unknown as KeywordRow[];
}

export function keywordHistory(keywordId: number, limit = 12): number[] {
  const rows = getDb()
    .prepare(
      "SELECT position FROM keyword_checks WHERE keyword_id = ? AND position IS NOT NULL ORDER BY checked_at DESC, id DESC LIMIT ?"
    )
    .all(keywordId, limit) as unknown as { position: number }[];
  return rows.map((r) => r.position).reverse();
}

export function listBacklinks(companyId?: number): Backlink[] {
  const sql = `SELECT x.*, c.name AS company_name, c.color_slot
    FROM backlinks x JOIN companies c ON c.id = x.company_id
    WHERE 1=1 ${companyFilter(companyId)}
    ORDER BY x.updated_at DESC`;
  const stmt = getDb().prepare(sql);
  return (companyId ? stmt.all(companyId) : stmt.all()) as unknown as Backlink[];
}

export function listContent(companyId?: number): ContentItem[] {
  const sql = `SELECT x.*, c.name AS company_name, c.color_slot
    FROM content_items x JOIN companies c ON c.id = x.company_id
    WHERE 1=1 ${companyFilter(companyId)}
    ORDER BY COALESCE(x.planned_date, '9999') ASC, x.id DESC`;
  const stmt = getDb().prepare(sql);
  return (companyId ? stmt.all(companyId) : stmt.all()) as unknown as ContentItem[];
}

export function listCampaigns(companyId?: number): Campaign[] {
  const sql = `SELECT x.*, c.name AS company_name, c.color_slot
    FROM campaigns x JOIN companies c ON c.id = x.company_id
    WHERE 1=1 ${companyFilter(companyId)}
    ORDER BY x.status = 'Aktiv' DESC, x.id`;
  const stmt = getDb().prepare(sql);
  return (companyId ? stmt.all(companyId) : stmt.all()) as unknown as Campaign[];
}

export function listTasks(companyId?: number): Task[] {
  const sql = `SELECT x.*, c.name AS company_name, c.color_slot
    FROM tasks x LEFT JOIN companies c ON c.id = x.company_id
    WHERE 1=1 ${companyFilter(companyId)}
    ORDER BY x.status = 'Erledigt' ASC, COALESCE(x.due_date, '9999') ASC`;
  const stmt = getDb().prepare(sql);
  return (companyId ? stmt.all(companyId) : stmt.all()) as unknown as Task[];
}

export function listIntegrations(): Integration[] {
  return getDb()
    .prepare("SELECT * FROM integrations ORDER BY status = 'Aktiv' ASC, category, name")
    .all() as unknown as Integration[];
}

export interface GlobalStats {
  companies: number;
  keywords: number;
  top10: number;
  liveLinks: number;
  pipelineLinks: number;
  contentPublished: number;
  contentOpen: number;
  tasksOpen: number;
  adBudget: number;
}

export function globalStats(): GlobalStats {
  const one = (sql: string) => (getDb().prepare(sql).get() as { n: number }).n;
  return {
    companies: one("SELECT COUNT(*) AS n FROM companies"),
    keywords: one("SELECT COUNT(*) AS n FROM keywords"),
    top10: one(`SELECT COUNT(*) AS n FROM keywords k WHERE (
      SELECT kc.position FROM keyword_checks kc WHERE kc.keyword_id = k.id ORDER BY kc.checked_at DESC, kc.id DESC LIMIT 1) <= 10`),
    liveLinks: one("SELECT COUNT(*) AS n FROM backlinks WHERE status = 'Live'"),
    pipelineLinks: one("SELECT COUNT(*) AS n FROM backlinks WHERE status NOT IN ('Live','Abgelehnt','Verloren')"),
    contentPublished: one("SELECT COUNT(*) AS n FROM content_items WHERE status = 'Veröffentlicht'"),
    contentOpen: one("SELECT COUNT(*) AS n FROM content_items WHERE status != 'Veröffentlicht'"),
    tasksOpen: one("SELECT COUNT(*) AS n FROM tasks WHERE status != 'Erledigt'"),
    adBudget: (getDb().prepare("SELECT COALESCE(SUM(monthly_budget),0) AS n FROM campaigns WHERE status IN ('Geplant','Aktiv')").get() as { n: number }).n,
  };
}
