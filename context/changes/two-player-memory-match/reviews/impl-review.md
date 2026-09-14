<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Two-Player Memory Match Implementation Plan

- **Plan**: context/changes/two-player-memory-match/plan.md
- **Scope**: Phase 4 of 4 (full plan — all phases complete)
- **Date**: 2026-09-14
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical 3 warnings 0 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

## Findings

### F1 — Game-result persistence runs inside a useState lazy initializer

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/components/GameEndScreen.tsx:17-28
- **Detail**: `appendGameResult` (called twice, once per player) runs inside the function passed to `useState` — a lazy initializer, not a `useEffect`. React's contract expects initializers to be pure; it may call one more than once without committing under concurrent rendering, independent of StrictMode. Not reachable today (StrictMode is off everywhere in this app, confirmed by grep; `PlayGame.tsx` never remounts `GameEndScreen`), but it's the wrong primitive — `GameBoard.tsx` itself correctly fires its one-shot `onFinished` from a `useEffect` (lines 35-42), not a state initializer. If StrictMode is ever enabled, or a future "play again" shortcut adds a `key`/remount here, every game's result would be double-appended — silently inflating `pairsCollected` totals and `getPlayerHistory`'s play counts, with nothing to catch it.
- **Fix**: Move the `appendGameResult` calls into a `useEffect(() => {...}, [])` with a `useRef` guard (`hasAppendedRef`) so a future double-invocation path is a no-op — mirroring the re-entrancy-guard convention `CardForm.tsx`'s `handleApprove` already established after a prior review (`context/changes/herb-card-authoring/reviews/impl-review.md` F1).
  - Strength: Matches an existing, already-reviewed convention in this codebase; removes the risk class entirely rather than relying on "StrictMode happens to be off."
  - Tradeoff: One extra render (history renders as empty/loading for a frame before the effect commits) unless the initial state is computed some other way — minor, contained to one file.
  - Confidence: HIGH — direct precedent in this exact codebase.
  - Blind spot: None significant.
- **Decision**: FIXED — moved appendGameResult/getPlayerHistory into a useEffect(() => {...}, []) guarded by a useRef (hasRecordedRef), matching CardForm.tsx's re-entrancy-guard convention (src/components/GameEndScreen.tsx).

### F2 — samePlayerName duplicated independently in two modules

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Pattern Consistency
- **Location**: src/lib/game.ts:17-19 and src/lib/storage/index.ts:42-44
- **Detail**: Both files independently define an identical, non-exported `samePlayerName(a, b) { return a.trim().toLowerCase() === b.trim().toLowerCase(); }`. `game.ts`'s copy (via `resolvePlayerNames`) decides whether two setup-time names get suffixed into distinct identities; `storage/index.ts`'s copy (via `getPlayerHistory`/`appendGameResult`) decides whether two name strings resolve to the same stored `PlayerRecord`. The plan text itself says `game.ts`'s version should match "`index.ts`'s existing `samePlayerName` convention" — but the code duplicates the rule instead of sharing it. If either copy is edited later (e.g. Unicode normalization, locale-aware casing) without updating the other, the two decisions can disagree — silently reintroducing the exact "player-identity collision" bug this plan says it resolves.
- **Fix**: Extract `samePlayerName` into one shared module (e.g. export it from `src/lib/storage/types.ts`, or a small new `src/lib/identity.ts`) and import it from both `game.ts` and `storage/index.ts`.
  - Strength: Single source of truth for the identity rule; the two call sites can never drift apart again.
  - Tradeoff: A small new shared module/export — one more file to know about, for a two-line function.
  - Confidence: HIGH — no behavior change, purely a dedup.
  - Blind spot: None significant.
- **Decision**: FIXED — extracted samePlayerName into src/lib/identity.ts, imported from both src/lib/game.ts and src/lib/storage/index.ts; local duplicate definitions removed.

### F3 — CardManager.tsx changes aren't reflected in plan.md

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/components/CardManager.tsx
- **Detail**: Two `CardManager.tsx` tweaks (a "Deck cards: N" count display; removal of the `sourceLabel` "— Wikipedia" suffix from the card list) landed in the Phase 2 commit but were never part of `plan.md`'s "Changes Required." These were explicit user requests made mid-session (not autonomous scope creep), and the commit message already discloses them honestly — but `plan.md` itself is now silently out of sync with what shipped. Risk is low: both changes are presentational-only, touch no state/props/contracts, and nothing else in the plan depends on `sourceLabel` or the count display.
- **Fix**: Add a short "Addenda" note to `plan.md` documenting these two user-requested `CardManager.tsx` tweaks, so the plan stays an accurate record of what shipped.
- **Decision**: FIXED — added an "Addenda" section to plan.md documenting both tweaks and pointing back to this finding.

## Additional notes (not findings)

- Coin-flip animation (`GameSetup.tsx:58-71`): plan text implies `flipCoin()` is called first and the animation is driven toward that known result; actual code animates blind for 800ms and computes the result only at the end, then calls `onStart` in the same tick (no rendered "landed" frame before transitioning away). Outcome is visually indistinguishable and functionally correct — non-blocking, optional feature per the plan.
- Timer/interval cleanup (`GameBoard.tsx`'s 1.2s mismatch reveal, `GameSetup.tsx`'s coin-flip interval/timeout) confirmed correctly cleaned up on unmount, with functional `setState` avoiding stale closures, and `resolveMismatch` independently guarding against a stray late fire.
- No XSS/injection surface (no `dangerouslySetInnerHTML` anywhere; all images are local base64 data URLs or plain JSX text).
- `GameSetup.tsx`'s step machine uses a bare `Step` string plus several independent `useState` fields rather than `CardForm.tsx`'s tagged-union `FormState` — a minor convention divergence, not a defect (no invalid-state path exists).
- No mid-game "back to menu" escape (only available from `GameEndScreen`) — consistent with the plan's stated scope; flagged only as a UX note in case it wasn't deliberate.
- Success criteria re-verified fresh: `npm run test` (27/27), `npx tsc --noEmit`, `npm run build` all pass; all Manual Progress checkboxes across all 4 phases have observable evidence in the diff.
