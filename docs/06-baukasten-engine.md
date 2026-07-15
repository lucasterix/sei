# 06 — Der Baukasten: Autonome Backlink-Engine

Zielbild: Die Agentur betreibt eine **Maschine**, die je Unternehmen dauerhaft
Linkaufbau-Arbeit erledigt — Chancen finden, bewerten, ansprechen, nachhalten —
**ohne dass ein Mensch eingreifen muss**. Menschlicher Input wird zum optionalen
Qualitäts-Regler, nicht zur Voraussetzung. Die konkrete Kundenwebsite (Wix o. ä.)
ist dafür egal: Die Engine arbeitet von außen.

## 1. Architektur

```
┌──────────────────────── Steuerung (Mensch, optional) ───────────────────────┐
│  Dashboard: Pipelines einsehen, Entwürfe genehmigen, Regler stellen          │
└──────────────────────────────────────────────────────────────────────────────┘
                    ▲ liest/schreibt dieselbe SQLite-DB ▼
┌──────────────────────── Engine (autonom, Cron) ──────────────────────────────┐
│ 1 prospect  → findet Linkchancen (Kataloge, SERP-Recherche, Claude-Ideen)    │
│ 2 qualify   → prüft Quelle, bewertet 0–100, ordnet Kanal + Rechts-Gate zu    │
│ 3 outreach  → schreibt personalisierte Nachrichten; versendet nur auf        │
│               freigegebenen Kanälen (Legal-Gate), sonst Entwurf in Queue     │
│ 4 monitor   → prüft Live-Links, misst Rankings (DataForSEO), pflegt Status   │
└──────────────────────────────────────────────────────────────────────────────┘
        ▼ nutzt                                            ▼ nutzt
  Claude (CLI `claude -p` oder API)          Daten-APIs (DataForSEO, SMTP, …)
```

- **Zustand = die Dashboard-DB** (`dashboard/data/agentur.db`). Die Engine füllt
  die Backlink-Pipeline und die neue **Outreach-Queue**; das Dashboard zeigt beides.
- **Intelligenz**: bevorzugt über das vorhandene Claude-Code-Abo (`claude -p`,
  headless), alternativ `ANTHROPIC_API_KEY`; ohne beides laufen deterministische
  Fallbacks (Kataloge, Templates) — die Maschine bleibt funktionsfähig.
- **Takt**: Cron/launchd (täglich/wöchentlich). Jeder Lauf ist idempotent
  (Dedup je Quelle+Unternehmen) und protokolliert sich in `engine_runs`.

## 2. Autonomie-Stufen (der ehrliche Teil)

| Stufe | Was | Autonom? |
|---|---|---|
| Prospecting, Qualifizierung, Priorisierung | Chancen finden & bewerten | ✅ voll |
| Verzeichnis-/Citation-Registrierungen | Einträge vorbereiten | ✅ Daten + Anleitung; Registrierung selbst später via Browser-Agent |
| Nachrichten-Erstellung | personalisierte Entwürfe DE/EN | ✅ voll |
| **Versand: Journalistenanfragen-Antworten** | Reaktion auf öffentliche Anfragen (HEJA etc.) | ✅ auto-versendbar (erbetene Zusendung) |
| **Versand: International (EN, B2B, Opt-out)** | z. B. Fachblogs/Ressourcenlisten außerhalb DE | ✅ auto-versendbar per Schalter `AUTO_SEND_INTERNATIONAL` |
| **Versand: Bestandskontakte** | dokumentierte Beziehung/Einwilligung | ✅ auto nach Kontakt-Flag |
| **Versand: Kalt-E-Mail an DE-Empfänger** | — | 🔴 bleibt Entwurf. § 7 UWG: ab der ersten Mail abmahnfähig. Die Engine erzeugt versandfertige Entwürfe + Kontaktweg (Telefonliste/Formular-Text); Klick = bewusste Entscheidung. |
| Google-Konformität | keine Linkkauf-Pakete, keine PBN-Automatik | Leitplanke in Prompts + Qualifizierung (lehnt Spam-Quellen ab) |

Die Maschine ist also zu ~80–90 % vollautonom; der Rest ist kein technisches,
sondern ein Rechts-Gate — als **Schalter** implementiert, nicht als Doktrin.
Standard: `AUTO_SEND=false` (alles Entwurf). Wer die Schalter umlegt, kennt das Risiko.

## 3. Kanal-Taxonomie (Feld `channel` je Linkziel)

`journalist` (Antwort auf Anfrage) · `email_int` (international, EN) ·
`email_bestand` (dokumentierte Beziehung) · `formular` (Kontaktformular-Text) ·
`telefon` (Gesprächsleitfaden) · `registrierung` (Verzeichnis-Eintrag).
Auto-Versand-Set: `journalist`, `email_int`*, `email_bestand` (*bei aktivem Schalter)
— plus alles, was im Dashboard manuell auf **Genehmigt** gestellt wird.

## 4. Owned Assets statt Kunden-CMS

Langfristige Linkquelle Nr. 1 bleibt **Inhalt, der Links verdient**. Damit das ohne
Kunden-CMS (Wix-Frage!) funktioniert, gehören der Agentur eigene, ehrliche Properties:
ein Ratgeber-/Tool-Hub je Branche (transparent betrieben, echte Inhalte, Rechner,
Statistik-Seiten), der auf Kunden verweist und selbst Links anzieht. **Kein**
PBN-Netz aus Pseudo-Seiten — eine gute Property pro Branche, nicht zwanzig leere.
Die Content-Produktion dafür liefert claude-blog; Deployment als statische Site ist
Ausbaustufe der Engine (`asset-factory`).

## 5. Roadmap der Engine

- **v0 ✅:** Skripte prospect/qualify/outreach/monitor + Outreach-Queue im
  Dashboard, Legal-Gates, Cron-fähig, Fallbacks ohne API-Keys.
- **v1 (Code fertig, wartet auf Zugangsdaten):** Rankings nightly (DataForSEO in
  `monitor`), SMTP-Versand (`outreach`), Antwort-Erkennung per IMAP (`inbox`) →
  Status „Beantwortet“. Aktivierung: `engine/.env` befüllen (`npm run engine:check`).
- **v2 (teilweise ✅):** Journalistenanfragen-Ingestion läuft (`journalist`:
  inbox-Ordner + IMAP-Export, Matching, Antwortentwurf — end-to-end getestet).
  Offen: Konkurrenz-Backlink-Gaps als Prospect-Quelle (DataForSEO), Browser-Agent
  für Verzeichnis-Registrierungen.
- **v3 (teilweise ✅):** Monatsberichte als Markdown (`report`) laufen. Offen:
  PDF-Rendering/Versand, Asset-Factory (Hub-Deployments), Multi-Host-Betrieb
  (kleiner Server statt Laptop).
