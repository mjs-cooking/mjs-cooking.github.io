// Guards data/dishes.json so a typo never ships a broken gallery.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { thumbFor } from '../js/gallery.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dishes = JSON.parse(readFileSync(join(ROOT, 'data', 'dishes.json'), 'utf8'));

test('dishes.json is a non-empty list', () => {
  assert.ok(Array.isArray(dishes) && dishes.length > 0);
});

test('every dish has a title, category and string caption', () => {
  for (const d of dishes) {
    assert.ok(typeof d.title === 'string' && d.title.trim(), `missing title: ${JSON.stringify(d)}`);
    assert.ok(typeof d.category === 'string' && d.category.trim(), `missing category: ${d.title}`);
    assert.equal(typeof (d.caption ?? ''), 'string', `bad caption: ${d.title}`);
  }
});

test('every image and its thumbnail exist on disk', () => {
  for (const d of dishes) {
    assert.ok(d.image, `no image for: ${d.title}`);
    assert.ok(existsSync(join(ROOT, d.image)), `image not found: ${d.image}`);
    assert.ok(existsSync(join(ROOT, thumbFor(d.image))), `thumbnail not found for ${d.image} — run: npm run thumbs`);
  }
});

test('no two dishes share the same image file', () => {
  const images = dishes.map((d) => d.image);
  assert.equal(new Set(images).size, images.length);
});
