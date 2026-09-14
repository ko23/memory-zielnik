<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Herb Card Authoring Implementation Plan

- **Plan**: context/changes/herb-card-authoring/plan.md
- **Scope**: Phase 1 of 4
- **Date**: 2026-09-13
- **Verdict**: APPROVED
- **Findings**: 0 critical 1 warnings 1 observations

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

### F1 — Two of three fail-soft branches in wikipedia.ts are untested

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/lib/wikipedia.test.ts (whole file); src/lib/wikipedia.ts:36-38, 46-48, 58-60, 67-69
- **Detail**: `resolveTitle`/`fetchSummary` each correctly catch three failure modes: `fetch()` throwing (network error), non-ok response status, and `response.json()` throwing (parse error). The test suite only exercises the non-ok-status branch (`jsonResponse({}, false)`). No test mocks `fetch` to reject, and none supplies a `json()` that throws — so a regression that accidentally removed either `try/catch` would not be caught by `npm run test`. (Minor related note: `adapter.test.ts`'s `describe` blocks are named after the risk each covers — e.g. "Risk 1: corrupted/invalid data must not crash the app" — while `wikipedia.test.ts`'s are named after the function; risk-labeled naming might have made this gap more visible while writing the tests.)
- **Fix**: Add two cases mirroring `adapter.test.ts`'s risk-based coverage: one `mockRejectedValueOnce` on `fetch` (network error path), one where the mocked response's `json()` rejects/throws (parse-error path).
- **Decision**: PENDING

## Observations

### O1 — image.ts doesn't check response.ok before decoding

- **Severity**: OBSERVATION
- **Location**: src/lib/image.ts:15-17
- **Detail**: If Wikipedia serves a non-2xx response, `fetch` won't throw — `createImageBitmap` will reject on the non-image body instead, so an error still correctly propagates to the caller. Only the error's specificity is affected ("could not decode image" vs. a clearer "404/500"). Consistent with Phase 1's plan — no error handling here yet by design (no UI exists to surface it to). Worth a status check when Phase 2/3 builds the actual error-surfacing UI, not a Phase 1 defect.
- **Decision**: PENDING

## Additional notes (not findings)

- Plan-drift sub-agent: all 4 planned Phase 1 changes verified MATCH, including the `list=search` → `opensearch` endpoint swap (a real, user-approved, correctly-implemented deviation — the contract's shape and null-handling intent are intact). `tsconfig.json`'s change (added by `astro add react` for JSX compilation) is a benign, necessary side effect, not scope creep.
- Safety/pattern sub-agent: no security issues (all dynamic URL segments go through `encodeURIComponent`; `image.ts` never executes fetched content, only decodes it via canvas). `wikipedia.ts`'s fail-soft philosophy matches `adapter.ts`'s exactly. `image.ts` having no error handling while `wikipedia.ts` is fully fail-soft is justified by their different roles (tested pure-logic module vs. browser-only helper with no caller yet), not an inconsistency.
- Success criteria: `npm run test` (13/13), `npm run build`, `tsc --noEmit` all re-verified fresh at review time, independent of the phase-time runs.
