# Baseline-Audit froehlichdienste.de — 15.07.2026

Methode: Direkt-Analyse (HTML, Sitemaps, robots.txt, Schema), PageSpeed-API (Kontingent
erschöpft — eigener kostenloser API-Key nötig, Aufgabe angelegt). Volles `/seo audit`
(claude-seo) nach Plugin-Installation als Zweitmeinung empfohlen.

## Gesamtbild

Solide Substanz (47 indexierbare Seiten, echtes Standortnetz, Rechner, Presseseite,
**leerer, aber aktivierter Wix-Blog**), aber die Basics sind unsauber: falsches
Sprach-Attribut, doppelte H1, kaputtes Schema, dünne Seiten, keine Ortsnennung in
Titles. Das ist gut behebbar — die Quick Wins aus der Roadmap treffen genau.

## Befunde

### Technik & Indexierung

| Befund | Bewertung | Maßnahme |
|---|---|---|
| `robots.txt`: nur `/404` gesperrt | ✅ ok | — |
| Sitemap-Index: website (47), **blog (0!)**, ols/ola (Shop) | ✅ Blog-Infrastruktur existiert | Ratgeber-Hub kann sofort auf Wix starten |
| `lang="en-US"` auf deutscher Seite | 🔴 falsch | Wix-Spracheinstellung auf Deutsch |
| Kein Canonical auf Startseite | 🟡 | Wix-SEO-Einstellungen prüfen |
| Login-/Systemseiten (`/m/login` …) in Sitemap | 🟡 | aus Sitemap/Index nehmen (noindex) |
| URL-Hygiene: `göttingen,-northeim` (Komma-URL, 2 Orte auf 1 Seite), `-1`-Suffixe (`heidelberg-1`, `erste-hilfe-fahrschule-1` …) | 🟡 | bei Seiten-Neuaufbau bereinigen (mit 301) |
| PSI/CrUX: keine Felddaten (zu wenig Traffic), Labordaten ausstehend | 🟡 | eigenen PSI-API-Key anlegen, Messung nachholen |

### On-Page (Startseite)

- **Title** (60 Z.): „Betreuungsdienst FrohZeit Hauswirtschaft / Alltagsbegleitung“ —
  **keine Ortsnennung**, kein Nutzenversprechen. → „Betreuungsdienst Göttingen ·
  Alltagsbegleitung & Haushaltshilfe | FrohZeit“.
- **Meta-Description** (157 Z.): generisch, Rechtschreibung („können sie“), ohne Ort/CTA.
- **H1 doppelt** (2× identisch auf Startseite) — eine H1 je Seite.
- Nur **~600 Wörter** sichtbarer Text, 2 H2 — dünn für ein Leistungsspektrum dieser Breite.
- 1 von 3 Bildern ohne Alt-Text.

### Strukturierte Daten

Vorhandenes LocalBusiness-JSON-LD ist **defekt**: Umlaute zerstört („Hans-Bckler-Strae“),
Müll-`@id` (UUID-Fantasiedomain), `url` ohne Protokoll, **kein Ort/Land/Telefon/
Öffnungszeiten**, Bild über `http://`. → Ersetzen durch saubere Snippets:
[`umsetzung/schema/`](../../umsetzung/schema/) (Startseite + Vorlage je Standortseite).
Ermittelte Stammdaten: Hans-Böckler-Straße 2C, 37079 Göttingen; Tel. 0551 28879514.

### Inhalts-Inventar & Tiefe (Stichproben)

| Seite | Wörter | Befund |
|---|---|---|
| Startseite | ~600 | dünn, H1 doppelt |
| `/göttingen,-northeim` | ~833 | beste Seite; aber 2 Orte auf 1 URL |
| `/pflegegeldrechner` | ~226 | **Linkable Asset stark unterbaut** — Ausbau = Prio |
| `/frieda-betreuungssoftware` | ~225 | Produktseite zu dünn für B2B-Funnel & Ads |

**Seiten-Cluster laut Sitemap:** 11 Standortseiten · ~10 Erste-Hilfe-Seiten (eigenes
Kurs-Geschäft, bisher ohne Kurs-/Event-Schema) · Software/Portal (FRIEDA, QPR-2026,
Angehörigenportal) · Gründung/§45a-Anerkennung/§53b · Shop · **Presseseite** (perfekt
für „weißes Tier 2“: Berichterstattung verlinken) · Stellenangebote (3 Seiten —
Recruiting-Funnel existiert schon).

## Priorisierte Maßnahmen (in Dashboard-Aufgaben überführt)

1. **Wix-Zugang** → Sprach-Attribut de-DE, Titles/Descriptions mit Ort, eine H1,
   defektes Schema ersetzen (Snippets liegen bereit).
2. **GBP + Citations** (unverändert Top-Hebel, siehe Roadmap Phase 1).
3. **Ratgeber-Hub im Wix-Blog starten** — Entwurf #1 liegt bereit
   ([Entlastungsbetrag-Ratgeber](../../umsetzung/content/ratgeber-entlastungsbetrag-45b.md)).
4. **Pflegegeldrechner ausbauen** (Werte 2026, FAQ + FAQ-Schema, interne Links) —
   das Asset hat nur 226 Wörter.
5. **Landingpage Alltagsbegleitung Göttingen** ersetzen/ausbauen
   ([Entwurf](../../umsetzung/content/landingpage-alltagsbegleitung-goettingen.md)).
6. FRIEDA-Produktseite ausbauen (vor B2B-Ads Pflicht).
7. PSI-API-Key anlegen, Messung nachholen; `/seo audit` als Vollcheck nach Plugin-Setup.

**Leitindikatoren (Falsifizierbarkeit):** GSC-Impressionen der Standort-Keywords nach
4–6 Wochen; Local-Pack-Sichtung „betreuungsdienst göttingen“; Indexierung der ersten
Blog-Beiträge; Rich-Results-Test der neuen Schema-Blöcke ohne Fehler.
