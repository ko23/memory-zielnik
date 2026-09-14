---
date: 2026-09-14T22:29:55+02:00
researcher: Claude Sonnet 5
git_commit: 52f83565aa49bb02a516a61e5cae7871ac69589d
branch: main
repository: ko23/memory-zielnik
topic: "T2: Cauldron tile back design"
tags: [research, codebase, gameboard, css-modules, asset-pipeline, image-processing]
status: complete
last_updated: 2026-09-14
last_updated_by: Claude Sonnet 5
---

# Research: T2 — Cauldron Tile Back Design

**Date**: 2026-09-14T22:29:55+02:00
**Researcher**: Claude Sonnet 5
**Git Commit**: [`52f8356`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d)
**Branch**: main
**Repository**: ko23/memory-zielnik

## Research Question

Research T2 (cauldron tile back) so it can be planned later — how should `assets/herb-seed-sources/cauldron.jpg` be served at runtime to render as a face-down memory-game tile's back design, sized to match the unified 150×150px tile footprint (`GameBoard.module.css`'s `.tile` class)? Scoped per the user's choice to the asset pipeline and CSS/component integration points, not a broader survey of alternative back-design approaches (CSS-only illustration, SVG, animation).

## Summary

The core question — how to serve `cauldron.jpg` at runtime — has a clear answer: **pre-resize it once with `sharp` (already a devDependency) into a small static file, and reference it as a direct Vite/Astro asset import from `src/assets/`** (matching the existing, if currently unused, `astro.svg`/`background.svg` precedent) — not through the herb-card data-URL pipeline, and not through `astro:assets`' `<Image>`/`getImage()` helpers (unused anywhere in this codebase, and not a natural fit for a React `client:load` island).

Two concrete hazards surfaced during research that any future plan must address explicitly:

1. **`cauldron.jpg` currently sits inside `assets/herb-seed-sources/`**, the exact directory `scripts/generate-herb-seed-data.mjs` scans to auto-generate every playable herb card. The script hasn't been re-run since the image was added (confirmed absent from `src/lib/storage/seed-data.ts`), but if it ever is re-run as-is, `cauldron.jpg` would be silently baked in as a bogus 15th herb card named "cauldron." **The asset must be relocated (or excluded) before any future plan is implemented.**
2. **Bundle-size**: this project's build already warns about oversized chunks — `src/lib/storage/seed-data.ts` (all 14 herb images as base64) is ~1.05MB and is essentially the entire size of the `GameApp` JS bundle it's baked into. Following the same base64-inline approach for the cauldron image would grow that already-warned-about chunk further, on every visitor's initial load. **A separate static file (not inlined into a `.ts`/`.tsx` module) avoids this entirely** and is independently browser-cacheable.

The `GameBoard.tsx` integration point itself is small and low-risk: exactly one line (`GameBoard.tsx:78`, the `"?"` fallback) needs to become an `<img>`, and exactly one new CSS class is needed (`.tileBack`, full 150×150 fill — `.tileImage`'s existing 70%-height split exists specifically to leave room for a name label, which a back design doesn't need). No other component references face-down tile appearance, and T3's grid/scroll mechanics are entirely unaffected (they govern the outer `.tile` box, not its content, and `.tile`'s existing `overflow: hidden` already guarantees containment regardless of inner content).

## Detailed Findings

### Asset pipeline: how to serve `cauldron.jpg` at runtime

- `assets/herb-seed-sources/` is **build-time-only** today — [`scripts/generate-herb-seed-data.mjs:11`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/scripts/generate-herb-seed-data.mjs#L11) defines `SOURCE_DIR` pointing there, read only by that Node script; nothing in it is shipped to the browser directly.
- `cauldron.jpg` is **2,047,507 bytes, 4000×6000px (portrait, 2:3), JPEG**, added in commit [`e0f690a`](https://github.com/ko23/memory-zielnik/commit/e0f690ac226f79e43bb472fecd231bcd67bd0c88) with message "cauldron picture for tiles cover" — confirming intent.
- **`public/` directory**: currently holds only `favicon.ico`/`favicon.svg`, referenced solely from `src/layouts/Layout.astro:6-7` via `<link href="/favicon.svg">`. Astro serves everything in `public/` verbatim, unprocessed, at the site root (confirmed: `dist/favicon.*` copied byte-for-byte, no hashing). **No existing precedent** for a React component (`.tsx`) referencing a `public/` asset via `<img src="/...">` — zero matches across `src/**/*.tsx`.
- **`src/assets/` directory**: holds `astro.svg` and `background.svg`, imported only by [`src/components/Welcome.astro:2-3`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/components/Welcome.astro#L2-L3) (`import astroLogo from '../assets/astro.svg'`, used as `astroLogo.src`). **`Welcome.astro` itself is orphaned/unused** — not imported by `src/pages/index.astro` or anywhere else — so this precedent exists in the codebase but isn't actually exercised by the live app today.
- Vite's asset-import pipeline (which Astro sits on) resolves `import img from "../assets/foo.svg"` to a module object with a `.src` string property (plus width/height/format metadata for raster images) — not a raw string. `astro.config.mjs` has no image/vite config beyond `integrations: [react()]`.
- **`astro:assets`' `<Image>`/`getImage()`**: zero usages anywhere in this codebase. `<Image>` is an `.astro`-only component (not usable from `.tsx`); `getImage()` is an async helper with no established precedent here and would be an awkward fit for a `client:load` React island.
- **Conclusion**: the natural path is a **direct Vite/Astro static import from `src/assets/`** (extending the dormant-but-real `astro.svg`/`background.svg` pattern) or a hand-placed file in `public/` (extending the `favicon.*` pattern) — not `astro:assets`, not the data-URL pipeline built for herb cards.

### The seed-generation collision hazard (critical, must be addressed in planning)

- [`scripts/generate-herb-seed-data.mjs:20-22`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/scripts/generate-herb-seed-data.mjs#L20-L22) filters `assets/herb-seed-sources/*.jpg` with no exclusion list — it would pick up `cauldron.jpg` exactly like any herb photo.
- `titleFromFilename` ([`scripts/generate-herb-seed-data.mjs:16-18`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/scripts/generate-herb-seed-data.mjs#L16-L18)) would turn it into the card name `"cauldron"`.
- Confirmed via `grep "cauldron" src/lib/storage/seed-data.ts` → no match today — the script hasn't been re-run since the image landed (file mtimes: `seed-data.ts` 09-14 01:48, `cauldron.jpg` 09-14 04:16), so this is a **latent** hazard, not yet triggered, but will fire the next time anyone regenerates herb seed data for an unrelated reason (e.g. adding a 16th herb) unless T2 relocates or excludes the file first.
- **Recommendation for the future plan**: move `cauldron.jpg` out of `assets/herb-seed-sources/` (e.g. into `src/assets/` directly, or a new `assets/ui/` directory) as an early, explicit step — before any resize/import work.

### Resize sizing and quality convention

- Existing convention: `RESIZE_WIDTH = 480`, `JPEG_QUALITY = 75` ([`scripts/generate-herb-seed-data.mjs:14-15`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/scripts/generate-herb-seed-data.mjs#L14-L15)), mirrored at runtime by `urlToResizedDataUrl` ([`src/lib/image.ts:1-2`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/lib/image.ts#L1-L2)).
- This 480px target already resolves to the same 150×150px final display box the cauldron image would use (`GameBoard.module.css`'s `.tile`) — herb card images end up in that exact box too. So 480px is not "oversized for a 150px target" by the herb-card precedent; it's already tuned for it (with headroom for the approve-flow's transient 200px/120px previews in `CardForm.tsx`).
- Given the cauldron image has only one consumer (the 150px tile, filling 100% not 70%), a case exists for using a **smaller** target width than 480px purely on output-size grounds — but this is a genuine open design choice, not something the codebase already answers, and belongs in the planning interview.
- `urlToResizedDataUrl()` is **confirmed browser-only** (`document.createElement("canvas")`, `createImageBitmap`, `canvas.toDataURL` — [`src/lib/image.ts:11-34`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/lib/image.ts#L11-L34)) and also does a live `fetch()` — not usable at build/Node time. Any Node-time transform of `cauldron.jpg` must use `sharp`, same as `generate-herb-seed-data.mjs`.
- `sharp` (`^0.35.4`, already a devDependency) is directly usable for a minimal one-off transform (a throwaway `node -e` invocation or a tiny short-lived script), without needing `generate-herb-seed-data.mjs`'s directory-scan/regeneration-ceremony — that script's shape (batch generator over N interchangeable, growable herb photos) doesn't fit a single fixed decorative asset with no per-user variation.

### Bundle-size implication (base64-inline vs. separate static file)

- Current build: `dist/_astro/GameApp.BnkjF7is.js` = **~1.03MB**, of which `src/lib/storage/seed-data.ts` (**1,046,685 bytes**, all 14 herb images as base64) accounts for essentially the entire size — confirmed as the direct cause of the Vite chunk-size warning already seen in `npm run build` output.
- Inlining a resized cauldron image as another base64 `.ts`/`.tsx` string constant would grow this same already-oversized chunk, shipped to every visitor on initial `client:load` regardless of whether any tile is ever flipped face-down.
- A **separate static file** referenced via `<img src="...">` avoids this: it's a separate network request/cache entry, independent of the JS bundle, natively lazy-loadable and cacheable by the browser — unlike a base64 string baked into JS.
- **Recommendation**: prefer a separate static asset file over baking cauldron into any generated `.ts` constant.

### `GameBoard.tsx` / `GameBoard.module.css` integration points

- The entire face-down/face-up branch lives in one ternary: [`GameBoard.tsx:72-79`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/components/GameBoard.tsx#L72-L79). The face-down fallback is the bare string `"?"` at line 78 — a one-line swap to an `<img>` element.
- `.tileImage` (`width: 100%; height: 70%; object-fit: contain` — [`GameBoard.module.css:22-26`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/components/GameBoard.module.css#L22-L26)) reserves the bottom 30% for `.tileName`. A back design has no name label, so **reusing `.tileImage` as-is would waste 30% of the tile as blank centered space** — a new `.tileBack` class (`width: 100%; height: 100%`, `object-fit` as a design choice between `cover`/`contain`) is the right shape, following the same one-class-per-visual-element CSS Module convention T1 established.
- **No conflict with T3's grid/scroll mechanics**: `.grid`'s `display: grid`/`gap`/`overflow-x: auto` and the per-game inline `gridTemplateColumns` ([`GameBoard.tsx:60`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/components/GameBoard.tsx#L60)) govern only the outer grid/column layout, not a tile's inner content. `.tile`'s existing `overflow: hidden` ([`GameBoard.module.css:15`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/components/GameBoard.module.css#L15)) — already relied on by the `unified-tile-size` impl-review as a "belt-and-suspenders" containment guarantee — clamps a full-bleed `.tileBack` image the same way it already clamps `.tileImage`.
- **Scope is genuinely limited to `GameBoard.tsx` + `GameBoard.module.css`** (+ the new asset/import). Grepped every other component (`CardManager.tsx`, `CardForm.tsx`, `GameEndScreen.tsx`, `GameSetup.tsx`, `Menu.tsx`, `PlayGame.tsx`, `GameApp.tsx`) — none render or reference tile/face-down appearance.

## Code References

- [`src/components/GameBoard.tsx:60`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/components/GameBoard.tsx#L60) — grid container, per-game inline `gridTemplateColumns`
- [`src/components/GameBoard.tsx:72-79`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/components/GameBoard.tsx#L72-L79) — face-up/face-down ternary; line 78 is the exact swap point
- [`src/components/GameBoard.module.css:1-37`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/components/GameBoard.module.css) — full CSS Module; `.tile` (7-16), `.tileImage` (22-26), `.tileName` (28-37) are the classes a `.tileBack` addition sits alongside
- [`scripts/generate-herb-seed-data.mjs:1-73`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/scripts/generate-herb-seed-data.mjs) — sharp-based resize/compress/base64-bake pattern; lines 14-15 (resize params), 20-22 (unguarded `.jpg` scan — the collision hazard)
- [`src/lib/image.ts:1-34`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/lib/image.ts) — browser-only canvas-based resize, confirmed not usable at build time
- [`src/components/Welcome.astro:2-3,10-11`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/components/Welcome.astro#L2-L11) — the only (currently orphaned) precedent for `src/assets/` static imports
- [`src/layouts/Layout.astro:6-7`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/src/layouts/Layout.astro#L6-L7) — the only precedent for `public/`-served assets (favicon, `.astro`-only, no `.tsx` precedent)
- `assets/herb-seed-sources/cauldron.jpg` — source asset, 2,047,507 bytes, 4000×6000px, added in commit `e0f690a`

## Architecture Insights

- This project has **two distinct, non-interchangeable image-handling conventions**: (a) a data-URL pipeline (build-time `sharp` + runtime `urlToResizedDataUrl`) for user/seed herb card images that get persisted as `HerbCard.imageDataUrl` strings, and (b) plain static-file Vite/Astro imports for decorative UI assets (`astro.svg`/`background.svg`, dormant but real). The cauldron image is decorative and fixed, not persisted or user-authored data — it belongs to convention (b), not (a). Using the herb-card pipeline for it would be a category error, not just a style mismatch — `HerbSeedCard`'s generated type and `seedDefaultCards()`'s consumption path assume every entry is a playable card, which the cauldron explicitly is not.
- The project's chunk-size warning is a real, already-manifesting cost of convention (a)'s base64-inlining approach — worth treating as a soft ceiling not to add to casually, reinforcing why T2 should use a static file.
- CSS Modules remain the sole styling mechanism (`GameBoard.module.css` is still the only one in the repo) — T2 should extend it, not introduce a new styling approach.

## Historical Context (from prior changes)

- [`context/changes/unified-tile-size/plan.md`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/context/changes/unified-tile-size/plan.md) (T1) — established the CSS Module pattern and the 150×150px fixed footprint T2 must match; its impl-review recorded the `.tile`'s `overflow: hidden` as a deliberate containment guarantee T2 can rely on.
- [`context/changes/unified-tile-size/reviews/impl-review.md`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/context/changes/unified-tile-size/reviews/impl-review.md) — O1 finding (trailing-space-in-template-literal className pattern) worth reusing the fixed pattern from if T2's JSX needs conditional classes.
- [`context/changes/multi-row-tile-grid/plan.md`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/context/changes/multi-row-tile-grid/plan.md) (T3) — bumped tile size 100px → 150px (a late follow-up during manual verification, not originally planned); confirms `.tile`'s dimensions are still a moving target that got settled at 150px, which T2 should treat as current ground truth.
- [`context/changes/multi-row-tile-grid/reviews/impl-review.md`](https://github.com/ko23/memory-zielnik/blob/52f83565aa49bb02a516a61e5cae7871ac69589d/context/changes/multi-row-tile-grid/reviews/impl-review.md) — O3 finding re-confirmed the 150px bump didn't break `.tileImage`/`.tileName`'s proportional CSS; same category of check T2 should re-run for its own new class.
- `context/foundation/lessons.md` — two rules apply if touched: vendor-prefixed CSS needs its standard fallback declared alongside it (only relevant if T2's CSS uses a prefixed property); pure functions with implicit input-range assumptions need the guarantee stated explicitly (only relevant if T2 introduces a new pure helper, which a pure visual swap likely doesn't need).
- Both prior plans (T1, T3) used **zero new automated tests** (no component tests, per this project's established convention) — verification was `tsc --noEmit` + `npm run build` + manual visual checks across representative cases. T2 should plan the same shape: no unit tests expected, manual verification checklist instead.
- GitHub issue [#8](https://github.com/ko23/memory-zielnik/issues/8) is the existing tracking issue for this work — already names the asset-pipeline unknown this research resolves; not yet linked from any `context/changes/` artifact before this research doc.

## Related Research

- None prior — this is the first research artifact for `cauldron-tile-back`/T2.

## Open Questions

These are genuine design decisions for the planning interview, not resolved by this research:

1. **Exact resize width/quality for the cauldron image** — codebase convention (480px/quality-75) is available but not obviously optimal for a single-consumer 150px asset; a materially smaller width is defensible but unprecedented here.
2. **`object-fit: cover` vs `contain` for `.tileBack`** — `cover` gives a full-bleed, no-empty-space look (crops the 2:3 portrait source to fit the 1:1 tile); `contain` shows the whole image with letterboxing. T1 chose `contain` for face-up herb images (explicit user decision, to never crop a herb photo) — whether that same reasoning applies to a purely decorative, non-informational cauldron image is a fresh question, not inherited from T1's precedent.
3. **Exact relocation target for the source file** — `src/assets/` (direct Vite import, following `astro.svg`/`background.svg`) vs. `public/` (following `favicon.*`) vs. a new dedicated directory — each has a real precedent in this codebase; no clear winner without a planning-time decision.
4. **Whether to fix the `generate-herb-seed-data.mjs` collision hazard as part of this change**, or treat it as a separate, smaller prerequisite/follow-up (e.g. adding an exclusion filter to the script regardless of where `cauldron.jpg` ends up, as defense-in-depth).
