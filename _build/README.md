# Bouwscripts van match-tracker.nl

Deze map wordt niet gepubliceerd (Jekyll slaat mappen met `_` over).

- `npm run build`: iconen, CSS, advertenties en versienummers (in die volgorde).
- `stamp-assets.mjs`: zet `?v=<vingerafdruk>` achter `site.css`, `site.js` en `ads.js` in alle sitepagina's.
- `webapp/`: de webversie van de app in `/app/` (zie `webapp/README.md`).

## Advertenties (Google AdSense)

Eén schakelaar voor de hele site én de webapp: `ADS_ENABLED` in **`_build/ads.config.mjs`**.
Daar staan ook de publisher-ID en alle slotnummers. Standaard staat hij op `false`.

| Plek | Slot | Waar |
|---|---|---|
| matchtracker-home-1 | 5770659745 | Homepage, tussen "Gemaakt voor iedereen op en langs het veld" en "Ingesteld op jouw sport" (ruim onder het eerste scherm) |
| matchtracker-home-2 | 6892169723 | Homepage, onderaan, direct vóór de footer |
| matchtracker-uitleg-1 | 3553679611 | Uitleg & FAQ, na "Snel starten", vóór het onderwerp "De klok, rust en einde" (nooit tussen vraag en antwoord) |
| banner (webapp) | 9961331988 | `/app/`, vaste balk onderin (`webapp/web-ads.js`) |
| rustblok (webapp) | 6039940831 | `/app/`, alleen in de rust (`webapp/web-ads.js`) |

Geen advertenties op `/start/`, `/privacy/`, `/contact/` en de 404-pagina. `site-ads.mjs` stopt met een
foutmelding als daar toch advertentiecode of een advertentiemarkering staat.

### Hoe het werkt op de website

`site-ads.mjs` (`npm run build:ads`) vult de markeringen in `index.html` en `uitleg/index.html`:

```html
<!-- advertentie head --><!-- /advertentie head -->
<!-- advertentie home-1 --><!-- /advertentie home-1 -->
```

- **UIT:** de markeringen blijven leeg. Er staat dan niets in de pagina: geen AdSense-script, geen `<ins>`,
  geen label, geen opmaak, geen witruimte, en dus ook geen verzoeken naar googlesyndication.com.
- **AAN:** in de head een klein `<style>`-blok, het AdSense-script (één keer, `async`, `crossorigin="anonymous"`)
  en `/assets/js/ads.js`. Op elke plek een `<aside class="mt-ad">` met het label "Advertentie" en een
  responsief blok (`data-ad-format="auto"`, `data-full-width-responsive="true"`).
  - Hoogte vooraf gereserveerd (16 px label + 280 px blok), zodat de pagina niet verspringt.
  - Maximaal 728 px breed (tekstkolom), minstens 48 px afstand tot knoppen en links.
  - `ads.js` vraagt elk blok één keer aan. Geen advertentie (`data-ad-status="unfilled"`), script niet geladen
    (offline, adblocker) of na 10 s nog niets: het blok verdwijnt volledig, met label.
  - Nooit `data-adtest` (het script controleert dat).

### Aanzetten (na goedkeuring door AdSense)

1. In AdSense: publiceer onder **Privacy en berichten** het toestemmingsbericht voor de EER, het VK en
   Zwitserland voor match-tracker.nl. Het privacybeleid belooft dat bericht; de site zelf heeft geen eigen
   toestemmingsbanner.
2. Zet `ADS_ENABLED` in `_build/ads.config.mjs` op `true`.
3. Website: `npm run build:ads && npm run build:stamp` (of `npm run build`).
4. Webapp: `node _build/webapp/build-webapp.mjs` (zie `webapp/README.md`).
5. Commit en push.

Uitzetten gaat op dezelfde manier met `false`.
