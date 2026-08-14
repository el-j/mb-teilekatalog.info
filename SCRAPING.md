# Scraping Technical Drawings from mb-teilekatalog.info

This document explains how to retrieve all technical drawings (exploded diagrams)
from the original website and store them in the repository.

---

## Overview

Two scraper scripts are provided under `scripts/`:

| Script | When to use |
|--------|-------------|
| `scrape-diagrams.mjs` | Live site is reachable (`https://mb-teilekatalog.info`) |
| `scrape-wayback.mjs` | Live site is down – uses Wayback Machine archive |

Both scripts:
- Download images to `public/diagrams/<path>/`
- Write / update `src/data/diagrams.json` (manifest of all downloaded paths)
- Are rate-limited and retry-safe

---

## Quick Start

```bash
# Option A – from the live site
npm run scrape

# Option B – from Wayback Machine (if live site is down)
npm run scrape:wayback

# After either script finishes:
git add public/diagrams/ src/data/diagrams.json
git commit -m "Add technical drawings from mb-teilekatalog.info"
git push
```

---

## How It Works

### `scrape-diagrams.mjs`

1. Starts from the known vehicle seed URLs (T1 W601, T1 W602, …).
2. Follows links matching the original site's part-group URL patterns.
3. Downloads every `<img>` that looks like a technical drawing (heuristic based on
   path keywords like `grafik`, `zeichnung`, `explod`, `pic`, plus file extensions).
4. Saves to `public/diagrams/<vehicleId>/<groupId>/<filename>`.
5. Writes a manifest to `src/data/diagrams.json`.

### `scrape-wayback.mjs`

1. Queries the Wayback Machine CDX API for all archived URLs under `mb-teilekatalog.info`.
2. Filters to image MIME types and drawing-like path patterns.
3. Also crawls archived HTML pages to find additional `<img>` references.
4. Downloads each image from the nearest available snapshot.
5. Merges results into `src/data/diagrams.json`.

---

## Output Structure

```
public/
  diagrams/
    t1-w601/
      engine-block/
        zylinderblock_schnitt.gif
        ...
      brakes-front/
        bremsscheibe_vorne.gif
        ...
    t1-w602/
      ...

src/data/
  diagrams.json   ← manifest used by the Astro pages
```

---

## Wiring Diagrams into the Catalog

After scraping, open `src/data/catalog.ts` and add `diagrams` arrays to the
relevant `PartSubgroup` entries:

```ts
{
  id: 'brakes-front',
  name: 'Vorderbremse',
  nameEn: 'Front brakes',
  diagrams: [
    '/diagrams/t1-w601/brakes-front/bremsscheibe_vorne.gif',
  ],
  parts: [ … ],
}
```

The vehicle detail page (`src/pages/vehicles/[id].astro`) already renders
these images automatically.

---

## Legal / Copyright Note

Technical drawings from the original EPC (Electronic Parts Catalogue) are
proprietary to **Mercedes-Benz Group AG**. Storing them in this repository is
done for **archival / preservation purposes** by the community.

- Do **not** include drawings if you are not certain about their licensing status.
- Community-created SVG redrawings are always preferred and unambiguously CC BY-SA 4.0.
- If Mercedes-Benz requests removal of specific drawings, they will be deleted
  immediately upon request (standard DMCA / good-faith takedown process).

---

## Adding More Vehicles

Edit the `VEHICLE_SEEDS` array at the top of `scrape-diagrams.mjs` to add
additional models. The seed parameters match the original site's query string:

```js
{ id: 'w124-200d', lang: 'E', class: '1', aggtyp: 'M', markt: 'AG', mmod: 'E200D' }
```

Discover the correct parameters by inspecting URLs on the live or archived site.
