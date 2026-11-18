#!/usr/bin/env node
// Creates missing thumbnails (600px wide) in images/thumbs/ for every image in
// data/dishes.json. Uses macOS `sips` (built in) — no installs needed.
//
// Usage: npm run thumbs

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { thumbFor } from '../js/gallery.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Dishes whose image exists but whose thumbnail does not. */
export function missingThumbs(dishes, exists = (p) => existsSync(join(ROOT, p))) {
  return dishes.filter((d) => d.image && exists(d.image) && !exists(thumbFor(d.image)));
}

function main() {
  const dishes = JSON.parse(readFileSync(join(ROOT, 'data', 'dishes.json'), 'utf8'));
  mkdirSync(join(ROOT, 'images', 'thumbs'), { recursive: true });
  const todo = missingThumbs(dishes);
  for (const d of todo) {
    execFileSync('sips', ['--resampleWidth', '600', join(ROOT, d.image), '--out', join(ROOT, thumbFor(d.image))], { stdio: 'ignore' });
    console.log(`✓ ${thumbFor(d.image)}`);
  }
  console.log(todo.length ? `Created ${todo.length} thumbnail(s).` : 'All thumbnails up to date.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
