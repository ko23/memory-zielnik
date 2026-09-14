# Multi-Row Tile Grid Implementation Plan

## Overview

Arrange `GameBoard.tsx`'s tiles into a CSS Grid of 3 or 4 rows — 3 if the tile count divides evenly by 3, otherwise 4 — instead of the current single flowing row. This is `T3` of a 5-feature sequencing analysis, built on `T1`'s fixed-size tile foundation.

## Current State Analysis

`GameBoard.tsx`'s tile container (`GameBoard.tsx:56`) is a bare `<div>` with no layout CSS — tiles render in document order with default block flow. `GameBoard.module.css` (from `T1`, already implemented) defines a fixed 100×100px `.tile` class and its face-up/matched variants, but nothing about arrangement. Total tile count is always `2 × pairCount`, where `pairCount` is user-chosen 10–24 (FR-005) with no constraint to multiples of 3 or 4 — so a fixed 3-or-4 row rule will not always divide evenly into a clean rectangle.

## Desired End State

Every game board renders its tiles in exactly 3 rows (when tile count is divisible by 3) or 4 rows (otherwise), with 8px gaps between tiles, a ragged left-aligned last row when the division isn't exact, and horizontal scrolling on the tile-grid container if the board is wider than the viewport. Verification: `npm run test` passes (existing suite + new grid-math tests); `npx tsc --noEmit` and `npm run build` pass; a game is manually played at pair counts 10, 12, 17, and 24, confirming correct row count, column count, raggedness, and (at 24) horizontal scroll.

### Key Discoveries:

- The originally-flagged ambiguity — whether "number of tiles" means pair count or total tile count — turns out not to matter: since total tiles = 2 × pairCount and 2 is coprime with 3, "pairCount divisible by 3" and "total tiles divisible by 3" always agree. No decision needed there.
- The real design question was the uneven-division case: with `columns = Math.ceil(totalTiles / rows)`, CSS Grid's default row-major auto-placement naturally leaves any deficit cells in the last row — exactly the "ragged, left-aligned" behavior chosen, with zero extra CSS beyond the grid's own `grid-template-columns`.
- Verified test-case math: 10 pairs → 20 tiles → 4 rows × 5 cols (clean); 12 pairs → 24 tiles → 3 rows × 8 cols (clean); 17 pairs → 34 tiles → 4 rows × 9 cols (ragged last row, 7 of 9 filled); 24 pairs → 48 tiles → 3 rows × 16 cols (clean, but ~1720px wide including gaps — the horizontal-scroll case).

## What We're NOT Doing

- No change to the tile back design (`T2`, planned separately) — face-down tiles still render the plain `"?"` placeholder from `T1`.
- No responsive/adaptive tile shrinking to fit the viewport — wide boards scroll horizontally instead, keeping `T1`'s fixed 100×100px tile size unchanged.
- No change to `src/lib/game.ts`'s gameplay state machine (`selectTile`, `resolveMismatch`, etc.) — only a new, additive pure function for grid dimensions.
- No vertical scroll handling or page-level layout changes — scoped entirely to the tile-grid container.

## Implementation Approach

A new pure function `getGridDimensions(tileCount)` in `src/lib/game.ts` computes `{ rows, columns }` from the 3-or-4 rule, fully unit-tested. `GameBoard.module.css` gains a `.grid` class (`display: grid`, 8px `gap`, `overflow-x: auto`) applied to the tile container in `GameBoard.tsx`, with the computed `columns` value set as an inline `gridTemplateColumns` style (since it varies per game and can't be a static CSS class).

## Phase 1: Grid dimension math

### Overview

A pure, tested function computing row/column counts from tile count — no UI changes yet.

### Changes Required:

#### 1. Grid dimension function

**File**: `src/lib/game.ts`

**Intent**: Compute the row and column counts for the tile grid from the total tile count, so `GameBoard.tsx` never has to re-derive this arithmetic inline.

**Contract**:
```ts
export interface GridDimensions {
  rows: number;
  columns: number;
}

export function getGridDimensions(tileCount: number): GridDimensions;
```
Returns `rows: 3` when `tileCount % 3 === 0`, otherwise `rows: 4`; `columns: Math.ceil(tileCount / rows)`.

#### 2. Grid dimension tests

**File**: `src/lib/game.test.ts`

**Intent**: Cover both the row-count branch and the clean/ragged column-count cases.

**Contract**: Tests for `getGridDimensions` at tile counts 20 (10 pairs → 4×5, clean), 24 (12 pairs → 3×8, clean), 34 (17 pairs → 4×9, ragged: `4×9=36` vs. 34 tiles, 2-cell deficit in the last row), and 48 (24 pairs → 3×16, clean, widest case).

### Success Criteria:

#### Automated Verification:

- Tests pass: `npm run test`
- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`

#### Manual Verification:

- None — this phase's behavior is fully covered by automated tests; no UI changes yet.

---

## Phase 2: Wire the grid into GameBoard

### Overview

Apply the computed grid dimensions to the tile container's CSS.

### Changes Required:

#### 1. Grid container styling

**File**: `src/components/GameBoard.module.css`

**Intent**: Define the grid container's shared layout rules — everything except the per-game column count, which varies.

**Contract**: A `.grid` class with `display: grid`, `gap: 8px`, and `overflow-x: auto` (the horizontal-scroll container for wide boards). `grid-template-columns` is intentionally not set here — it's computed per-game and applied as an inline style in `GameBoard.tsx`.

#### 2. Apply computed columns to the tile container

**File**: `src/components/GameBoard.tsx`

**Intent**: Wrap the existing tile-mapping JSX in the new `.grid` container, with column count computed once per game from the current tile count.

**Contract**: Call `getGridDimensions(state.tiles.length)` (memoized once per game, since tile count is fixed for the game's duration) and apply `style={{ gridTemplateColumns: \`repeat(${columns}, 100px)\` }}` alongside `className={styles.grid}` on the container `<div>` that wraps the tile `.map()`. No changes to individual tile rendering (still `.tile`/`.tileMatched`/`.tileImage`/`.tileName` from `T1`).

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`
- Full test suite still passes: `npm run test`

#### Manual Verification:

- At 10 pairs: board renders as a clean 4-row × 5-column grid
- At 12 pairs: board renders as a clean 3-row × 8-column grid
- At 17 pairs: board renders as a 4-row × 9-column grid with a ragged, left-aligned last row (7 of 9 filled)
- At 24 pairs: board renders as a 3-row × 16-column grid, and the container scrolls horizontally rather than overflowing the page
- Tiles keep their 8px gap and unified size in every state (face-down, face-up, matched)
- No regression: tile clicks, match/mismatch/turn-passing, and game completion still work exactly as before

---

## Testing Strategy

### Unit Tests:

- `game.test.ts`: `getGridDimensions` at 20, 24, 34, and 48 tiles, covering both row-count branches and both clean/ragged column cases.

### Integration Tests:

- None — consistent with this project's established convention of not unit-testing React components; `GameBoard.tsx`'s CSS wiring is covered by manual verification instead.

### Manual Testing Steps:

1. Start a game with 10 pairs; confirm a clean 4×5 grid.
2. Start a game with 12 pairs; confirm a clean 3×8 grid.
3. Start a game with 17 pairs; confirm a 4×9 grid with a ragged last row.
4. Start a game with 24 pairs; confirm a 3×16 grid and that the board scrolls horizontally rather than breaking page layout.
5. Confirm the 8px gap and each tile's unified size (from `T1`) are unchanged in every state.
6. Play a full game to completion at any pair count to confirm no regression in match/mismatch/turn/end flow.

## Performance Considerations

None beyond what already exists — `getGridDimensions` is a single O(1) computation called once per game (or memoized), and the CSS Grid layout itself is native browser layout with no JS-driven positioning.

## Migration Notes

Not applicable — no data model or storage changes.

## References

- Prior work: `context/changes/unified-tile-size/plan.md` (`T1` — the fixed-size `.tile` class this plan's grid arranges)
- Related, not yet planned: `T2` (cauldron tile back) — independent of this change.
- PRD refs: FR-005 (tile-pair count 10–24, the source of the tile-count range this plan's grid math must handle)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Grid dimension math

#### Automated

- [x] 1.1 Tests pass
- [x] 1.2 Type checking passes
- [x] 1.3 Build still succeeds

### Phase 2: Wire the grid into GameBoard

#### Automated

- [ ] 2.1 Type checking passes
- [ ] 2.2 Build still succeeds
- [ ] 2.3 Full test suite passes

#### Manual

- [ ] 2.4 10 pairs renders a clean 4x5 grid
- [ ] 2.5 12 pairs renders a clean 3x8 grid
- [ ] 2.6 17 pairs renders a 4x9 grid with a ragged last row
- [ ] 2.7 24 pairs renders a 3x16 grid with horizontal scroll, no page overflow
- [ ] 2.8 Gap and unified tile size unchanged in every state
- [ ] 2.9 No regression in match/mismatch/turn-passing/game completion
