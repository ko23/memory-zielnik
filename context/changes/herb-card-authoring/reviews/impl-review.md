<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Herb Card Authoring Implementation Plan

- **Plan**: context/changes/herb-card-authoring/plan.md
- **Scope**: Phase 4 of 4 (full plan — all phases complete)
- **Date**: 2026-09-14
- **Verdict**: APPROVED
- **Findings**: 0 critical 1 warnings 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1 — No re-entrancy guard on Approve (possible duplicate card)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/components/CardForm.tsx:34-52 (`handleApprove`)
- **Detail**: `handleApprove` stays on `step: "approve"` (Approve/Reject buttons still enabled) for the entire `await urlToResizedDataUrl(imageUrl)`. A double-click or a slow network + impatient user fires `handleApprove` twice concurrently — two `createCard` calls (a duplicate card) or two overlapping `updateCard` writes. Contrast with `handleSubmit`, which correctly moves to `"looking-up"` *before* awaiting, disabling the form during that window — `handleApprove` doesn't follow the same guard.
- **Fix A ⭐ Recommended**: Add a transient `"saving"` step (mirroring the existing `"looking-up"` pattern) that `handleApprove` transitions to immediately, before the `await`, disabling Approve/Reject for that window.
  - Strength: Consistent with the file's own established pattern (`handleSubmit` already does exactly this for the lookup step); no new UI primitive introduced.
  - Tradeoff: One more `FormState` variant to thread through the render logic.
  - Confidence: HIGH — directly mirrors working code three lines above it in the same file.
  - Blind spot: None significant.
- **Fix B**: Add a local `saving` boolean flag (separate from `FormState`) that disables the two buttons without a full state-machine step.
  - Strength: Smaller diff — no new `FormState` variant.
  - Tradeoff: A second, parallel piece of state to keep in sync with `step`, slightly less consistent with the existing single-state-machine design.
  - Confidence: MEDIUM — works, but diverges from the file's own established pattern.
  - Blind spot: None significant.
- **Decision**: FIXED via Fix A — added a transient `"saving"` FormState step, entered before the `urlToResizedDataUrl` await in `handleApprove`, disabling Approve/Reject during that window (src/components/CardForm.tsx).

## Observations

### O1 — CardForm remount safety is correct today but structurally fragile

- **Severity**: OBSERVATION
- **Location**: src/components/CardManager.tsx:40-44
- **Detail**: `<CardForm existingCard={editingCard ?? undefined} .../>` has no `key` prop; `CardForm`'s `useState` initializer only runs on mount, not on prop changes. Today this is safe only because `CardManager`'s branch structure (list view vs. form view are different element trees at the same position) forces an unmount/remount on every entry/exit of add or edit mode — there's no code path that swaps directly from editing card A to editing card B without passing through the list view first. A future refactor that kept `CardForm` mounted across mode switches would silently reintroduce stale-state leakage (e.g., editing card B while still showing card A's name).
- **Fix**: Add `key={editingCard?.id ?? "new"}` to `<CardForm>` as an explicit, self-documenting guard against that future refactor, rather than relying on the current branch structure alone.
- **Decision**: FIXED — added `key={editingCard?.id ?? "new"}` to `<CardForm>` in CardManager.tsx.

### O2 — No deliberate-inclusion signal for sourceLabel, per the recorded lesson

- **Severity**: OBSERVATION
- **Location**: src/components/CardForm.tsx:42,44
- **Detail**: `context/foundation/lessons.md`'s one entry (from the `unified-starter-cards` review) flags that `createCard`/`updateCard`'s now-optional `sourceLabel` needs a deliberate-omission-or-inclusion signal at each call site. Both calls here always pass a real `sourceLabel` (correct — reachable only via a successful Wikipedia lookup), but nothing marks this as intentional; a future edit could silently drop it with no compiler or test signal.
- **Fix**: Add a one-line comment at both call sites (e.g. `// sourceLabel is always populated here via lookupHerbImage`).
- **Decision**: FIXED — added the clarifying comment above the `createCard`/`updateCard` calls in `handleApprove` (src/components/CardForm.tsx).

## Additional notes (not findings)

- Plan-drift sub-agent: 11 of 12 tracked contract items MATCH exactly; the one exception (`wikipedia.ts`'s `opensearch` vs. planned `list=search`) is the already-known, already-documented Phase 1 deviation — `lookupHerbImage`'s external contract is unaffected. No MISSING or unexplained EXTRA items. All 5 "What We're NOT Doing" boundaries confirmed respected in the final state (no RTL/component tests, no image picker, Play Game still disabled, no edit confirmation, no offline caching).
- Safety/pattern sub-agent: confirmed no stale-closure bugs, no `defaultValue`-on-controlled-input bug, no cross-card state leakage in `confirmingDeleteId`/`editingCard`, stable `key={card.id}` list rendering, and `git log` confirms `wikipedia.ts`/`image.ts` were touched only in the Phase 1 commit (no later-phase regressions). Pattern consistency across all 4 components and with `adapter.ts`'s fail-soft philosophy confirmed clean.
- Success criteria: `npm run test` (14/14), `npm run build`, `tsc --noEmit` all re-verified fresh at review time.
