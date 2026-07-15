# Schema-Snippets für froehlichdienste.de (Wix)

Das vorhandene LocalBusiness-JSON-LD der Website ist defekt (zerstörte Umlaute,
Müll-`@id`, kein Ort/Telefon) — diese Dateien ersetzen es.

## Einbau in Wix

1. **Startseite:** Wix-Editor → Seite → SEO-Einstellungen → „Erweitert“ →
   *Strukturierte Daten (JSON-LD)*: vorhandenen defekten Block ersetzen durch
   [`localbusiness-startseite.jsonld`](localbusiness-startseite.jsonld).
2. **Vor dem Einbau ausfüllen:** `openingHoursSpecification` (echte Zeiten!),
   `sameAs` (Google-Maps-Profil-URL nach GBP-Claim, weitere Profile), ggf. echtes
   Logo/Bild. Platzhalter sind GROSS markiert.
3. **Je Standortseite:** Kopie des Blocks mit angepasster `@id`
   (`https://froehlichdienste.de/<standort>#organisation`), `areaServed` auf den
   jeweiligen Landkreis reduziert und — falls es dort ein Büro gibt — eigener
   `address`. Ohne eigenes Büro: `address` der Zentrale behalten, nur `areaServed`
   anpassen (keine Fake-Adressen — Google-Richtlinie!).
4. **Ratgeber-Artikel:** FAQ-Block aus dem jeweiligen Content-Entwurf
   (`umsetzung/content/…`) mit in die Seite einbauen.

## Prüfung nach Einbau

- https://search.google.com/test/rich-results → URL testen, 0 Fehler anstreben.
- https://validator.schema.org → Snippet einfügen.
- Danach im Dashboard die Aufgabe „LocalBusiness-Schema…“ auf **Erledigt** setzen.
