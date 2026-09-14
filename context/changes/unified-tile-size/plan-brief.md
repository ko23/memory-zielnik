# Unified Tile Size — Plan Brief

> Full plan: `context/changes/unified-tile-size/plan.md`

## What & Why

`T1` of a 5-feature sequencing analysis: make every memory-game tile — face-down, face-up, and matched — render at one consistent fixed size, regardless of a herb card's original image aspect ratio or name length. It's a standalone, complete improvement on its own, and the fixed footprint it establishes is what `T2` (cauldron tile back) and `T3` (multi-row grid) will build on next.

## Starting Point

`GameBoard.tsx` applies zero CSS to its tiles today — only the `<img>` gets a fixed `width={60}`. Tile size is whatever the browser computes from content, so face-down "?" tiles, face-up image+name tiles, and matched tiles are all inconsistent sizes, and face-up tiles themselves vary with each card's image aspect ratio and name length. This repo has no CSS anywhere beyond a tiny `Layout.astro` block — this plan introduces the project's first CSS Module.

## Desired End State

Every tile is a fixed 100×100px square in every state. Images letterbox (never crop) inside that square. Names wrap but are capped so they can never grow the tile. Matched tiles look dimmed but keep the exact same footprint and position as everything else.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
|---|---|---|
| CSS approach | New `GameBoard.module.css` | Real CSS, scoped, zero new dependencies — establishes the pattern `T2`/`T3` reuse |
| Tile shape | Fixed square, ~100×100px | Simplest possible uniform guarantee; clean footprint for the later grid/back-design work |
| Image fit | `object-fit: contain` (letterbox) | Never crops any part of a herb photo, even at the cost of some empty space |
| Name text | Wraps, capped to 2 lines (clipped beyond that) | Reconciles "let text wrap" with "tile size never grows" — wraps, but can't grow the box |
| Matched tiles | Same fixed size, dimmed | Keeps the whole grid visually uniform at all times, with no layout shift on a match |

## Scope

**In scope:** `GameBoard.tsx`'s tile rendering + a new `GameBoard.module.css`.

**Out of scope:** the tile back design (`T2`), multi-row grid layout (`T3`), any change to `src/lib/game.ts`'s logic, `CardManager.tsx`'s card-list image sizing, or the pre-existing FR-008 wording discrepancy (matched tiles staying on the board rather than disappearing — this plan only decides how that already-existing behavior looks, not whether to change it).

## Architecture / Approach

One new CSS Module (`GameBoard.module.css`) defines `.tile` (fixed box), `.tileImage` (`object-fit: contain`), `.tileName` (2-line clamp), and `.tileMatched` (dimmed modifier). `GameBoard.tsx` imports it and applies the classes to its existing tile-rendering JSX — no other files change.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Unified tile sizing | Fixed-size tiles in all 3 states via a new CSS Module | None significant — pure CSS, no logic changes, no new deps |

**Prerequisites:** None — builds directly on `S-02`'s already-implemented `GameBoard.tsx`.
**Estimated effort:** ~1 short session, single phase.

## Open Risks & Assumptions

- `-webkit-line-clamp` is the simplest cross-browser-enough way to cap wrapped text to N lines; if it doesn't behave as expected in the target browser, a `max-height` + `overflow: hidden` fallback achieves the same effect with slightly less clean clipping.

## Success Criteria (Summary)

- Every tile, in every state, measures identically on screen — verified visually across cards with different image shapes and very different name lengths.
- No regression in existing gameplay (match/mismatch/turn-passing/game completion).
