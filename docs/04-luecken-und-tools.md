# 04 — Lückenanalyse & Tool-Stack: Was uns noch fehlt

Die Repos decken **Ausführung** ab (Audit/Content/Ads), das Dashboard **Koordination**.
Diese Liste ist, was dazwischen bzw. drumherum fehlt — sortiert nach Dringlichkeit.
Operative Pflege: Dashboard → Seite **Integrationen**.

## 1. Zugänge & Konten (Blocker — ohne sie keine Datenbasis)

| Lücke | Warum wichtig | Aufwand/Kosten |
|---|---|---|
| **Google Search Console** je Kundendomain | Klicks, Impressionen, Positionen, Indexierung — 16 Monate Historie; Service-Account als Nutzer je Property = kein Token-Theater | kostenlos, 0,5 h je Kunde |
| **GA4** (Service-Account „Betrachter“) | Traffic/Conversions organisch isoliert für Reports | kostenlos |
| **Google-Business-Profile-API-Zugang** | Profil-Pflege + Performance-Daten (Anrufe, Routen) für alle Standorte; **Genehmigung dauert Tage–Wochen → sofort beantragen** | kostenlos |
| **Bing Webmaster + Bing Places** | speist ChatGPT-Lokalsuche | kostenlos |
| **Wix-Zugang** froehlichdienste.de | ohne CMS-Zugang keine On-Page-Umsetzung; Blog-Frage klären | — |
| **Google Ads (MCC) + Meta Business** | claude-ads braucht Konto-Zugriff; Conversion-Tracking vor erstem Euro | kostenlos |
| PageSpeed/CrUX API-Keys | CWV-Monitoring (claude-seo nutzt sie) | kostenlos |

## 2. Bezahl-APIs (klein anfangen — Gesamtkosten ~5–25 $/Monat)

| Baustein | Empfehlung | Kosten (recherchiert 07/2026) |
|---|---|---|
| **Rank-Tracking** | DataForSEO SERP, Standard-Queue (nachts, Batch) | 0,60 $/1k SERPs → 10 Kunden × 50 Kw × 2 Geräte × wöchentlich ≈ **~3 $/Monat** |
| **Local-Pack/Maps-Rankings** | DataForSEO Google Maps SERP | ~1–2 $/Monat |
| **Backlink-Daten** | DataForSEO Backlinks (Monats-Snapshot je Domain ~0,05 $) | ~1–2 $/Monat |
| **Keyword-Volumina DE** | DataForSEO Keywords Data (Google-Ads-Daten ohne Ads-Konto) | 0,06 $/1k Keywords |
| Optional: DA-Metrik | Moz API Starter | 20 $/Monat |
| Optional: Echtzeit-Checks | Serper.dev (2.500 gratis, dann ~1 $/1k) | 0–10 $ |
| Nur falls Team-Tool gewünscht | Ahrefs Lite (inkl. 100k API-Units) | 129 $/Monat |

**Entscheidung:** DataForSEO als einziger Bezahl-Lieferant (ein Vertrag, Pay-as-you-go,
50 $ Einmal-Deposit). Zum Vergleich: Fertiglösungen (AgencyAnalytics ~20 $/Kunde/Monat)
kosten bei 10 Kunden 200 $+/Monat — unser Dashboard ersetzt genau das.

## 3. Prozesse (fehlen komplett — Dokumente/Routinen anlegen)

- **Monatsreport je Unternehmen** (getan → erreicht → geplant; max. 10–15 Metriken +
  Klartext). → Ausbaustufe: PDF-Export aus dem Dashboard.
- **Onboarding-Schablone neuer Unternehmen** (siehe [05-roadmap.md](05-roadmap.md) § 5).
- **Bewertungs-Workflow** je Kunde (neutrale Bitte, QR, Antwort-SLA ≤ 72 h).
- **Journalistenanfragen-Monitoring** (HEJA, Recherchescout, Featured): tägliche Sichtung,
  Expertenprofil je Mandant, Antwort-Templates.
- **Outreach-Rechtsleitfaden** intern (Kurzfassung von [02](02-backlink-playbook.md) § 4/5)
  + schriftliche Kundenaufklärung zu Linkkauf-Risiken (Haftungsschutz).
- **Link-Inventur beim Onboarding**: bestehende Beziehungen (Lieferanten, Vereine,
  Kammern) systematisch abfragen.
- **Jahres-Update-Routine** für Zahlen-Inhalte (Pflegebeträge ändern sich jährlich).

## 4. Mess-Lücken (entscheiden über „bringt SEO Geld?“)

- **Anruf-Tracking**: lokale Dienstleister konvertieren telefonisch — mindestens
  GBP-Anrufstatistik nutzen; besser Tracking-Rufnummern je Kanal prüfen (DSGVO-konform).
- **Formular-/Lead-Tracking** in GA4 (Key Events) + Zuordnung Kanal → Anfrage.
- **Attribution Content → Anfrage** (UTM-Disziplin, Landingpage-Reports).
- Ohne diese drei bleibt jeder Report bei Rankings stehen — Kunden zahlen aber für Anfragen.

## 5. Technik-Ausbaustufen des Dashboards (bewusst noch nicht gebaut)

1. **DataForSEO-Anbindung**: nächtlicher Cron (API-Route), schreibt `keyword_checks`
   automatisch — Sparklines füllen sich ohne Handarbeit.
2. **GSC-Import**: Klicks/Impressionen je Unternehmen in Übersicht + Reports.
3. **PDF-Monatsreport** je Unternehmen (weiß-gelabelt).
4. **Bewertungs-Monitoring** (GBP-API) je Standort.
5. **Mehrbenutzer/Hosting**: aktuell lokal; bei Teamgröße > 1 auf kleinen Server (Hetzner)
   + Basic-Auth umziehen; SQLite bleibt ausreichend.
6. **Wettbewerbs-Sichtbarkeit** (DataForSEO Labs: Ranked Keywords der Konkurrenz).

## 6. Risiken & offene Fragen

- **Wix-Limitierungen** (Blog, Schema, Ladezeit) — nach Zugang bewerten; ggf. Hub extern.
- **GBP-API-Genehmigung** kann sich ziehen — bis dahin manuelle Pflege (funktioniert, skaliert nur schlechter).
- **Kapazität**: Telefon-Outreach und Bewertungsantworten brauchen einen Menschen mit
  festem Wochenslot — wer übernimmt das pro Mandant?
- **AV-Verträge/DSGVO** mit jedem Kunden (wir verarbeiten deren Daten in GSC/GA4/Dashboard).
- **Karlsruhe** liegt weit außerhalb des Kerngebiets — eigener Local-Aufbau nötig (GBP,
  Citations, lokale Links separat).
