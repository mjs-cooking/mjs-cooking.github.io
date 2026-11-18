# MJ's Cooking Gallery

Live site: **https://mjs-cooking.github.io**

A simple photo gallery of home-cooked dishes. Plain HTML/CSS/JS, no build step — GitHub Pages serves it as-is.

## Add a new dish

1. Copy the photo into `images/` with a short lowercase name, e.g. `images/ghee-roast-dosa.jpg`.
2. Add an entry to `data/dishes.json` (new dishes at the top show first):
   ```json
   {
     "title": "Ghee Roast Dosa",
     "caption": "Crispy, golden and generous with ghee",
     "category": "Breakfast & Tiffin",
     "image": "images/ghee-roast-dosa.jpg"
   },
   ```
   Use one of the existing categories (Sweets, Cakes & Bakes, Curries & Mains, Snacks, Chinese & Asian, Breakfast & Tiffin, Biryani & Rice) or a new one — new categories get their own filter chip automatically.
3. Make the thumbnail and check everything:
   ```sh
   npm run thumbs   # creates images/thumbs/ghee-roast-dosa.jpg (macOS)
   npm test         # verifies every dish has a title, image and thumbnail
   ```
4. Preview locally with `npm run serve` → http://localhost:8000, then commit and push. The site updates in about a minute.

## Layout

| Path | What |
|---|---|
| `index.html`, `css/`, `js/app.js` | The page |
| `js/gallery.js` | Filtering/search logic (unit-tested) |
| `data/dishes.json` | All dishes — the only file you edit |
| `images/`, `images/thumbs/` | Full-size photos and 600px thumbnails |
| `scripts/export-google-site.mjs` | One-time importer from the old Google Site |
| `scripts/make-thumbs.mjs` | Generates missing thumbnails |
| `tests/` | `npm test` (Node's built-in test runner, no installs) |
