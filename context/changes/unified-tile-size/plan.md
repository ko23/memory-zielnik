# Unified Tile Size Implementation Plan

## Overview

Give every tile rendered by `GameBoard.tsx` — face-down, face-up, and matched — a single consistent fixed footprint, regardless of a herb card's original image aspect ratio or how long its name is. This is `T1` of a 5-feature sequencing analysis; it's the foundation `T2` (cauldron tile back) and `T3` (multi-row grid) will build on next, but stands alone as a complete, verifiable improvement on its own.

## Current State Analysis

`src/components/GameBoard.tsx` renders each tile as a plain `<button>` with zero CSS applied — only the `<img>` itself gets a `width={60}` attribute (`GameBoard.tsx:69`). This means:
- Face-down tiles (a bare `"?"` text node) and face-up tiles (image + `<br/>` + name) are different sizes today.
- Face-up tiles vary in height from card to card, since herb photos aren't all the same aspect ratio and names vary in length.
- Matched tiles render identically to a normal face-up tile (`faceUp = tile.matched || state.selected.includes(index)` at `GameBoard.tsx:58`), just disabled — no distinct visual treatment.

This repo has no CSS anywhere beyond a 6-line `<style>` block in `src/layouts/Layout.astro` for `html`/`body` — no CSS Modules, no Tailwind, no CSS-in-JS dependency exists in `package.json`. This plan introduces the project's first CSS Module.

## Desired End State

Every tile in `GameBoard.tsx` — face-down, face-up, or matched — occupies the exact same fixed-size square box (100×100px), independent of image aspect ratio, name length, or state. Herb images are letterboxed (never cropped) to fit inside that square. Names wrap to multiple lines but are visually capped so they never grow the tile beyond its fixed footprint. Matched tiles keep the same footprint as everything else, shown dimmed rather than full-strength. Verification: `npx tsc --noEmit` and `npm run build` pass; a full game is played manually, confirming every tile — through all three states, across cards with very different image aspect ratios and both very short and very long herb names — renders at the identical size.

### Key Discoveries:

- `GameBoard.tsx:56-78` is the entire tile-rendering block — the only place this change touches.
- No existing CSS convention to follow (first styling work in the project) — this plan establishes a CSS Module as the pattern, which `T2`/`T3` will extend rather than re-decide.
- `src/lib/image.ts`'s `urlToResizedDataUrl` and `scripts/generate-herb-seed-data.mjs` both resize source images to a fixed *width* only, so herb card images already have varying heights — this is exactly why a CSS-level fixed box (not just image-width) is needed rather than relying on the images already being uniform.

## What We're NOT Doing

- No changes to the tile *back* design (still the plain `"?"` text) — that's `T2`, planned separately.
- No multi-row grid layout — tiles still render in whatever flow layout the parent `<div>` produces today; explicit row/column arrangement is `T3`, planned separately.
- No change to `src/lib/game.ts`'s state machine, `CardManager.tsx`'s card-list image sizing, or any other component — scoped to `GameBoard.tsx`'s tile rendering only.
- No fix to the FR-008 wording discrepancy (matched tiles staying on the board rather than being "removed") — this plan only decides how that existing behavior *looks* under unified sizing (dimmed, same footprint), not whether it should instead disappear.

## Implementation Approach

A new `src/components/GameBoard.module.css` defines the tile box (fixed 100×100px square), an inner image-fit rule (`object-fit: contain`), a name-text rule capped to 2 lines via `-webkit-line-clamp`, and a dimmed-matched modifier class. `GameBoard.tsx`'s tile-rendering JSX is updated to apply these classes; no other file changes.

## Critical Implementation Details

- **Text-wrap vs. fixed-square tension**: multi-line name wrapping (chosen over truncation) and a fixed square footprint are individually simple but pull against each other — an unbounded number of wrapped lines would grow the tile. Resolve this by capping the name-text area to a fixed max-height inside the square (2 lines via `-webkit-line-clamp: 2; overflow: hidden;`, with a `line-height`/`max-height` pair as the non-`-webkit-line-clamp` fallback), so wrapping happens but the square's total footprint never changes regardless of name length.

## Phase 1: Unified tile sizing

### Overview

Create the CSS Module and wire it into `GameBoard.tsx`'s tile rendering.

### Changes Required:

#### 1. Tile styling

**File**: `src/components/GameBoard.module.css`

**Intent**: Define the fixed tile footprint and its three visual states (face-down, face-up, matched) as reusable scoped classes.

**Contract**: A `.tile` class fixing `width`/`height` to `100px` each (plus `box-sizing: border-box`) shared by every tile regardless of state. A `.tileImage` class applying `object-fit: contain` plus `width: 100%; height: 70%` (or similar split leaving room for the name) so images letterbox rather than crop or overflow. A `.tileName` class capping name text to 2 lines with clipped overflow (`-webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;`), sized to fit the remaining space below the image. A `.tileMatched` modifier class (e.g. `opacity: 0.5`) applied alongside `.tile` when a tile is matched.

#### 2. Wire the CSS Module into the tile grid

**File**: `src/components/GameBoard.tsx`

**Intent**: Apply the new classes so every tile — face-down, face-up, matched — renders at the unified size.

**Contract**: Import the module (`import styles from "./GameBoard.module.css"`). The tile `<button>` gets `className={\`${styles.tile} ${tile.matched ? styles.tileMatched : ""}\`}`. The face-up branch's `<img>` gets `className={styles.tileImage}` (the existing `width={60}` attribute is removed in favor of the CSS-driven sizing). The name `<span>`/text gets `className={styles.tileName}`. The face-down `"?"` placeholder renders inside the same `.tile`-classed button, so it inherits the identical fixed footprint with no separate sizing rule needed.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`

#### Manual Verification:

- Face-down tiles, face-up tiles (for cards with clearly different image aspect ratios — e.g. compare a tall/narrow herb photo against a short/wide one), and matched tiles all measure the same size on screen
- A card with a very short name (e.g. "lipa") and a card with a long name (e.g. "mniszek lekarski") produce tiles of identical size — the long name wraps/clips rather than growing the tile
- Matched tiles are visibly dimmed compared to an active face-up tile, while still occupying the same footprint and staying in place in the layout
- No regression: tile clicks, match/mismatch/turn-passing, and game completion still work exactly as before

---

## Testing Strategy

### Unit Tests:

- None — this is a pure CSS/rendering change with no new business logic; consistent with this project's established convention of not unit-testing React components, and `src/lib/game.ts`'s state machine (already fully tested) is untouched by this plan.

### Integration Tests:

- None, for the same reason.

### Manual Testing Steps:

1. Start a game with a mix of herb cards whose source images have visibly different aspect ratios (tall vs. wide).
2. Confirm every face-down tile is the same size.
3. Flip tiles and confirm every face-up tile is the same size as the face-down ones, regardless of the underlying image's shape.
4. Include at least one very-short-named and one very-long-named herb card in the game; confirm both produce identically sized tiles.
5. Make a match and confirm the matched tile dims but keeps the same footprint and position.
6. Play a full game to completion to confirm no regression in the existing match/mismatch/turn/end flow.

## Performance Considerations

None beyond what already exists — this is a CSS-only change with no new computation, network requests, or re-render triggers.

## Migration Notes

Not applicable — no data model or storage changes.

## References

- Prior work: `context/changes/two-player-memory-match/plan.md` (`S-02` — built the `GameBoard.tsx` this plan modifies)
- Related, not yet planned: `T2` (cauldron tile back) and `T3` (multi-row grid) — both build on this change's fixed-size tile box, per the 5-feature sequencing analysis done in conversation.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Unified tile sizing

#### Automated

- [x] 1.1 Type checking passes
- [x] 1.2 Build still succeeds

#### Manual

- [x] 1.3 Face-down, face-up, and matched tiles all measure the same size
- [x] 1.4 Short-named and long-named cards produce identically sized tiles (text wraps/clips, doesn't grow the tile)
- [x] 1.5 Matched tiles are dimmed but same footprint, same position
- [x] 1.6 No regression in match/mismatch/turn-passing/game completion
