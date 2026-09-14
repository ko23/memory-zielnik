# Multi-Row Tile Grid — Plan Brief

> Full plan: `context/changes/multi-row-tile-grid/plan.md`

## What & Why

`T3` of a 5-feature sequencing analysis: arrange `GameBoard.tsx`'s tiles into 3 rows (if tile count divides evenly by 3) or 4 rows otherwise, instead of one long flowing row. Builds directly on `T1`'s fixed-size tiles.

## Starting Point

`GameBoard.tsx`'s tile container is a bare `<div>` with no layout CSS — tiles flow in document order. `T1` already gave every tile a fixed 100×100px footprint (`GameBoard.module.css`), but nothing about how tiles are *arranged*. Pair count is user-chosen 10–24 with no constraint to multiples of 3 or 4, so a fixed row rule won't always divide evenly.

## Desired End State

Every board renders in exactly 3 or 4 rows per the rule, with an 8px gap between tiles, a ragged left-aligned last row when the tile count doesn't divide evenly, and horizontal scrolling for wide boards at high pair counts (up to ~1720px at 24 pairs).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
|---|---|---|
| Ambiguity: "number of tiles" = pairs or total? | Resolved by math — doesn't matter | 2 is coprime with 3, so pairCount-divisible-by-3 and total-tiles-divisible-by-3 always agree |
| Layout mechanism | CSS Grid | Native explicit row/column control, no manual row-splitting logic in JSX |
| Grid math location | Pure `getGridDimensions()` in `game.ts`, unit-tested | Matches this project's convention — logic tested, components stay thin |
| Uneven last row | Ragged, left-aligned | CSS Grid's default behavior for free — zero extra CSS |
| Tile spacing | 8px gap | More readable/kid-friendly than edge-to-edge |
| Wide-board handling | Horizontal scroll container, must-have | One CSS property; a real edge case at any pair count ≥ ~18 divisible by 3 |
| Manual test scope | 10, 12, 17, 24 pairs | Minimal set hitting every distinct code path (both row counts, clean + ragged, widest/scroll case) |

## Scope

**In scope:** `src/lib/game.ts` (+ tests) for grid math; `GameBoard.module.css` + `GameBoard.tsx` for CSS Grid wiring.

**Out of scope:** the tile back design (`T2`), responsive tile shrinking (scroll instead), any change to `game.ts`'s gameplay state machine, page-level layout.

## Architecture / Approach

`getGridDimensions(tileCount)` (pure, tested) returns `{ rows, columns }`. `GameBoard.module.css` gains a `.grid` class (`display: grid`, 8px gap, `overflow-x: auto`); `GameBoard.tsx` applies it to the tile container with `gridTemplateColumns` set inline per-game (since column count varies with tile count).

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Grid dimension math | Tested `getGridDimensions()` covering clean + ragged cases | None significant — pure arithmetic, fully deterministic |
| 2. Wire the grid into GameBoard | CSS Grid applied, scroll container for wide boards | None significant — CSS-only, no logic changes |

**Prerequisites:** `T1` (unified-tile-size), already implemented and reviewed.
**Estimated effort:** ~1 short session, 2 phases.

## Open Risks & Assumptions

- None significant — the math was fully verified against the chosen test-case pair counts (10, 12, 17, 24) during planning, and CSS Grid's native behavior handles the ragged-row case without custom logic.

## Success Criteria (Summary)

- Boards at 10, 12, 17, and 24 pairs each render the correct row/column split, with the 17-pair case showing a ragged last row and the 24-pair case scrolling horizontally instead of overflowing the page.
- No regression in existing gameplay (match/mismatch/turn-passing/game completion).
