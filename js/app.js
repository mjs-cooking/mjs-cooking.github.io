import { ALL, categoriesOf, filterDishes, thumbFor, withIds, step } from './gallery.js';

const $ = (id) => document.getElementById(id);
const state = { all: [], shown: [], category: ALL, query: '', current: -1 };

function el(tag, props = {}, ...children) {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...children.filter(Boolean));
  return n;
}

function renderChips() {
  $('chips').replaceChildren(...categoriesOf(state.all).map((c) =>
    el('button', {
      className: 'chip', type: 'button', textContent: c,
      ariaPressed: String(c === state.category),
      onclick: () => { state.category = c; renderChips(); renderGrid(); },
    })));
}

function card(d, i) {
  const img = el('img', { src: thumbFor(d.image), alt: d.title, loading: 'lazy', decoding: 'async' });
  img.onerror = () => { if (img.src !== new URL(d.image, location.href).href) img.src = d.image; };
  const btn = el('button', { className: 'card', type: 'button', onclick: () => openViewer(i) },
    el('div', { className: 'ph' }, d.image ? img : null),
    el('div', { className: 'body' },
      el('span', { className: 'tag', textContent: d.category }),
      el('h3', { textContent: d.title }),
      d.caption ? el('p', { textContent: d.caption }) : null));
  return el('li', {}, btn);
}

function renderGrid() {
  state.shown = filterDishes(state.all, state);
  $('grid').replaceChildren(...state.shown.map(card));
  $('empty').hidden = state.shown.length > 0;
  $('count').textContent = `${state.shown.length} dish${state.shown.length === 1 ? '' : 'es'}`;
}

function showCurrent() {
  const d = state.shown[state.current];
  if (!d) return;
  $('viewer-img').src = d.image;
  $('viewer-img').alt = d.title;
  $('viewer-title').textContent = d.title;
  $('viewer-caption').textContent = d.caption || '';
  $('viewer-cat').textContent = d.category;
  history.replaceState(null, '', `#${d.id}`);
}

function openViewer(i) {
  state.current = i;
  showCurrent();
  if (!$('viewer').open) $('viewer').showModal();
}

function move(delta) {
  state.current = step(state.current, delta, state.shown.length);
  showCurrent();
}

function closeViewer() {
  $('viewer').close();
}

function wireViewer() {
  const v = $('viewer');
  v.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'close' || e.target === v || e.target.tagName === 'FIGURE') closeViewer();
    else if (act === 'prev') move(-1);
    else if (act === 'next') move(1);
  });
  v.addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search));
  v.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
  });
  let x0 = null;
  v.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  v.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
    x0 = null;
  });
}

async function init() {
  $('year').textContent = new Date().getFullYear();
  const res = await fetch('data/dishes.json');
  state.all = withIds(await res.json());
  renderChips();
  renderGrid();
  wireViewer();
  $('search').addEventListener('input', (e) => { state.query = e.target.value; renderGrid(); });

  const fromHash = state.shown.findIndex((d) => `#${d.id}` === location.hash);
  if (fromHash >= 0) openViewer(fromHash);
}

init().catch((e) => {
  $('count').textContent = 'Could not load dishes.';
  console.error(e);
});
