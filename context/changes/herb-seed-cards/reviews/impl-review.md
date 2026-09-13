<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Herb Seed Cards Implementation Plan

- **Plan**: context/changes/herb-seed-cards/plan.md
- **Scope**: Phase 1 of 2 (full plan — both phases complete)
- **Date**: 2026-09-13
- **Verdict**: APPROVED
- **Findings**: 0 critical 1 warnings 0 observations

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

### F1 — `seedDefaultCards()` has no partial-failure handling

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/lib/storage/seed.ts:14-16
- **Detail**: The loop over `HERB_SEED_CARDS` calling `createCard()` has no try/catch. Today this is harmless — `createCard` → `persistDeck()` → `writeEnvelope()` (adapter.ts) is fail-soft and never throws. But the "already seeded" guard is `listCards().length > 0` (seed.ts:10-12), which is a one-shot check, not per-entry. If `createCard` ever gains a throwing code path (e.g. future validation), a mid-loop failure would leave the deck partially seeded, and every subsequent call to `seedDefaultCards()` would see that partial deck as "already started" and permanently skip re-seeding the rest — silently, with no error surfaced anywhere.
- **Fix A ⭐ Recommended**: Wrap each `createCard` call in try/catch, log/report any failure, and leave the partial deck as-is (accept the fail-soft philosophy already used throughout F-01).
  - Strength: Consistent with the fail-soft pattern the rest of `src/lib/storage` already uses (adapter.ts never throws either); minimal code change.
  - Tradeoff: A partial seed still isn't retried automatically — just made visible instead of silent.
  - Confidence: HIGH — matches an established, already-reviewed pattern in this codebase.
  - Blind spot: "Visible" only if something reads console/log output; no UI exists yet to surface it to a user.
- **Fix B**: Change the guard to count-based (compare `listCards().length` against `HERB_SEED_CARDS.length` or check by name) so a partial deck gets topped up on a later call.
  - Strength: Self-healing — a partial seed eventually completes itself.
  - Tradeoff: Reintroduces a duplication risk if a user later authors a card whose name coincidentally matches a seed entry; more logic for a failure mode that can't happen with the current `createCard` implementation.
  - Confidence: MEDIUM — correct in theory, but solves a problem that doesn't exist today at the cost of new edge cases that do.
  - Blind spot: Haven't verified whether "top up missing seed cards later" is actually a behavior anyone wants, versus seeding being strictly a one-time bootstrap.
- **Decision**: FIXED via Fix A — wrapped each `createCard` call in try/catch with `console.error` logging (src/lib/storage/seed.ts:14-19).

## Additional notes (not findings)

- Plan-drift sub-agent: all 5 planned changes verified MATCH (source images moved, `sharp` devDependency added, generation script, `seed-data.ts` output shape/count/content, `seed.ts`, `seed.test.ts`). All 5 "What We're NOT Doing" boundaries confirmed respected (no UI wiring, generic attribution only, `F-01`'s `index.ts`/`adapter.ts` untouched since their original commit, no build-time regeneration hook, `./herbs-pictures` no longer exists).
- Safety/pattern sub-agent: no security, performance, or hardcoded-secret issues found. The generation script's own lack of per-file error handling is correct-by-design for a manually-run, fail-fast generator (a single bad image aborts before any output is written, so no partial/corrupt `seed-data.ts` can result). `seed.ts`/`seed.test.ts` pattern-match `index.ts`/`adapter.test.ts` conventions cleanly; `seed.test.ts`'s `vi.resetModules()` usage is a deliberate, commented deviation justified by `index.ts`'s module-level cache, not a convention break.
- Success criteria: `npm run test` (8/8 pass), `npm run build` (succeeds), `tsc --noEmit` (0 errors) all re-verified fresh at review time, independent of the phase-time runs. Manual verification (1.4, image spot-check) has real evidence behind it — dimensions/format were verified programmatically via `sharp` metadata before the human confirmed, not rubber-stamped.
