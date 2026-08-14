#!/usr/bin/env node
/**
 * scrape-wayback.mjs
 *
 * Fallback scraper: uses the Wayback Machine CDX API to find archived
 * snapshots of mb-teilekatalog.info, then downloads images from those
 * snapshots.
 *
 * Use this when the live site is unreachable.
 *
 * Usage:
 *   node scripts/scrape-wayback.mjs
 *
 * Requirements: Node ≥ 18 (native fetch). No extra npm packages needed.
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync }                  from 'node:fs';
import { join, basename, extname }     from 'node:path';
import { URL }                         from 'node:url';

// ─── Configuration ─────────────────────────────────────────────────────────────

const ORIGINAL_HOST = 'mb-teilekatalog.info';
const WAYBACK_CDX   = 'https://web.archive.org/cdx/search/cdx';
const WAYBACK_BASE  = 'https://web.archive.org/web';
const OUTPUT_DIR    = new URL('../public/diagrams/', import.meta.url).pathname;
const MANIFEST_OUT  = new URL('../src/data/diagrams.json', import.meta.url).pathname;
const DELAY_MS      = 800; // be polite to archive.org
const MAX_RETRIES   = 3;
const TIMEOUT_MS    = 30_000;

// Image extensions we care about
const IMG_EXTS = new Set(['.gif', '.png', '.jpg', '.jpeg', '.svg', '.webp']);

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
        headers: {
          'User-Agent': 'MBTeilekatalogArchiver/1.0 (community project; https://github.com/el-j/mb-teilekatalog.info)',
        },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      console.warn(`  ⚠ Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) await sleep(DELAY_MS * attempt * 2);
      else throw err;
    }
  }
}

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

/** Heuristic: skip obvious UI/navigation images */
function isDrawingImage(url) {
  const lower = url.toLowerCase();
  const excluded = ['logo', 'icon', 'button', 'nav', 'header', 'footer',
                    'spacer', 'pixel', 'blank', 'arrow', 'bg_', 'background',
                    '/layout/', '/css/', '/style'];
  if (excluded.some(e => lower.includes(e))) return false;
  const included = ['grafik', 'graphic', 'bild', 'image', 'zeichnung', 'drawing',
                    'explod', 'pic', 'img', 'abb', 'fig', '/data/', '/pics/',
                    '/images/', '/grafiken/', 'view_', 'teil'];
  // Accept if path contains a known drawing keyword OR if it's a GIF (most EPC drawings are GIFs)
  return included.some(e => lower.includes(e)) || lower.endsWith('.gif');
}

// ─── Step 1: Use CDX API to find all archived image URLs ─────────────────────

async function fetchArchivedImageUrls() {
  console.log('\n📡 Querying Wayback Machine CDX API for all images on the site…');

  // CDX API: find all URLs under the domain that are images, status 200
  const params = new URLSearchParams({
    url:       `${ORIGINAL_HOST}/*`,
    output:    'json',
    fl:        'original,timestamp,mimetype,statuscode',
    filter:    'statuscode:200',
    collapse:  'urlkey',           // deduplicate by URL
    limit:     '5000',
  });

  let rows;
  try {
    const res = await fetchWithRetry(`${WAYBACK_CDX}?${params}`);
    const json = await res.json();
    // First row is headers: ["original","timestamp","mimetype","statuscode"]
    const [headers, ...data] = json;
    rows = data.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  } catch (err) {
    console.error(`✗ CDX query failed: ${err.message}`);
    return [];
  }

  console.log(`   CDX returned ${rows.length} unique URLs`);

  // Filter to image-like URLs or known drawing paths
  const imageRows = rows.filter(r => {
    const mime = (r.mimetype ?? '').toLowerCase();
    const ext  = extname(r.original).toLowerCase();
    const isImg = mime.includes('image') || IMG_EXTS.has(ext);
    return isImg && isDrawingImage(r.original);
  });

  console.log(`   ${imageRows.length} look like technical drawings`);
  return imageRows;
}

// ─── Step 2: Also discover page URLs to extract more image references ─────────

async function fetchArchivedPageUrls() {
  console.log('\n📡 Querying CDX for HTML pages to crawl for more image links…');
  const params = new URLSearchParams({
    url:      `${ORIGINAL_HOST}/*`,
    output:   'json',
    fl:       'original,timestamp,mimetype,statuscode',
    filter:   ['statuscode:200', 'mimetype:text/html'],
    collapse: 'urlkey',
    limit:    '500',
  });
  try {
    const res = await fetchWithRetry(`${WAYBACK_CDX}?${params}`);
    const json = await res.json();
    const [headers, ...data] = json;
    return data.map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  } catch (err) {
    console.warn(`  ⚠ Page CDX query failed: ${err.message}`);
    return [];
  }
}

// ─── Step 3: Scrape archived HTML pages for additional image references ────────

async function extractImagesFromPage(timestamp, originalUrl) {
  const waybackUrl = `${WAYBACK_BASE}/${timestamp}if_/${originalUrl}`;
  let html;
  try {
    const res = await fetchWithRetry(waybackUrl);
    html = await res.text();
  } catch (err) {
    console.warn(`  ⚠ Could not fetch archived page: ${err.message}`);
    return [];
  }

  const imgs = [];
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let src = m[1];
    // Strip wayback rewrite prefix if present
    src = src.replace(/^https?:\/\/web\.archive\.org\/web\/\d+[a-z]*\//i, '');
    // Normalize to absolute original URL
    try {
      const abs = new URL(src, `https://${ORIGINAL_HOST}/`).href;
      if (abs.startsWith(`https://${ORIGINAL_HOST}`) && isDrawingImage(abs)) {
        imgs.push(abs);
      }
    } catch { /* skip malformed */ }
  }
  return imgs;
}

// ─── Step 4: Download a single image from Wayback ─────────────────────────────

async function downloadFromWayback(originalUrl, timestamp, destPath) {
  if (existsSync(destPath)) {
    console.log(`    ✓ already have: ${basename(destPath)}`);
    return true;
  }
  const waybackUrl = `${WAYBACK_BASE}/${timestamp}if_/${originalUrl}`;
  try {
    const res = await fetchWithRetry(waybackUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(destPath, buf);
    console.log(`    ↓ ${basename(destPath)}  (${buf.length} bytes)  [from ${timestamp}]`);
    return true;
  } catch (err) {
    console.warn(`    ✗ Download failed: ${err.message}`);
    return false;
  }
}

// ─── Helper: derive local path from original URL ──────────────────────────────

function originalUrlToLocalPath(originalUrl) {
  try {
    const u = new URL(originalUrl);
    // Strip leading slash and split into path segments
    const segments = u.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (segments.length === 0) return null;
    const fname = segments[segments.length - 1];
    const ext   = extname(fname).toLowerCase();
    if (!IMG_EXTS.has(ext)) return null;
    // Use the path structure as the local hierarchy
    return segments.join('/');
  } catch { return null; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('='.repeat(60));
console.log(' MB Teilekatalog – Wayback Machine Diagram Scraper');
console.log(`  Source:    https://${ORIGINAL_HOST}`);
console.log(`  Via:       ${WAYBACK_BASE}`);
console.log(`  Output:    ${OUTPUT_DIR}`);
console.log('='.repeat(60));

await ensureDir(OUTPUT_DIR);

// Load existing manifest if any
let manifest = {};
if (existsSync(MANIFEST_OUT)) {
  try { manifest = JSON.parse(await readFile(MANIFEST_OUT, 'utf8')); } catch { /* fresh */ }
}
manifest.wayback = manifest.wayback ?? {};

// 1. Direct image URLs from CDX
const imageRows = await fetchArchivedImageUrls();
await sleep(DELAY_MS);

// 2. Pages to crawl for extra image refs
const pageRows  = await fetchArchivedPageUrls();
console.log(`\n   Will crawl ${pageRows.length} archived pages for image refs`);
await sleep(DELAY_MS);

// Collect all (originalUrl, timestamp) pairs for images
const toDownload = new Map(); // originalUrl → timestamp

for (const row of imageRows) {
  if (!toDownload.has(row.original)) {
    toDownload.set(row.original, row.timestamp);
  }
}

// Crawl pages
let pageCount = 0;
for (const page of pageRows) {
  pageCount++;
  if (pageCount % 20 === 0) console.log(`   … crawled ${pageCount}/${pageRows.length} pages`);
  const imgs = await extractImagesFromPage(page.timestamp, page.original);
  await sleep(DELAY_MS);
  for (const img of imgs) {
    if (!toDownload.has(img)) {
      // Use the same snapshot timestamp as the page it was found on
      toDownload.set(img, page.timestamp);
    }
  }
}

console.log(`\n📥 Downloading ${toDownload.size} images…`);

let downloaded = 0;
let failed     = 0;

for (const [originalUrl, timestamp] of toDownload) {
  const localPath = originalUrlToLocalPath(originalUrl);
  if (!localPath) continue;

  const destPath = join(OUTPUT_DIR, localPath);
  await ensureDir(join(destPath, '..'));

  const ok = await downloadFromWayback(originalUrl, timestamp, destPath);
  if (ok) {
    downloaded++;
    // Record in manifest under wayback key with path hierarchy
    const segments = localPath.split('/');
    const vehicleKey = segments[0] ?? 'misc';
    const groupKey   = segments.length > 2 ? segments.slice(0, -1).join('/') : segments[0] ?? 'misc';
    manifest.wayback[vehicleKey] = manifest.wayback[vehicleKey] ?? {};
    manifest.wayback[vehicleKey][groupKey] = manifest.wayback[vehicleKey][groupKey] ?? [];
    manifest.wayback[vehicleKey][groupKey].push(`/diagrams/${localPath}`);
  } else {
    failed++;
  }
  await sleep(DELAY_MS);
}

await writeFile(MANIFEST_OUT, JSON.stringify(manifest, null, 2));

console.log('\n' + '='.repeat(60));
console.log(` ✅ Done!`);
console.log(`    Downloaded: ${downloaded}`);
console.log(`    Failed:     ${failed}`);
console.log(`    Manifest:   ${MANIFEST_OUT}`);
console.log('='.repeat(60));
console.log('\nNext steps:');
console.log('  git add public/diagrams/ src/data/diagrams.json');
console.log('  git commit -m "Add technical drawings from Wayback Machine archive"');
