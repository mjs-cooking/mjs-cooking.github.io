// Pure helpers for the gallery (no DOM) — shared by the browser and unit tests.

export const ALL = 'All';

/** Categories in first-seen order, prefixed with "All". */
export function categoriesOf(dishes) {
  return [ALL, ...new Set(dishes.map((d) => d.category).filter(Boolean))];
}

const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** Filter by category and a free-text query (matches title, caption or category). */
export function filterDishes(dishes, { category = ALL, query = '' } = {}) {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  return dishes.filter((d) => {
    if (category !== ALL && d.category !== category) return false;
    const hay = norm(`${d.title} ${d.caption} ${d.category}`);
    return terms.every((t) => hay.includes(t));
  });
}

/** Thumbnail path for a full-size image: images/x.jpg -> images/thumbs/x.jpg */
export function thumbFor(image) {
  if (!image) return '';
  const i = image.lastIndexOf('/');
  return `${image.slice(0, i + 1)}thumbs/${image.slice(i + 1)}`;
}

/** URL-safe id for a dish, used for #deep-links. Duplicate titles get -2, -3... */
export function withIds(dishes) {
  const seen = new Map();
  return dishes.map((d) => {
    const base = norm(d.title).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'dish';
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    return { ...d, id: n === 1 ? base : `${base}-${n}` };
  });
}

/** Index of the next/previous item, wrapping around. */
export function step(index, delta, length) {
  if (length <= 0) return -1;
  return (((index + delta) % length) + length) % length;
}
