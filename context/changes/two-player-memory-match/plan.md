# Two-Player Memory Match Implementation Plan

## Overview

Build `S-02` — the roadmap's north star: player setup (names, tile-pair count, who-goes-first), the memory-matching board itself (flip, match/mismatch, turn-passing, live scores), and the end screen (winner/tie, score, a past-results line). This is the flow that actually tests the PRD's core hypothesis — that repeated recall under uncertainty is what makes herb names and appearances stick.

## Current State Analysis

`src/lib/storage/types.ts`'s `GameResult` (`playedAt`, `pairsCollected`, `tileCount`, `outcome`) and `index.ts`'s `getPlayerHistory`/`appendGameResult` already exist from `F-01`, fully tested, but unused anywhere in the UI — this slice is their first real consumer. `Menu.tsx`'s "Play Game" button is currently hardcoded `disabled`. `GameApp.tsx`'s `Screen` type is `"menu" | "cards"`. There is no game-engine code anywhere in the repo.

## Desired End State

From the menu, "Play Game" (enabled whenever the deck has ≥10 cards) leads through: entering both player names (auto-suffixed to distinguish identical names), choosing a tile-pair count (10–24, capped at deck size), and choosing who goes first — then a full memory-matching board (flip two tiles per turn, match keeps the turn, mismatch passes it after a brief reveal, live running scores) — then an end screen showing the winner (or tie), final scores, a one-line "you've played N times, best score M" per player, and a way back to the menu. Verification: `npm run test` passes (existing suite + new game-engine tests); `npm run build` succeeds; a full game is manually played to completion, including a tie and a rematch with duplicate names.

### Key Discoveries:

- `appendGameResult`/`getPlayerHistory` already exist and are already tested (`src/lib/storage/index.ts`, `seed.test.ts` doesn't touch them but `F-01`'s original test suite does indirectly via `index.ts`'s exports) — this slice only needs to *call* them, not build them.
- PRD's own Socratic note on FR-011 explicitly rejects auto-random turn assignment ("letting players 'choose' who goes first... kept as written; no counter-argument accepted") — the required mechanic is an actual choice between the two named players; a coin-flip is only being added as an optional alternative alongside it, not a replacement.
- The roadmap's previously-Parked "player-identity collision" item (same name, different people sharing one score record) is resolved by this plan, not deferred further: when both players submit identical names, the actual identity strings used everywhere downstream (display, `appendGameResult`, `getPlayerHistory`) become the suffixed forms (`"Alex (1)"`, `"Alex (2)"`), not just a display label over a shared record.

## What We're NOT Doing

- No "Play again with same players" shortcut — end screen offers only "Back to menu", per this session's decision. Replaying re-enters setup from scratch.
- No stats view beyond a single one-line summary on the end screen — no dedicated history/stats screen, no per-game history list.
- No adaptive difficulty or per-card mismatch tracking — deck subsetting is uniformly random each game, consistent with the PRD's explicit no-adaptive-difficulty note.
- No offline/service-worker concerns — none apply here beyond what's already true of the whole app.
- No changes to `F-01`'s `GameResult`/`PlayerRecord` types or to `getPlayerHistory`/`appendGameResult`'s contracts — this slice only calls them.
- The coin-flip "who goes first" alternative is a lower-priority, explicitly optional addition (see Phase 2) — it does not gate Phase 2's completion if skipped under time pressure.

## Implementation Approach

A pure, fully-tested game-engine module (`src/lib/game.ts`) owns all state transitions (shuffling, tile selection, match/mismatch resolution, turn-passing, win/tie detection, same-name suffixing, random deck subsetting) as plain functions over a `GameState` object — no React, no DOM. Three new screen components (`GameSetup`, `GameBoard`, `GameEndScreen`) are thin UI wrappers driven by that engine, orchestrated by a new `PlayGame` component that `GameApp.tsx` mounts for a new `"play"` screen.

## Critical Implementation Details

- **Input lock during mismatch reveal**: `selectTile` must be a no-op whenever `GameState.phase !== "selecting"` — this is what prevents a fast player from clicking through the ~1.2s mismatch-reveal window before tiles flip back. The board component's `setTimeout` that triggers `resolveMismatch` must be the *only* path out of the `"revealing-mismatch"` phase.
- **Suffix resolution happens once, at setup submission** — `resolvePlayerNames(name1, name2)` runs exactly once when the setup form is submitted, and its output (not the raw typed names) is what flows into every later step: the board's turn/score display, and both `appendGameResult` calls at game end. There is no later point where the raw un-suffixed names are used again.
- **Random subset is non-deterministic by design** — tests for `pickRandomSubset`/tile-shuffling assert invariants (correct count, each included card's tiles appear exactly twice, no duplicates beyond that) rather than exact output, since the function deliberately uses `Math.random()`.

## Phase 1: Pure game engine + tests

### Overview

All game logic as plain, tested functions — no UI yet.

### Changes Required:

#### 1. Game engine module

**File**: `src/lib/game.ts`

**Intent**: Own every state transition for a memory-match game as pure functions over a plain data object, so the north star's core logic is fully unit-testable.

**Contract**:
```ts
export interface Tile {
  cardId: string;
  matched: boolean;
}

export type GamePhase = "selecting" | "revealing-mismatch" | "finished";

export interface GameState {
  tiles: Tile[];
  selected: number[]; // 0, 1, or 2 tile indices currently face-up this turn
  players: [string, string];
  scores: [number, number]; // pairs collected, indexed by player
  currentPlayer: 0 | 1;
  phase: GamePhase;
}

export function resolvePlayerNames(name1: string, name2: string): [string, string];
export function pickRandomSubset<T>(items: T[], count: number): T[];
export function createGameState(cardIds: string[], players: [string, string], startingPlayer: 0 | 1): GameState;
export function selectTile(state: GameState, tileIndex: number): GameState;
export function resolveMismatch(state: GameState): GameState;
export function getWinner(state: GameState): 0 | 1 | "tie" | null; // null while phase !== "finished"
export function flipCoin(): 0 | 1;
```
`resolvePlayerNames` trims both names and compares case-insensitively (matching `index.ts`'s existing `samePlayerName` convention); on a match, returns `[name1 + " (1)", name2 + " (2)"]`, otherwise returns the trimmed originals unchanged. `createGameState` duplicates each card id into two tiles and shuffles tile order (Fisher-Yates). `selectTile` is a no-op (returns `state` unchanged) whenever `phase !== "selecting"`, when the tile is already matched, or already selected; on a 2nd selection it immediately resolves a match (credits the current player, clears selection, phase stays `"selecting"`) or sets `phase: "revealing-mismatch"` for a mismatch (tiles stay visible, selection *not* cleared yet). `resolveMismatch` (called by the caller after the UI's timeout) clears the selection, switches `currentPlayer`, and returns to `"selecting"`; it also transitions to `"finished"` if all tiles are now matched (this same finishing check also runs inside `selectTile`'s match branch). `getWinner` compares `scores`. `flipCoin` returns `0` or `1` with equal probability (`Math.random() < 0.5 ? 0 : 1`) — the pure random pick behind the setup screen's optional "flip a coin" button; it takes no state and produces no side effects, so the UI owns the reveal animation entirely.

#### 2. Game engine tests

**File**: `src/lib/game.test.ts`

**Intent**: Cover the state machine's real branches — this is the north star's core logic.

**Contract**: Tests for: `resolvePlayerNames` (identical names get suffixed, distinct names pass through, case/whitespace variants still collide); `pickRandomSubset`/`createGameState` invariants (correct tile count = 2× requested cards, each card appears exactly twice, no `selectTile` before shuffle); `selectTile` match path (credits the right player, keeps their turn, doesn't advance `currentPlayer`); `selectTile` mismatch path (`phase` becomes `"revealing-mismatch"`, selection retained, no player-switch yet); `resolveMismatch` (clears selection, switches player, returns to `"selecting"`); input-lock (`selectTile` during `"revealing-mismatch"` is a no-op); win/tie detection via `getWinner` after a full game's worth of matches (both a decisive win and a tie scenario); `flipCoin` (over many runs, both `0` and `1` occur — no fixed bias, no third value).

### Success Criteria:

#### Automated Verification:

- Tests pass: `npm run test`
- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`

#### Manual Verification:

- None — this phase's behavior is fully covered by automated tests; there's no UI yet.

---

## Phase 2: Setup screen

### Overview

Names (with auto-suffix), tile-pair count, who-goes-first — and the deck-size guard on the menu.

### Changes Required:

#### 1. Deck-size guard on the menu

**File**: `src/components/Menu.tsx`

**Intent**: "Play Game" is enabled once the deck has enough cards to play, per this session's decision.

**Contract**: `Menu` reads `listCards().length` (from `src/lib/storage`); "Play Game" is `disabled` (as today) only when that count is below 10, with a hint (e.g. a `title` attribute) explaining why. Once enabled, clicking it invokes a new `onPlayGame` prop (mirroring `onCreateCards`).

#### 2. Setup screen component

**File**: `src/components/GameSetup.tsx`

**Intent**: Collect both names, the tile-pair count, and who goes first, then hand off a ready-to-start configuration.

**Contract**: A name step (two required text inputs; on submit, calls `resolvePlayerNames` from `src/lib/game` and displays the *resolved* names from that point forward — so a collision's suffixes are visible immediately, not silently applied). A count step (bounded input/selector, min 10, max `Math.min(24, deckSize)`). A who-goes-first step: two buttons naming each resolved player (required path) call `onStart` directly with their pick as `startingPlayer`; alongside them, a "Flip a coin instead" button calls `flipCoin` from `src/lib/game`, holds the result in local state, drives a brief (~800ms) CSS-animated reveal (e.g. an alternating-name or spin transform) ending on the resolved player's name, then calls `onStart` with that result as `startingPlayer` once the animation completes. This button and its animation are a nice-to-have addition — the pure `flipCoin` function is trivial to wire in, but the reveal animation itself is not required for this phase's completion (see "What We're NOT Doing"); the two required buttons alone are sufficient to satisfy FR-011. On completing all three steps, calls an `onStart` prop with `{ players: [string, string], pairCount: number, startingPlayer: 0 | 1 }`.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`

#### Manual Verification:

- With a deck under 10 cards, "Play Game" is disabled with a visible hint; at 10+ cards, it's enabled
- Entering two distinct names, a valid count, and picking who goes first reaches the board (verified fully in Phase 3-4, but confirm the setup steps themselves flow correctly here)
- Entering the same name for both players shows the suffixed forms (e.g. "Alex (1)"/"Alex (2)") from the who-goes-first step onward

---

## Phase 3: Game board

### Overview

The actual play surface: tiles, live scores, turn indicator, flip/match/mismatch.

### Changes Required:

#### 1. Board component

**File**: `src/components/GameBoard.tsx`

**Intent**: Render the tile grid and drive `game.ts`'s state machine from clicks and a timer.

**Contract**: Holds a `GameState` (from `createGameState`, seeded with a `pickRandomSubset` of the current deck's card ids at the chosen count). Renders each tile face-down/face-up/matched based on `state.tiles`/`state.selected`; clicking a tile calls `selectTile` and replaces state. Both players' current `scores` are visible continuously (per this session's decision), with the current player indicated. When `selectTile` produces `phase: "revealing-mismatch"`, a `setTimeout` (~1.2s, per this session's decision) calls `resolveMismatch` and replaces state again; the timeout is cleared on unmount. When the resulting state's `phase` becomes `"finished"`, calls an `onFinished` prop with the final `GameState`.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`

#### Manual Verification:

- A tile flip responds instantly (no artificial delay), matching the PRD's 100ms NFR
- Matching two tiles keeps the same player's turn and updates their visible score immediately
- Mismatching two tiles keeps both face-up for a beat, blocks further clicks during that window, then flips back and passes the turn
- Playing until every pair is collected transitions to the end screen

---

## Phase 4: End screen + wiring

### Overview

Winner/tie announcement, score persistence, a past-results line, and the full menu → setup → board → end → menu loop.

### Changes Required:

#### 1. End screen component

**File**: `src/components/GameEndScreen.tsx`

**Intent**: Announce the outcome, persist both players' results, and surface a one-line history summary per player.

**Contract**: On mount, calls `appendGameResult` once per player (`outcome` derived from `getWinner`: `"win"`/`"loss"`/`"tie"`; `pairsCollected` from `state.scores`; `tileCount` from `state.tiles.length`), then calls `getPlayerHistory` per player to render "You've played `N` times — best score `M` pairs" (per this session's decision), alongside the winner/tie announcement and final scores. A single "Back to menu" action.

#### 2. Wire the whole flow

**File**: `src/components/GameApp.tsx`, new `src/components/PlayGame.tsx`

**Intent**: A new `"play"` screen hosting the setup → board → end sequence, matching `CardManager`'s established internal-screen-state pattern.

**Contract**: `GameApp`'s `Screen` type gains `"play"`; `Menu`'s new `onPlayGame` prop sets it. `PlayGame.tsx` holds its own phase (`"setup" | "board" | "end"`), rendering `GameSetup` → `GameBoard` → `GameEndScreen` in turn, with a `back to menu` callback threaded down to return `GameApp` to `"menu"`.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`
- Full test suite still passes: `npm run test`

#### Manual Verification:

- Play a full game to a decisive win; confirm the end screen shows the correct winner, score, and a past-results line
- Play a second full game ending in a tie; confirm the tie is announced correctly (not a false winner)
- Play a game with both players entering the same name; confirm the suffixed identities are used consistently through setup, board, and the end screen's two separate past-results lines
- "Back to menu" returns to the main menu; re-entering "Create Cards" and "Play Game" both still work correctly afterward

---

## Testing Strategy

### Unit Tests:

- `game.test.ts`: `resolvePlayerNames` suffixing, `pickRandomSubset`/`createGameState` invariants, `selectTile` match/mismatch/input-lock branches, `resolveMismatch`, win/tie detection via `getWinner`

### Integration Tests:

- None — per this project's established "pure-logic tests only" pattern (no component/DOM-rendering tests), consistent with `herb-card-authoring`.

### Manual Testing Steps:

1. With a deck under 10 cards, confirm "Play Game" is disabled with a hint; add cards back up to 10+, confirm it enables.
2. Full setup: two distinct names, a valid pair count, choose who goes first — then repeat via the optional "Flip a coin instead" button and confirm the animation ends on the picked player and starts the game correctly.
3. Full board: verify match keeps the turn and updates score live; verify mismatch reveals both tiles briefly, blocks clicks, then flips back and passes the turn.
4. Play to a decisive win, then a separate game to a tie; confirm both end-screen outcomes are correct.
5. Play a game with identical names for both players; confirm suffixed identities are used consistently everywhere and both get separate past-results lines.
6. "Back to menu" and re-entering both Create Cards and Play Game afterward.

## Performance Considerations

Tile flips must be instant (no async work in the hot path) to meet the PRD's 100ms NFR; only the intentional mismatch-reveal pause (~1.2s) introduces a deliberate delay, and it's bounded and cleared on unmount.

## Migration Notes

Not applicable — no existing data shape changes; this only adds new `GameResult` entries via the already-existing `appendGameResult`.

## References

- Prior work: `context/changes/local-persistence-scaffold/plan.md` (`F-01` — `GameResult`/`appendGameResult`/`getPlayerHistory`, already built and tested, first used here)
- Prior work: `context/changes/herb-card-authoring/plan.md` (`S-01` — the menu/screen-state pattern this change extends)
- PRD refs: US-01 (the whole flow), FR-004–FR-012 (setup through end screen)
- Resolves: the roadmap's previously-Parked "player-identity collision" item (same-name suffixing, this session's decision)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Pure game engine + tests

#### Automated

- [x] 1.1 Tests pass — 4d0e1ed
- [x] 1.2 Type checking passes — 4d0e1ed
- [x] 1.3 Build still succeeds — 4d0e1ed

### Phase 2: Setup screen

#### Automated

- [x] 2.1 Type checking passes — 86c50d3
- [x] 2.2 Build still succeeds — 86c50d3

#### Manual

- [x] 2.3 Play Game disabled under 10 cards, enabled at 10+ — 86c50d3
- [x] 2.4 Setup steps (names, count, who-goes-first) flow correctly — 86c50d3
- [x] 2.5 Same-name entry shows suffixed identities from who-goes-first onward — 86c50d3
- [x] 2.6 (optional, non-blocking) Coin-flip button animates and starts the game with its picked player — 86c50d3

### Phase 3: Game board

#### Automated

- [x] 3.1 Type checking passes — de8f527
- [x] 3.2 Build still succeeds — de8f527

#### Manual

- [x] 3.3 Tile flip is instant, no artificial delay — de8f527
- [x] 3.4 Match keeps turn and updates live score — de8f527
- [x] 3.5 Mismatch reveals briefly, blocks input, then flips back and passes turn — de8f527
- [x] 3.6 Full board completion transitions to end screen — de8f527

### Phase 4: End screen + wiring

#### Automated

- [x] 4.1 Type checking passes — e82fa9b
- [x] 4.2 Build still succeeds — e82fa9b
- [x] 4.3 Full test suite passes — e82fa9b

#### Manual

- [x] 4.4 Decisive win shows correct winner, score, past-results line — e82fa9b
- [x] 4.5 Tie game announced correctly — e82fa9b
- [x] 4.6 Same-name game keeps identities consistent with two separate past-results lines — e82fa9b
- [x] 4.7 Back to menu, then Create Cards and Play Game both still work — e82fa9b
