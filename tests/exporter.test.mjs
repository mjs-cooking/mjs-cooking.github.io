import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSite, assignSlugs, slugify, decodeEntities, categorize } from '../scripts/export-google-site.mjs';
import { missingThumbs } from '../scripts/make-thumbs.mjs';

const html = `<html><head><style>.x{}</style></head><body>
  <script>var a = "<img src='nope'>";</script>
  <div>Skip to main content</div><h1>MJ&#39;s Cooking Gallery</h1>
  <div><img src="https://example.com/a=w1280" class="x"></div><p>Badam Halwa</p>
  <div><img src="https://example.com/b=w1280"></div><p>Kesari</p><p>South Indian delicacy</p>
  <div><img src="https://example.com/c=w1280"></div><p>Idli Vada Sambar</p><p>Stray</p><p>Traditional breakfast</p>
  <div><img src="https://example.com/d=w1280"></div><p>Fish &amp; Kappa</p>
  <div>Google Sites</div><div>Report abuse</div>
</body></html>`;

test('parseSite pairs each image with its title and caption, ignoring chrome and scripts', () => {
  assert.deepEqual(parseSite(html), [
    { title: 'Badam Halwa', caption: '', imageUrl: 'https://example.com/a=w1280' },
    { title: 'Kesari', caption: 'South Indian delicacy', imageUrl: 'https://example.com/b=w1280' },
    { title: 'Idli Vada Sambar', caption: 'Traditional breakfast', imageUrl: 'https://example.com/c=w1280' },
    { title: 'Fish & Kappa', caption: '', imageUrl: 'https://example.com/d=w1280' },
  ]);
});

test('parseSite returns nothing for a page without images', () => {
  assert.deepEqual(parseSite('<body><p>Hello</p></body>'), []);
});

test('assignSlugs de-duplicates repeated titles', () => {
  const out = assignSlugs([{ title: 'Badam Halwa' }, { title: 'Badam Halwa' }, { title: 'Badam Halwa' }]);
  assert.deepEqual(out.map((d) => d.slug), ['badam-halwa', 'badam-halwa-2', 'badam-halwa-3']);
});

test('slugify and decodeEntities', () => {
  assert.equal(slugify('Naan & Mutter Panner'), 'naan-mutter-panner');
  assert.equal(slugify('Cauliflower Pulao / Fry'), 'cauliflower-pulao-fry');
  assert.equal(decodeEntities('Don&#39;t &amp; won&quot;t'), 'Don\'t & won"t');
});

test('categorize assigns sensible categories', () => {
  assert.equal(categorize('Chicken Biriyani'), 'Biryani & Rice');
  assert.equal(categorize('Milk Cake'), 'Sweets');
  assert.equal(categorize('Black Forest Cake'), 'Cakes & Bakes');
  assert.equal(categorize('Kungpao Chicken'), 'Chinese & Asian');
  assert.equal(categorize('Murukku'), 'Snacks');
  assert.equal(categorize('Paper Dosa'), 'Breakfast & Tiffin');
  assert.equal(categorize('Mutton Curry'), 'Curries & Mains');
});

test('missingThumbs finds images without thumbnails', () => {
  const files = new Set(['images/a.jpg', 'images/b.jpg', 'images/thumbs/a.jpg']);
  const out = missingThumbs(
    [{ image: 'images/a.jpg' }, { image: 'images/b.jpg' }, { image: 'images/gone.jpg' }, { image: '' }],
    (p) => files.has(p),
  );
  assert.deepEqual(out.map((d) => d.image), ['images/b.jpg']);
});
