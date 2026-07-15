# 01 — Agentur-Strategie & Multi-Level-SEO

Stand: Juli 2026. Grundlage: Analyse froehlichdienste.de, die drei Werkzeug-Repos,
Web-Recherche zu Linkaufbau/Local SEO 2025/2026 (Quellen in [02-backlink-playbook.md](02-backlink-playbook.md)
und [04-luecken-und-tools.md](04-luecken-und-tools.md)).

## 1. Was wir sind

Eine kleine Marketing-Agentur, die mehrere Unternehmen dauerhaft betreut. Unser Produkt
ist **planbare Sichtbarkeit**: organische Rankings, lokale Präsenz, Content, der Anfragen
erzeugt, und Paid Media dort, wo Organik zu langsam ist. Wir skalieren nicht über mehr
Arbeitsstunden, sondern über **wiederverwendbare Systeme**: ein Dashboard, drei
Ausführungs-Repos, dokumentierte Playbooks.

## 2. Betriebsmodell: Steuerung → Ausführung → Nachweis

| Ebene | Werkzeug | Inhalt |
|---|---|---|
| **Steuerung** | Dashboard (`dashboard/`) | Unternehmen, Keywords, Backlink-Pipeline, Content-Pipeline, Kampagnen, Aufgaben, Integrations-Lücken |
| **Ausführung** | claude-seo / claude-blog / claude-ads | Audits, Schema, Local SEO, Artikel-Produktion, Ads-Planung & Monitoring |
| **Nachweis** | Reports (Ausbaustufe) | Monatsbericht je Unternehmen: getan → erreicht → geplant |

Jedes Unternehmen ist im Dashboard ein Mandant mit eigener Farbe, eigenen Pipelines und
eigenem Playbook-Abschnitt. Neue Unternehmen durchlaufen immer denselben Onboarding-Pfad
(siehe [05-roadmap.md](05-roadmap.md) → „Onboarding-Schablone“).

## 3. „Multi-Level-SEO“ — beide Bedeutungen, unsere Position

### 3a. SEO auf mehreren Ebenen (so arbeiten wir)

Wir behandeln SEO als Stapel aus sechs Ebenen; jede Ebene hat ein eigenes Audit, eigene
KPIs und eigene Werkzeuge:

1. **Technik** — Crawling, Indexierung, Core Web Vitals, Rendering. → `/seo technical`, PSI/CrUX.
2. **On-Page & Content** — Suchintention, Inhaltsqualität (E-E-A-T), interne Verlinkung,
   Content-Hubs. → `/blog …`, `/seo content`.
3. **Struktur & Daten** — Schema.org (LocalBusiness!, FAQ, Service), saubere
   Informationsarchitektur. → `/seo schema`.
4. **Local** — Google Business Profile, Bewertungen, Citations/NAP, Standortseiten.
   Gewichtung laut Whitespark: GBP ~32 %, Bewertungen ~20 %, Citations nur ~6–7 %
   (Fundament, kein Wachstumshebel). → `/seo local`, `/seo maps`.
5. **Autorität (Off-Page)** — Backlinks & Erwähnungen. → [02-backlink-playbook.md](02-backlink-playbook.md).
6. **AI-Sichtbarkeit (GEO)** — Zitierfähigkeit in ChatGPT/Perplexity/AI Overviews:
   Entitäten, prägnante Antwortpassagen, Bing-Präsenz (speist ChatGPT-Lokaldaten).
   → `/seo geo`.

Reihenfolge bei jedem neuen Mandanten: **erst Fundament (1–4), dann Autorität (5), dann
Feinschliff (6)** — Links auf eine technisch kaputte oder inhaltsleere Seite sind
verbranntes Budget.

### 3b. Tiered Link Building (das „Multi-Level“ aus der Linkbuilding-Szene)

Das klassische Modell: Tier-1-Links zeigen auf die Kundenseite, Tier-2-Links pushen die
Tier-1-Platzierungen, Tier 3 ist Massen-Spam auf Tier 2. **Unsere Recherche (Stand
2025/2026) ist eindeutig:** Googles SpamBrain entwertet solche Pyramiden meist still
(„silent devaluation“), im Extremfall drohen manuelle Maßnahmen; automatisierte
Linkprogramme sind explizit von den Spam-Richtlinien verboten. Für eine Agentur kommt das
Portfolio-Risiko dazu: identische Linkquellen über mehrere Kunden hinweg sind ein
Footprint, der **alle** Mandanten angreifbar macht.

**Unsere Position:**

- **Wir bieten kein klassisches Tiered Link Building an** (keine gekauften Tier-Pakete,
  keine PBNs, keine Web-2.0-/Kommentar-Automatisierung).
- **Wir übernehmen die eine seriöse Idee daraus:** starke Platzierungen verdienen
  Verstärkung. Unser „weißes Tier 2“ = Amplifikation verdienter Tier-1-Platzierungen
  über eigene Kanäle (Social-Profile, Newsletter, GBP-Beiträge, Zweitverwertung von
  Studien bei weiteren Journalisten, Verlinkung der Berichterstattung von der
  Kunden-Presseseite). Das ist Content-Marketing, kein Linkschema.
- Im Dashboard existiert dafür das **Tier-Feld** in der Backlink-Pipeline:
  Tier 1 = Link zur Kundenseite, Tier 2 = Amplifikations-Maßnahme. Ein Tier 3 gibt es
  bei uns nicht.

## 4. Drei Mandats-Typen, drei Standard-Funnels

Unsere Unternehmen fallen in wiederkehrende Typen — für jeden gibt es ein Standardpaket:

| Typ | Beispiel | Kern-Hebel |
|---|---|---|
| **Lokaler Dienstleister (B2C)** | FrohZeit Betreuung | GBP + Bewertungen + Citations + Standortseiten + Ratgeber-Content + lokale Links |
| **Produkt/Software (B2B)** | FRIEDA Betreuungssoftware | Produkt-Landingpages + Vergleichs-/Fach-Content + B2B-Verzeichnisse (wlw) + Google Ads + Case Studies |
| **Kurse/Events (lokal, transaktional)** | Erste-Hilfe-Kurse | GBP-Kategorie + Kurs-Landingpages mit Terminen + Event-Schema + lokale Ads |

FrohZeit enthält alle drei Typen in einem Unternehmen — ideales Pilotmandat
(Details: [03-froehlichdienste.md](03-froehlichdienste.md)).

## 5. Skalierungsprinzipien über mehrere Unternehmen

1. **Methoden teilen, Footprints trennen.** Checklisten, Templates und Monitoring sind
   gemeinsam; Linkquellen, Ankertexte und Inhalte sind je Mandant individuell. Nie
   dasselbe Linknetzwerk für zwei Kunden.
2. **Ein Monitoring, viele Mandanten.** Journalistenanfragen (HEJA, Recherchescout,
   Featured) zentral beobachten und passende Anfragen dem jeweiligen Mandanten zuspielen.
3. **Assets als Templates.** Ein Rechner-/Ratgeber-Template einmal bauen, pro Branche
   befüllen (FrohZeit: Pflegegeldrechner existiert schon — ausbauen statt neu erfinden).
4. **Datenstudien als Agentur-Format.** Ein Studienformat („Zahlen aus Branche X in
   Region Y“) pro Mandant neu auflegen — Original-Research erhält ein Vielfaches an
   Backlinks gegenüber Meinungs-Content.
5. **Alles landet im Dashboard.** Was nicht in einer Pipeline steht, existiert nicht.

## 6. Qualitäts- und Risiko-Leitplanken

- Google-Spam-Richtlinien sind die rote Linie; im Zweifel: verdienen statt kaufen.
- Bezahlte Platzierungen (auch Sponsoring) immer doppelt kennzeichnen:
  `rel="sponsored"` **und** presserechtlich „Anzeige/Werbung“ ([02](02-backlink-playbook.md) § Recht).
- **Kein Kalt-E-Mail-Outreach in Deutschland** (§ 7 UWG, ab der ersten Mail abmahnfähig).
- Bewertungen: nur neutral bitten, nie incentivieren (UWG-Schwarze-Liste + Google-Richtlinie).
- Lokale Landingpages nur für Orte mit echter Leistung/echtem Inhalt (Doorway-Falle).
- Jede Empfehlung mit Messpunkt: Was wäre der Beleg, dass es funktioniert hat (Leitindikator)?
