# Local Persistence Scaffold — Plan Brief

> Full plan: `context/changes/local-persistence-scaffold/plan.md`

## What & Why

`F-01` on the roadmap: a small, typed `localStorage`-backed persistence contract for the herb-card deck (create/read/update/delete, including cached image bytes) and per-player game-result history. Nothing user-visible ships here — this is the save/load layer that `S-01` (card authoring) and `S-02` (gameplay) both need before they can be built.

## Starting Point

The repo is still the bare Astro "basics" scaffold — no `src/lib/`, no persistence code, no test framework. This is a from-scratch module, not an extension of anything existing.

## Desired End State

A `src/lib/storage/` module exposing `listCards`, `createCard`, `updateCard`, `deleteCard`, `getPlayerHistory`, and `appendGameResult` — backed by `localStorage`, versioned, and fail-soft on every error path. `npm run test` passes two risk-based tests; `npm run build` still succeeds.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Storage mechanism | `localStorage` | Deck/score data is tiny at this scale; the simpler sync API fits the timeline. | Plan |
| Image data | Cache actual bytes (base64 data URL) | Guarantees an approved image can never disappear due to source-link rot. | Plan |
| Player identity | Typed name is the key | Matches PRD's literal wording; collision handling parked for post-MVP. | Plan |
| Score history | Full per-game array | Keeps options open for "best game"/history displays without a future schema change. | Plan |
| Failure handling | Fail-soft, in-memory fallback | Never crashes or blocks play over a non-critical guarantee — kid-appropriate UX. | Plan |
| Schema versioning | `{schemaVersion, data}` envelope from day one | Zero cost now, avoids a painful retrofit once S-01/S-02 extend the schema. | Plan |
| Testing scope | Add first test now (Vitest + `happy-dom`) | Closes mvp-check's "tests addressing a defined risk" gap at the cleanest possible point. | Plan |
| PRD gap found during planning | Added FR-014 (delete a herb card) | Create/edit existed with no delete — would have permanently blocked the CRUD mvp-check criterion. | Plan |

## Scope

**In scope:**
- Typed schema (`HerbCard`, `GameResult`, `PlayerRecord`)
- Versioned, fail-soft `localStorage` adapter
- Deck CRUD + player-history domain API
- Vitest + `happy-dom`, `test-plan.md`, two risk-based tests

**Out of scope:**
- Any UI (belongs to `S-01`/`S-02`)
- Choosing the image-lookup API/source (`S-01`'s Unknown)
- Player-identity-collision handling (parked, post-MVP)
- Broad CRUD test coverage beyond the two named risks
- IndexedDB, server sync, export/import

## Architecture / Approach

Three files: `types.ts` (shapes), `adapter.ts` (generic versioned envelope read/write, fail-soft), `index.ts` (domain API built on the adapter). Tests exercise `adapter.ts` directly since both named risks live at that layer.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Persistence module | Typed, versioned, fail-soft storage contract | Base64 image caching pushes closer to localStorage's quota than plain URLs would |
| 2. Resilience tests | Vitest + test-plan.md + tests for corrupted-data reset and write-failure fail-soft | Default Vitest environment has no `localStorage` — needs `happy-dom` |

**Prerequisites:** None — first change in the milestone.
**Estimated effort:** Not estimated (roadmap/plan convention — agentic execution is non-linear).

## Open Risks & Assumptions

- Base64-encoded images inflate size ~33% over raw bytes; at the 24-card cap this should fit `localStorage`'s quota, but isn't guaranteed on every browser — mitigated by the write-failure fail-soft path, not by a hard size limit.
- No migration exists yet (nothing to migrate from) — the schema-version envelope is pure insurance for `S-01`/`S-02`.

## Success Criteria (Summary)

- `npm run test` passes both risk-based tests; `npm run build` still succeeds.
- Console-level CRUD against the module survives a page refresh.
- A manually corrupted storage key does not crash the app on the next read.
