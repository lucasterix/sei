# Engine — autonome Backlink-Pipeline

Vier Stufen, eine Datenbank (die des Dashboards), ein Cron-Eintrag. Konzept:
[docs/06-baukasten-engine.md](../docs/06-baukasten-engine.md).

```bash
npm run engine:check          # Setup-Doctor: welche Fähigkeiten sind aktiv?
npm run engine:dry            # Testlauf ohne Claude/Versand (Fallbacks)
npm run engine                # kompletter Lauf: inbox → journalist → prospect → qualify → outreach → monitor
npm run engine:report         # Monatsberichte je Unternehmen → reports/
node engine/run.mjs monitor   # einzelne Stufe (auch: journalist, inbox, report, …)
```

Ergebnis landet sichtbar im Dashboard: Backlink-Pipeline (neue Ziele mit Score/Kanal)
und **Outreach-Queue** (Entwürfe genehmigen/verwerfen).

## Journalistenanfragen (der vollautonome Kanal)

Anfragen von HEJA/Recherchescout/Featured als `.txt` in `engine/inbox/` ablegen — oder
per IMAP automatisch abholen lassen (`IMAP_JOURNALIST_FOLDER`). Die Engine matcht jede
Anfrage gegen alle Mandanten, legt die Presse-Chance in der Pipeline an und schreibt
eine zitierfähige Antwort in die Queue (Kanal `journalist` = auto-versendbar, denn die
Zusendung ist erbeten). Erfundene Zahlen sind per Prompt verboten — Platzhalter
`[ZAHL PRÜFEN: …]`/`[NAME]` vor Versand füllen bzw. bei AUTO_SEND darauf vertrauen,
dass nur belegbare Aussagen enthalten sind (Stichprobe empfohlen).

## Monatsberichte

`npm run engine:report` erzeugt je Unternehmen `reports/<domain>/<jahr-monat>.md`
(Ergebnisse, Ranking-Bewegungen, Erledigtes, nächste Schritte) — direkt versandfähige
Grundlage für das Kunden-Update. Per Cron am Monatsersten automatisieren.

## Intelligenz-Quellen (automatische Kette)

1. **Claude-Code-CLI** (`claude -p`, nutzt das bestehende Abo — nichts zu konfigurieren,
   wenn `claude` im PATH und eingeloggt ist)
2. `ANTHROPIC_API_KEY` (API-Fallback, Modell via `ENGINE_MODEL`, Standard `claude-sonnet-5`)
3. Ohne beides: deterministische Fallbacks (Verzeichnis-Katalog, Leitfaden-Templates) —
   die Maschine bleibt lauffähig, nur weniger schlau.

## Konfiguration (`engine/.env`, siehe `.env.example`)

| Variable | Wirkung |
|---|---|
| `AUTO_SEND=true` | E-Mail-Versand ohne manuelle Freigabe — **nur** auf erlaubten Kanälen (`journalist`, `email_bestand`; `email_int` zusätzlich mit `AUTO_SEND_INTERNATIONAL=true`). Kalt-E-Mail an deutsche Empfänger versendet die Engine grundsätzlich nicht selbst (§7 UWG) — solche Ziele bekommen Telefon-/Formular-Leitfäden bzw. warten auf Status „Genehmigt“ im Dashboard. |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Versand-Postfach (eigene Outreach-Domain empfohlen, nicht die Hauptdomain) |
| `DATAFORSEO_LOGIN/PASSWORD` | Rankings google.de nächtlich in `keyword_checks` |
| `OUTREACH_MIN_SCORE` | Mindest-Score für Entwurfserzeugung (Standard 55) |

## Automatisieren (macOS)

Crontab (`crontab -e`), werktags 07:00:

```cron
0 7 * * 1-5 cd /Users/lucas/Desktop/seo && /usr/local/bin/node engine/run.mjs >> engine/cron.log 2>&1
```

Alternativen: launchd-Plist (überlebt Neustarts zuverlässiger) oder eine Claude-Code-
Routine (`/schedule`), die täglich `node engine/run.mjs` ausführt und zusätzlich die
Queue-Zusammenfassung meldet.

## Rhythmus-Empfehlung

- **täglich:** `monitor` (Links + Rankings) — billig, hält Daten frisch
- **wöchentlich:** kompletter Lauf (`run.mjs`) — 5–8 neue qualifizierte Ziele je Mandant
- **Dashboard-Blick (optional, 1×/Woche):** Outreach-Queue durchsehen, Grenzfälle
  genehmigen/verwerfen — das ist der einzige Punkt, an dem ein Mensch Mehrwert hat.
