# SEO-Agentur-Projekt — Steuerzentrale & Playbooks

Dieses Repository ist die Kommandozentrale unserer Marketing-Agentur: Wir betreuen mehrere
Unternehmen mit SEO, Content, Backlink-Aufbau und Paid Media. Erstes Unternehmen:
**FrohZeit Gesundheitsdienstleistungen GmbH** ([froehlichdienste.de](https://froehlichdienste.de)).

## Aufbau

```
seo/
├── README.md                      ← diese Datei
├── docs/
│   ├── 01-strategie.md            ← Agentur-Strategie & Multi-Level-SEO (Grundsatz)
│   ├── 02-backlink-playbook.md    ← Langfristiges Backlink-System (inkl. Recht DE)
│   ├── 03-froehlichdienste.md     ← Playbook Unternehmen #1: FrohZeit
│   ├── 04-luecken-und-tools.md    ← Lückenanalyse + Tool-/API-Stack mit Kosten
│   └── 05-roadmap.md              ← 12-Monats-Roadmap & Monatsrhythmus
└── dashboard/                     ← Steuerungs-Frontend (Next.js + SQLite)
```

## Das Dashboard starten

```bash
cd dashboard
npm install        # einmalig
npm run dev        # → http://localhost:3000
```

Kein externer Dienst nötig: Daten liegen lokal in `dashboard/data/agentur.db`
(SQLite über das Node-Builtin `node:sqlite`, Node ≥ 22.5 erforderlich).
Beim ersten Start wird FrohZeit mit Start-Keywords, Linkzielen, Content-Ideen,
Aufgaben und der Integrations-Checkliste vorbefüllt.

**Module:** Übersicht (KPIs je Unternehmen) · Unternehmen · Aufgaben ·
Keywords & Rankings (mit Positionsverlauf) · Backlink-Pipeline (Kanban, Tier-Feld) ·
Content-Pipeline · Kampagnen · Playbooks (kopierbare Claude-Kommandos je Unternehmen) ·
Integrationen (die operative Lückenliste).

## Die drei Werkzeug-Repos

| Repo | Rolle | Wichtigste Kommandos |
|---|---|---|
| [claude-seo](https://github.com/AgriciDaniel/claude-seo) | Audits, Technik, Local SEO, Schema, Monitoring | `/seo audit`, `/seo local`, `/seo schema`, `/seo drift`, `/seo backlinks` |
| [claude-blog](https://github.com/AgriciDaniel/claude-blog) | Content-Strategie & -Produktion (5-Gate-Qualität) | `/blog strategy`, `/blog calendar`, `/blog write`, `/blog analyze` |
| [claude-ads](https://github.com/AgriciDaniel/claude-ads) | Paid Media über 12 Plattformen (read-only Start) | `/ads setup`, `/ads audit`, `/ads plan`, `/ads monitor` |

Arbeitsteilung: **Die Repos führen aus, das Dashboard koordiniert, die Docs geben die Strategie vor.**

## Einstieg

1. [docs/05-roadmap.md](docs/05-roadmap.md) lesen — dort steht, was diese Woche passiert.
2. Dashboard starten und die Seite **Integrationen** abarbeiten (Zugänge zuerst, insbesondere
   Google Search Console und Google-Business-Profile-API — deren Freigabe dauert Wochen).
3. `/seo audit https://froehlichdienste.de` als Baseline ausführen.
