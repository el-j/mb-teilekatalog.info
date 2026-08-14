#!/usr/bin/env node
/**
 * scrape-diagrams.mjs
 *
 * Downloads all technical drawings and exploded diagrams from the original
 * mb-teilekatalog.info website and stores them under public/diagrams/.
 *
 * Usage:
 *   node scripts/scrape-diagrams.mjs [--base-url https://mb-teilekatalog.info]
 *
 * The script:
 *  1. Fetches the homepage to discover all vehicle/class links.
 *  2. For each vehicle walks the parts-group → subgroup → diagram pages.
 *  3. Downloads every <img> whose src looks like an exploded drawing (.gif/.png/.jpg).
 *  4. Saves images to   public/diagrams/<vehicleId>/<groupId>/<filename>
 *  5. Writes a manifest to  src/data/diagrams.json  that the Astro site can import.
 *
 * Requirements: Node ≥ 18 (native fetch). No extra npm packages needed.
 *
 * Rate limiting: 500 ms delay between requests to be polite to the server.
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync }                  from 'node:fs';
import { join, basename, extname }     from 'node:path';
import { URL }                         from 'node:url';

// ─── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL     = process.argv.includes('--base-url')
  ? process.argv[process.argv.indexOf('--base-url') + 1]
  : 'https://mb-teilekatalog.info';
const OUTPUT_DIR   = new URL('../public/diagrams/', import.meta.url).pathname;
const MANIFEST_OUT = new URL('../src/data/diagrams.json', import.meta.url).pathname;
const DELAY_MS     = 500;
const MAX_RETRIES  = 3;
const TIMEOUT_MS   = 20_000;

// Known vehicle/class query parameters for the original site.
// Format: { id, lang, class, aggtyp, markt, mmod }
// These were derived from the original URL pattern:
//   ?lang=E&class=2&aggtyp=M&markt=AG&mmod=M
const VEHICLE_SEEDS = [
  // T1 "Bremer" – W601 (207D/208/210D)
  { id: 't1-w601', lang: 'E', class: '2', aggtyp: 'M', markt: 'AG', mmod: 'T' },
  // T1 "Bremer" – W602 (307D/308/407D/410D)
  { id: 't1-w602', lang: 'E', class: '2', aggtyp: 'M', markt: 'AG', mmod: 'TN' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'MBTeilekatalogArchiver/1.0 (community project; https://github.com/el-j/mb-teilekatalog.info)' },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (err) {
      console.warn(`  ⚠ Attempt ${attempt}/${retries} failed for ${url}: ${err.message}`);
      if (attempt < retries) await sleep(DELAY_MS * attempt);
      else throw err;
    }
  }
}

async function fetchText(url) {
  const res = await fetchWithRetry(url);
  return res.text();
}

async function fetchBinary(url) {
  const res = await fetchWithRetry(url);
  return Buffer.from(await res.arrayBuffer());
}

function resolveUrl(base, href) {
  try { return new URL(href, base).href; } catch { return null; }
}

/** Extract all hrefs from anchor tags matching a selector pattern */
function extractLinks(html, baseUrl, pattern) {
  const links = new Set();
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const resolved = resolveUrl(baseUrl, m[1]);
    if (resolved && (!pattern || pattern.test(resolved))) {
      links.add(resolved);
    }
  }
  return [...links];
}

/** Extract all img srcs from HTML */
function extractImages(html, baseUrl) {
  const imgs = new Set();
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const ext = extname(m[1]).toLowerCase();
    // Only images that look like technical drawings (gif is common for old EPC sites)
    if (['.gif', '.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) {
      const resolved = resolveUrl(baseUrl, m[1]);
      if (resolved) imgs.add(resolved);
    }
  }
  return [...imgs];
}

/** Heuristic: does this image URL look like a technical/exploded drawing? */
function isDrawingImage(url) {
  const lower = url.toLowerCase();
  // Exclude obvious UI chrome (buttons, icons, logos, spacers)
  const excluded = ['logo', 'icon', 'button', 'nav', 'header', 'footer',
                    'spacer', 'pixel', 'blank', 'arrow', 'bg_', 'background'];
  if (excluded.some(e => lower.includes(e))) return false;
  // Include anything in typical EPC image paths
  const included = ['grafik', 'graphic', 'bild', 'image', 'zeichnung', 'drawing',
                    'explod', 'pic', 'img', 'abb', 'fig', '/data/', '/pics/',
                    '/images/', '/grafiken/', 'view_'];
  return included.some(e => lower.includes(e));
}

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function downloadImage(imgUrl, destPath) {
  if (existsSync(destPath)) {
    console.log(`    ✓ already downloaded: ${basename(destPath)}`);
    return true;
  }
  try {
    const buf = await fetchBinary(imgUrl);
    await writeFile(destPath, buf);
    console.log(`    ↓ saved: ${basename(destPath)} (${buf.length} bytes)`);
    return true;
  } catch (err) {
    console.warn(`    ✗ failed to download ${imgUrl}: ${err.message}`);
    return false;
  }
}

// ─── Crawler ──────────────────────────────────────────────────────────────────

const manifest = {}; // { [vehicleId]: { [groupId]: string[] } }

async function crawlVehicle(seed) {
  const vehicleDir = join(OUTPUT_DIR, seed.id);
  await ensureDir(vehicleDir);
  manifest[seed.id] = {};

  // Build the vehicle overview URL
  const vehicleUrl = `${BASE_URL}/?lang=${seed.lang}&class=${seed.class}&aggtyp=${seed.aggtyp}&markt=${seed.markt}&mmod=${seed.mmod}`;
  console.log(`\n🚐 Crawling vehicle: ${seed.id}`);
  console.log(`   URL: ${vehicleUrl}`);

  let vehicleHtml;
  try {
    vehicleHtml = await fetchText(vehicleUrl);
  } catch (err) {
    console.error(`  ✗ Could not load vehicle page: ${err.message}`);
    return;
  }
  await sleep(DELAY_MS);

  // Find part-group links (usually contain 'view_' or 'gruppen' or 'group' in URL)
  const groupLinks = extractLinks(vehicleHtml, vehicleUrl,
    /view_|grupp|group|baumuster|aggtyp|snr=/i);
  console.log(`   Found ${groupLinks.length} candidate group links`);

  const visited = new Set([vehicleUrl]);

  for (const groupUrl of groupLinks) {
    if (visited.has(groupUrl)) continue;
    visited.add(groupUrl);

    // Derive a local group ID from the URL query string
    const params  = new URL(groupUrl).searchParams;
    const groupId = [
      params.get('snr') ?? params.get('gruppe') ?? params.get('group') ?? params.get('baumuster') ?? 'misc',
      params.get('sg')  ?? params.get('subgruppe') ?? '',
    ].filter(Boolean).join('-').replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 40) || 'misc';

    const groupDir = join(vehicleDir, groupId);
    await ensureDir(groupDir);
    manifest[seed.id][groupId] = manifest[seed.id][groupId] ?? [];

    console.log(`\n  📂 Group: ${groupId}`);
    console.log(`     URL: ${groupUrl}`);

    let groupHtml;
    try {
      groupHtml = await fetchText(groupUrl);
    } catch (err) {
      console.warn(`    ✗ Could not load group page: ${err.message}`);
      await sleep(DELAY_MS);
      continue;
    }
    await sleep(DELAY_MS);

    // Collect images from this page
    const allImgs = extractImages(groupHtml, groupUrl);
    const drawingImgs = allImgs.filter(isDrawingImage);
    console.log(`     Found ${allImgs.length} images, ${drawingImgs.length} look like drawings`);

    for (const imgUrl of drawingImgs) {
      const fname = basename(new URL(imgUrl).pathname) || `img_${Date.now()}`;
      const destPath = join(groupDir, fname);
      const ok = await downloadImage(imgUrl, destPath);
      if (ok) {
        manifest[seed.id][groupId].push(`/diagrams/${seed.id}/${groupId}/${fname}`);
      }
      await sleep(DELAY_MS);
    }

    // Also look one level deeper (subgroup links on this page)
    const subLinks = extractLinks(groupHtml, groupUrl,
      /view_|subgrupp|subgroup|sg=|snr=/i)
      .filter(l => !visited.has(l));

    for (const subUrl of subLinks.slice(0, 50)) { // guard: max 50 subgroups
      if (visited.has(subUrl)) continue;
      visited.add(subUrl);

      let subHtml;
      try {
        subHtml = await fetchText(subUrl);
      } catch (err) {
        console.warn(`    ✗ Could not load subgroup page: ${err.message}`);
        await sleep(DELAY_MS);
        continue;
      }
      await sleep(DELAY_MS);

      const subImgs = extractImages(subHtml, subUrl).filter(isDrawingImage);
      for (const imgUrl of subImgs) {
        const fname = basename(new URL(imgUrl).pathname) || `img_${Date.now()}`;
        const destPath = join(groupDir, fname);
        const ok = await downloadImage(imgUrl, destPath);
        if (ok) {
          manifest[seed.id][groupId].push(`/diagrams/${seed.id}/${groupId}/${fname}`);
        }
        await sleep(DELAY_MS);
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('='.repeat(60));
console.log(' MB Teilekatalog – Diagram Scraper');
console.log(`  Base URL:  ${BASE_URL}`);
console.log(`  Output:    ${OUTPUT_DIR}`);
console.log(`  Manifest:  ${MANIFEST_OUT}`);
console.log('='.repeat(60));

await ensureDir(OUTPUT_DIR);

for (const seed of VEHICLE_SEEDS) {
  await crawlVehicle(seed);
}

// Write manifest
await writeFile(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
console.log(`\n✅ Done. Manifest written to ${MANIFEST_OUT}`);
console.log('   Commit the public/diagrams/ directory and src/data/diagrams.json to the repo.');
