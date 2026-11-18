import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALL, categoriesOf, filterDishes, thumbFor, withIds, step } from '../js/gallery.js';

const dishes = [
  { title: 'Chicken Biriyani', caption: 'Competition for thalappakatti', category: 'Biryani & Rice' },
  { title: 'Badam Halwa', caption: '', category: 'Sweets' },
  { title: 'Kesari', caption: 'South Indian delicacy', category: 'Sweets' },
  { title: 'Badam Halwa', caption: 'High protein', category: 'Sweets' },
];

test('categoriesOf returns All + unique categories in order', () => {
  assert.deepEqual(categoriesOf(dishes), [ALL, 'Biryani & Rice', 'Sweets']);
  assert.deepEqual(categoriesOf([]), [ALL]);
});

test('filterDishes by category', () => {
  assert.equal(filterDishes(dishes, { category: 'Sweets' }).length, 3);
  assert.equal(filterDishes(dishes, { category: ALL }).length, 4);
  assert.equal(filterDishes(dishes).length, 4);
});

test('filterDishes search is case-insensitive and matches title, caption, category', () => {
  assert.deepEqual(filterDishes(dishes, { query: 'BIRIYANI' }).map((d) => d.title), ['Chicken Biriyani']);
  assert.deepEqual(filterDishes(dishes, { query: 'delicacy' }).map((d) => d.title), ['Kesari']);
  assert.equal(filterDishes(dishes, { query: 'sweets' }).length, 3);
});

test('filterDishes requires all search terms and combines with category', () => {
  assert.equal(filterDishes(dishes, { query: 'badam protein' }).length, 1);
  assert.equal(filterDishes(dishes, { query: 'kesari', category: 'Biryani & Rice' }).length, 0);
  assert.equal(filterDishes(dishes, { query: '   ' }).length, 4);
});

test('thumbFor inserts thumbs/ before the file name', () => {
  assert.equal(thumbFor('images/kesari.jpg'), 'images/thumbs/kesari.jpg');
  assert.equal(thumbFor('x.jpg'), 'thumbs/x.jpg');
  assert.equal(thumbFor(''), '');
});

test('withIds makes unique slug ids for duplicate titles', () => {
  assert.deepEqual(withIds(dishes).map((d) => d.id), ['chicken-biriyani', 'badam-halwa', 'kesari', 'badam-halwa-2']);
  assert.equal(withIds([{ title: '!!!' }])[0].id, 'dish');
});

test('step wraps around in both directions', () => {
  assert.equal(step(0, 1, 3), 1);
  assert.equal(step(2, 1, 3), 0);
  assert.equal(step(0, -1, 3), 2);
  assert.equal(step(0, 1, 0), -1);
});
