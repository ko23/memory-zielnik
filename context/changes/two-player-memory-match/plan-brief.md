---
change_id: two-player-memory-match
title: Two-player memory match
roadmap_id: S-02
---

# Two-player memory match — brief

## What this ships

The project's north star: the full setup → play → end loop. Two players enter names (auto-suffixed to "(1)"/"(2)" on a collision), pick a tile-pair count, choose who goes first (with an optional coin-flip alternative), then play a real memory-matching board — flip two tiles, a match keeps the turn and scores live, a mismatch reveals briefly then passes the turn — until every pair is collected. The end screen names the winner (or a tie), shows final scores, and a one-line past-results summary per player, before returning to the menu.

## Why this shape

- The PRD's Socratic note on FR-011 explicitly rejects auto-random turn assignment — the required mechanic is a real choice between the two named players. A coin-flip is added only as an optional, lower-priority alternative alongside that choice, not a replacement: a pure `flipCoin()` in `game.ts` backs a "Flip a coin instead" button with a brief reveal animation. The animation itself doesn't gate this change's completion, but the function is concrete enough to build in Phase 2 if time allows.
- Same-name collisions get a real fix, not a display trick: `resolvePlayerNames` suffixes the actual identity strings used everywhere (setup, board, `appendGameResult`, `getPlayerHistory`), which is why the roadmap's previously-Parked "player-identity collision" item is removed rather than deferred again.
- All game logic lives in a pure, dependency-free `src/lib/game.ts`, fully unit-tested — consistent with this project's established pattern of keeping business logic out of React components and testing only the pure layer.

## Phases

1. **Pure game engine + tests** — `src/lib/game.ts` (shuffle, tile state machine, match/mismatch/turn logic, win/tie detection, name-suffixing, random deck subsetting) + `game.test.ts`.
2. **Setup screen** — names (auto-suffix on collision) → tile-pair count → who-goes-first (required two-button choice; optional coin-flip alongside); `Menu.tsx`'s Play Game gains the deck-size guard.
3. **Game board** — tile grid, live per-player scores, turn indicator, flip/match/mismatch with a 1.2s locked reveal on mismatch.
4. **End screen + wiring** — winner/tie + score, `appendGameResult`, a past-results line via `getPlayerHistory`, "Back to menu"; `GameApp.tsx` wired to a new `"play"` screen.

## What we're deliberately not doing

No "play again with same players" shortcut, no dedicated stats/history screen, no adaptive difficulty, no changes to `F-01`'s storage contracts.

## Key risk

None significant — this slice only consumes `F-01`'s already-built and already-tested `GameResult`/`appendGameResult`/`getPlayerHistory`; the only new logic is the game state machine itself, which is fully covered by Phase 1's tests before any UI is built on top of it.

See `plan.md` for the full implementation plan with per-phase contracts and success criteria.
