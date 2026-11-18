#!/usr/bin/env node
// One-time exporter: pulls dishes (image + title + caption) from the old
// Google Sites gallery and writes data/dishes.json + images/.
//
// Usage: node scripts/export-google-site.mjs [url]

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_URL = 'https://sites.google.com/site/muthukumarnet/home';

// Lines that are page chrome, not dish text.
const IGNORED_LINES = new Set([
  'Search this site', 'Embedded Files', 'Skip to main content', 'Skip to navigation',
  "MJ's Cooking Gallery", 'Google Sites', 'Report abuse', 'Page details', 'Page updated',
]);

const CATEGORY_RULES = [
  ['Biryani & Rice', /biriyani|pulao|kitchadi/i],
  ['Chinese & Asian', /kungpao|tso chicken|chowmein|mapo|manchurian|momos/i],
  ['Sweets', /halwa|burfi|ladoo|laddoo|mysorepak|jangri|adhirasam|kesari|palkova|badusha|kulfi|ice cream|rasamalai|kolukattai|boli|sukhian|dilkush|milk cake|diwali|appam/i],
  ['Cakes & Bakes', /cake|cheesecake|bread|muffin|brownie|macaron|donut|cookies|pav$|pizza|baklava|flan|crepe|nankhatai|french toast/i],
  ['Snacks', /murukku|thattai|mixture|pakkoda|mathri|chips|boondi|samosa|somosa|fingers|dhokla|kebab/i],
  ['Breakfast & Tiffin', /dosa|idli|puttu|poori|parotta|chappati|naan|pathiri|sadhya|bhaaji/i],
  ['Curries & Mains', /.*/],
];

export function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

export function slugify(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function categorize(title) {
  return CATEGORY_RULES.find(([, re]) => re.test(title))[0];
}

/**
 * Parse the Google Sites HTML into [{ title, caption, imageUrl }].
 * Each dish is an <img> followed by a title line and an optional caption line.
 * Text before the first image (or with no image) is attached as an image-less dish.
 */
export function parseSite(html) {
  const bodyStart = html.indexOf('<body');
  let s = bodyStart >= 0 ? html.slice(bodyStart) : html;
  s = s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '');
  s = s.replace(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi, '\n[[IMG $1]]\n');
  s = s.replace(/<\/(p|h\d|div|li)>|<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  const lines = s.split('\n').map((l) => decodeEntities(l).replace(/\s+/g, ' ').trim()).filter(Boolean);

  const dishes = [];
  let current = null;
  for (const line of lines) {
    const img = line.match(/^\[\[IMG (.+)\]\]$/);
    if (img) {
      current = { title: '', caption: '', imageUrl: decodeEntities(img[1]) };
      dishes.push(current);
    } else if (IGNORED_LINES.has(line)) {
      continue;
    } else if (current && !current.title) {
      current.title = line;
    } else if (current && !current.caption) {
      current.caption = line;
    } else if (current) {
      // Stray extra text (e.g. a leftover label): the last line wins as the caption.
      current.caption = line;
    }
  }
  return dishes.filter((d) => d.title);
}

/** Give each dish a unique slug; duplicates get -2, -3, ... */
export function assignSlugs(dishes) {
  const seen = new Map();
  return dishes.map((d) => {
    const base = slugify(d.title) || 'dish';
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    return { ...d, slug: n === 1 ? base : `${base}-${n}` };
  });
}

const sizedUrl = (url, size) => url.replace(/=[ws]\d+(-[a-z0-9-]+)?$/i, '') + `=${size}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(url, file, attempts = 3) {
  for (let i = 1; ; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (site-export)' } });
    if (res.ok) return writeFile(file, Buffer.from(await res.arrayBuffer()));
    if (i >= attempts) throw new Error(`HTTP ${res.status} for ${url}`);
    await sleep(2000 * 2 ** (i - 1)); // back off: 2s, 4s, 8s...
  }
}

async function main() {
  const url = process.argv[2] || DEFAULT_URL;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const dishes = assignSlugs(parseSite(await res.text()));

  await mkdir(join(ROOT, 'images', 'thumbs'), { recursive: true });
  await mkdir(join(ROOT, 'data'), { recursive: true });

  const out = [];
  const failed = [];
  for (const d of dishes) {
    const entry = { title: d.title, caption: d.caption, category: categorize(d.title), image: '' };
    if (d.imageUrl) {
      entry.image = `images/${d.slug}.jpg`;
      const full = join(ROOT, entry.image);
      const thumb = join(ROOT, 'images', 'thumbs', `${d.slug}.jpg`);
      try {
        if (!existsSync(full)) await download(sizedUrl(d.imageUrl, 'w1600'), full);
        if (!existsSync(thumb)) await download(sizedUrl(d.imageUrl, 'w600'), thumb);
      } catch (e) {
        console.warn(`⚠ Could not download image for "${d.title}": ${e.message.slice(0, 40)}`);
        entry.image = '';
        failed.push(d.title);
      }
      await sleep(300);
    }
    out.push(entry);
    process.stdout.write(`✓ ${d.title}\n`);
  }
  await writeFile(join(ROOT, 'data', 'dishes.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`\nExported ${out.length} dishes.`);
  if (failed.length) console.log(`Missing images (${failed.length}): ${failed.join(', ')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
