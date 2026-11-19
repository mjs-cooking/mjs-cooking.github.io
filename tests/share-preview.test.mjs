// Guards the link-preview (Open Graph) image shown when the site is shared.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://mjs-cooking.github.io/';
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const meta = (attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]+)"`))?.[1];

test('og:image is an absolute URL on the site and points to the cake pops photo', () => {
  const img = meta('property', 'og:image');
  assert.ok(img?.startsWith(SITE), `og:image must be absolute, got: ${img}`);
  assert.equal(img, `${SITE}images/cake-pops.jpg`);
});

test('og:image and twitter:image refer to a file that exists in the repo', () => {
  for (const url of [meta('property', 'og:image'), meta('name', 'twitter:image')]) {
    assert.ok(url, 'preview image tag missing');
    assert.ok(existsSync(join(ROOT, url.slice(SITE.length))), `missing file for ${url}`);
  }
});
