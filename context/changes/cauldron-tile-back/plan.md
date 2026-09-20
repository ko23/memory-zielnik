# Cauldron Tile Back Implementation Plan

## Overview

Face-down memory-match tiles currently show a plain `"?"` character. This plan swaps that placeholder for a themed brown-cauldron-on-fire image, filling the tile's full 150×150px footprint, matching the design already asked for in GitHub issue #8.

## Current State Analysis

- `GameBoard.tsx:72-79` renders a ternary: face-up tiles show `<img className={styles.tileImage} src={card.imageDataUrl} alt={card.name} />` + a name label; face-down tiles render the bare string `"?"`.
- `GameBoard.module.css` defines `.tile` (150×150px, `overflow: hidden`), `.tileImage` (100% width, 70% height — the remaining 30% is reserved for `.tileName`), and `.tileName`. No class exists yet for face-down tile content.
- The source image, `assets/herb-seed-sources/cauldron.jpg` (2,047,507 bytes, 4000×6000px JPEG), sits inside `assets/herb-seed-sources/` — the exact directory `scripts/generate-herb-seed-data.mjs` scans (unfiltered, by extension only) to auto-generate every playable herb card. If that script is ever re-run while the file remains there, it would silently bake in a bogus 15th herb card named "cauldron."
- `src/assets/` already holds two decorative assets (`astro.svg`, `background.svg`) consumed via a direct Vite/Astro static import (`import x from '../assets/foo.svg'` → `x.src`), used today only by the orphaned `Welcome.astro`. This import mechanism works identically for a JPEG — confirmed via `astro/client.d.ts` (referenced by the auto-generated `.astro/types.d.ts`), which declares module types for `.jpg` imports, so no new type declaration file is needed.
- `sharp` (`^0.35.4`) is already a devDependency, used by `scripts/generate-herb-seed-data.mjs` for build-time resize/compress of herb photos (`RESIZE_WIDTH = 480`, `JPEG_QUALITY = 75`). That script's batch-generator shape doesn't fit a single fixed decorative asset — this plan uses a one-off `sharp` invocation instead, not the script itself.
- `src/lib/image.ts`'s `urlToResizedDataUrl()` is confirmed browser-only (canvas + `fetch`) — not usable for this build-time transform.
- The project's build already warns about an oversized JS chunk: `src/lib/storage/seed-data.ts` (all 14 herb images inlined as base64) is ~1.05MB, essentially the entire `GameApp` bundle. A separate static asset file (not inlined into a `.ts` module) avoids adding to this.

## Desired End State

Face-down tiles render the resized cauldron image, full-bleed, filling the entire 150×150px tile with no visible empty space. `assets/herb-seed-sources/` no longer contains `cauldron.jpg`, so re-running `scripts/generate-herb-seed-data.mjs` can never pick it up as a bogus herb card.

**Verification**: `npm run build` succeeds with no new type errors; loading the game and flipping any tile face-down (or before any tile is flipped) shows the cauldron image filling the tile; `git status`/`ls assets/herb-seed-sources/` confirms `cauldron.jpg` is no longer there.

### Key Discoveries:

- `GameBoard.tsx:78` — the exact one-line swap point (`"?"` → `<img>`).
- `GameBoard.module.css:22-26` (`.tileImage`) reserves 30% of the tile height for a name label that a back design doesn't need — a new `.tileBack` class is required, not a reuse of `.tileImage`.
- `.tile`'s existing `overflow: hidden` (`GameBoard.module.css:15`) already clamps any full-bleed inner content, so `object-fit: cover`'s crop is visually safe regardless of the tile's exact box.
- No other component (`CardManager.tsx`, `CardForm.tsx`, `GameEndScreen.tsx`, `GameSetup.tsx`, `Menu.tsx`, `PlayGame.tsx`, `GameApp.tsx`) references face-down tile appearance — scope is fully contained to `GameBoard.tsx` + `GameBoard.module.css` + the asset itself.

## What We're NOT Doing

- Not touching `scripts/generate-herb-seed-data.mjs` itself (no exclude-filter/allowlist guard added) — moving the raw source out of the scanned directory fully closes the collision hazard on its own.
- Not using `astro:assets`' `<Image>`/`getImage()` helpers — unused anywhere in this codebase and an awkward fit for a `client:load` React island.
- Not serving the asset from `public/` — no `.tsx` precedent exists for that pattern in this codebase.
- Not adding any automated component/visual test — matches this project's established convention (T1/T3 shipped zero new tests; verification was `tsc`/`build`/manual checks).
- Not animating or adding interaction to the tile back — purely a static visual swap.

## Implementation Approach

Two phases: first prepare the runtime asset (resize + relocate, which also closes the seed-script collision hazard as a side effect), then wire it into the component. This mirrors the `multi-row-tile-grid` (T3) precedent of separating a data/asset-prep step from the component-wiring step, and keeps each phase independently verifiable.

## Phase 1: Asset preparation

### Overview

Resize the raw cauldron photo to a runtime-appropriate size and relocate it out of the herb-seed scan directory, closing the seed-script collision hazard.

### Changes Required:

#### 1. Move the raw source out of the scanned directory

**File**: `assets/herb-seed-sources/cauldron.jpg` → `assets/cauldron-source.jpg`

**Intent**: Removes the file from `assets/herb-seed-sources/`, the directory `scripts/generate-herb-seed-data.mjs` scans, permanently closing the collision hazard. Keeping the raw high-resolution source (rather than deleting it) preserves it as the source-of-truth if the runtime asset ever needs to be regenerated at a different size in the future.

**Contract**: `git mv assets/herb-seed-sources/cauldron.jpg assets/cauldron-source.jpg`

#### 2. Generate the resized runtime asset

**File**: `src/assets/cauldron.jpg` (new)

**Intent**: Produces the small, runtime-servable copy that `GameBoard.tsx` will import — 300px width (2x the 150px display box, retina-sharp), quality 75 (matching the existing herb-card JPEG quality convention). 300px is deliberately smaller than the herb-card pipeline's 480px target: this image has exactly one consumer (the fixed 150px tile), unlike herb cards, which also cover transient 200px/120px approve-flow previews that 480px was sized to also serve.

**Contract**: One-off `sharp` invocation (not a checked-in script — matches research's finding that `generate-herb-seed-data.mjs`'s batch-generator shape doesn't fit a single fixed asset). The project is ESM (`"type": "module"` in `package.json`), so a plain `node -e` runs as CommonJS by default — use `--input-type=module` to run ESM `import` syntax:

```bash
node --input-type=module -e "
import sharp from 'sharp';
await sharp('assets/cauldron-source.jpg')
  .resize({ width: 300 })
  .jpeg({ quality: 75 })
  .toFile('src/assets/cauldron.jpg');
"
```

### Success Criteria:

#### Automated Verification:

- `assets/herb-seed-sources/` no longer contains `cauldron.jpg`: `! test -f assets/herb-seed-sources/cauldron.jpg`
- `src/assets/cauldron.jpg` exists: `test -f src/assets/cauldron.jpg`
- `node -e "const sharp=require('sharp'); sharp('src/assets/cauldron.jpg').metadata().then(m => { if (m.width !== 300) process.exit(1); })"` confirms the generated file is 300px wide

#### Manual Verification:

- Open `src/assets/cauldron.jpg` in an image viewer — confirms it's a recognizable, non-corrupted resized cauldron image

---

## Phase 2: Component integration

### Overview

Wire the resized asset into `GameBoard.tsx`'s face-down tile rendering and add the CSS to fill the tile.

### Changes Required:

#### 1. Import and render the cauldron image for face-down tiles

**File**: `src/components/GameBoard.tsx`

**Intent**: Replace the `"?"` placeholder with the themed cauldron image. The image is decorative (conveys no card-identity information, unlike a face-up herb photo), so it gets an empty `alt=""` — following the same precedent as `background.svg`'s decorative-image usage in `Welcome.astro`.

**Contract**: Add `import cauldronBack from "../assets/cauldron.jpg";` near the top of the file. In the face-up/face-down ternary (line 72-79), replace the `"?"` branch with `<img className={styles.tileBack} src={cauldronBack.src} alt="" />`.

#### 2. Add the `.tileBack` CSS class

**File**: `src/components/GameBoard.module.css`

**Intent**: Fill the entire 150×150px tile with no reserved label space (unlike `.tileImage`'s 70%-height split), cropping the 2:3 portrait source to the 1:1 tile so the back design reads as full-bleed with no visible empty space.

**Contract**: New class alongside `.tileImage`/`.tileName`:

```css
.tileBack {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Success Criteria:

#### Automated Verification:

- Type check passes: `npx astro check` — confirms the `.jpg` import resolves and typechecks
- Build succeeds: `npm run build`

#### Manual Verification:

- Load the game (`npm run preview` or `npm run dev`), start a match, and confirm every face-down tile shows the cauldron image filling the tile with no visible `"?"` or empty space
- Flip a tile face-up, then let it flip back face-down (mismatch case) — confirms the cauldron image reappears correctly, not a stale/broken image
- Visually confirm the cauldron/flame isn't cropped out of frame by the `cover` crop (source is a 2:3 portrait cropped to 1:1 — check the subject stays centered)
- Confirm no layout shift or overflow beyond the 150×150 tile boundary

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful.

---

## Testing Strategy

### Unit Tests:

- None — matches this project's established convention (T1/T3 shipped zero new tests for equivalent visual/CSS changes).

### Integration Tests:

- None — no existing Playwright e2e coverage of tile visual appearance; out of scope to add here (would be a much larger, separately-scoped change to add appearance assertions to `e2e/smoke.spec.ts`).

### Manual Testing Steps:

1. Start a new game with any player/pair-count setup.
2. Confirm every tile shows the cauldron back image before any tile is flipped.
3. Flip a tile face-up (confirms face-up rendering is unaffected) and flip a second, mismatched tile — confirm both revert to the cauldron back image on mismatch.
4. Resize the browser window / check on a smaller viewport — confirm the tile grid's existing horizontal scroll (`.grid`'s `overflow-x: auto`) still works and no tile's back image overflows its 150×150 box.

## Performance Considerations

The resized asset (~300px JPEG, quality 75) is a small (likely tens of KB), independently cacheable static file — served as a separate network request, not inlined into the already-oversized `GameApp` JS bundle. No further optimization needed for a single fixed decorative image.

## Migration Notes

Not applicable — no persisted data changes. `assets/cauldron-source.jpg` is a repo-only build-time asset relocation; no effect on existing users' `localStorage` data (herb-card deck, scores).

## References

- Research: `context/changes/cauldron-tile-back/research.md`
- Prior precedent (CSS Module pattern, 150×150 footprint): `context/changes/unified-tile-size/plan.md`
- Prior precedent (two-phase asset-prep + component-wiring split): `context/changes/multi-row-tile-grid/plan.md`
- Face-down ternary: `src/components/GameBoard.tsx:72-79`
- Tile CSS classes: `src/components/GameBoard.module.css:1-37`
- Seed-script collision hazard source: `scripts/generate-herb-seed-data.mjs:20-22`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Asset preparation

#### Automated

- [x] 1.1 `assets/herb-seed-sources/` no longer contains `cauldron.jpg` — 97037fb
- [x] 1.2 `src/assets/cauldron.jpg` exists — 97037fb
- [x] 1.3 Generated file confirmed 300px wide — 97037fb

#### Manual

- [x] 1.4 `src/assets/cauldron.jpg` opens as a recognizable, non-corrupted image — 97037fb

### Phase 2: Component integration

#### Automated

- [x] 2.1 Type check passes (`npx astro check`)
- [x] 2.2 Build succeeds (`npm run build`)

#### Manual

- [x] 2.3 Every face-down tile shows the cauldron image filling the tile, no `"?"` or empty space
- [x] 2.4 Flipping a tile face-up then back to face-down (mismatch) shows the cauldron image correctly
- [x] 2.5 Cauldron/flame subject stays framed after the `cover` crop
- [x] 2.6 No layout shift or overflow beyond the 150×150 tile boundary
