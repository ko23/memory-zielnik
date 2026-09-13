# Local Persistence Scaffold Implementation Plan

## Overview

Build `F-01` from `context/foundation/roadmap.md`: a small, typed `localStorage`-backed persistence contract for the herb-card deck (create/read/update/delete, including cached image bytes) and per-player game-result history. This is the foundation `S-01` (herb-card-authoring) and `S-02` (two-player-memory-match) will both build on — nothing user-visible ships in this change; it's a save/load contract two future slices consume.

## Current State Analysis

The codebase is still the bare Astro "basics" scaffold: `src/pages/index.astro`, `src/components/Welcome.astro`, `src/layouts/Layout.astro`. There is no `src/lib/` directory, no persistence code of any kind, and no test framework installed (`package.json` has no test script or test-related devDependency — only `astro` as a dependency and `wrangler` as a devDependency from the deploy setup). `tsconfig.json` extends `astro/tsconfigs/strict`, so all new code must satisfy TypeScript strict mode.

## Desired End State

A `src/lib/storage/` module exists, fully typed, exporting a small domain API (list/create/update/delete herb cards, get/append per-player game history) backed by `localStorage` with a versioned envelope and fail-soft error handling. `context/foundation/test-plan.md` names two concrete risks this module owns, and Vitest is installed with tests proving both. Verification: `npm run test` passes; `npm run build` still succeeds (no regressions to the existing static build).

### Key Discoveries:

- No existing storage, schema, or test code anywhere in the repo — this is a from-scratch module, not an extension of an existing pattern.
- `tsconfig.json`'s strict mode (`astro/tsconfigs/strict`) applies to this module like any other TS file under `src/`.
- Vitest's default test environment (`node`) has no `localStorage` global — the tests need a DOM-like environment (`happy-dom`) to exercise real `localStorage` behavior, including simulating write failures via `vi.spyOn`.

## What We're NOT Doing

- No UI — no forms, no game screens, no components. Those belong to `S-01`/`S-02`.
- No image-fetching or lookup-API integration — this module accepts an already-encoded image (a data URL) from whoever calls `createCard`/`updateCard`; choosing *which* public source to fetch from is `S-01`'s unresolved Unknown, not this foundation's concern.
- No player-identity-collision handling (e.g. "new profile vs. continue" for two different people typing the same name) — parked in the roadmap as a post-MVP item per this session's decision.
- No comprehensive CRUD test coverage — only the two named risks (corrupted-data resilience, write-failure fail-soft) are tested now; broader coverage is left for later if desired.
- No IndexedDB, no server sync, no export/import — out of scope per the roadmap's Foundation scope cap.

## Implementation Approach

A three-file module: `types.ts` (schema + envelope shapes), `adapter.ts` (generic versioned envelope read/write against `localStorage`, with fail-soft error handling), and `index.ts` (the domain API — deck CRUD and player history — built on the adapter). Vitest + `happy-dom` are added as devDependencies so tests can exercise real `localStorage` semantics, including simulated write failures.

## Critical Implementation Details

- **Vitest environment**: the default `node` test environment has no `localStorage` global. `vitest.config.ts` must set `test.environment: 'happy-dom'` (lighter than `jsdom`) for `localStorage` to exist in tests at all — without this, every test in Phase 2 fails at the first `localStorage` reference, not at an assertion.
- **Base64 image size**: base64-encoding inflates binary size by roughly a third. Since the deck is capped at 24 cards (PRD FR-005) and `localStorage` has a ~5-10MB per-origin ceiling, this is likely fine at MVP scale, but it means storage-quota errors are a real possibility (not just a theoretical private-browsing edge case) — this is *why* the write-failure fail-soft behavior (Phase 2's second risk) is being tested now rather than deferred.
- **Schema-version envelope**: every persisted value is wrapped as `{ schemaVersion: number, data: T }`. On read, an unrecognized `schemaVersion` should currently just fall through to the same "reset to default" fail-soft path as corrupted JSON (there's nothing to migrate *from* yet — the hook exists so `S-01`/`S-02` never have to touch this wrapper again if a future migration is needed).

## Phase 1: Persistence module

### Overview

The typed, versioned, fail-soft storage contract itself — no tests yet.

### Changes Required:

#### 1. Schema types

**File**: `src/lib/storage/types.ts`

**Intent**: Define the shapes this module persists and exposes to callers.

**Contract**:
```ts
export interface HerbCard {
  id: string;
  name: string;
  imageDataUrl: string;   // base64 data URL, cached at approval time by the caller
  sourceLabel: string;    // source/species label shown alongside the image (FR-002)
  createdAt: string;      // ISO 8601
  updatedAt: string;      // ISO 8601
}

export interface GameResult {
  playedAt: string;       // ISO 8601
  pairsCollected: number;
  tileCount: number;
  outcome: "win" | "tie" | "loss";
}

export interface PlayerRecord {
  name: string;           // identity key, as typed (trim + case-insensitive compare elsewhere)
  history: GameResult[];
}
```

#### 2. Versioned, fail-soft envelope adapter

**File**: `src/lib/storage/adapter.ts`

**Intent**: One place that knows how to read/write a versioned JSON envelope to `localStorage`, catching every failure mode (quota exceeded, private-browsing restrictions, corrupted/invalid JSON, unrecognized `schemaVersion`) and falling back to an in-memory default rather than throwing.

**Contract**:
```ts
function readEnvelope<T>(key: string, currentVersion: number, defaultData: T): T;
function writeEnvelope<T>(key: string, currentVersion: number, data: T): { ok: boolean };
```
`readEnvelope` never throws: a missing key, invalid JSON, or a `schemaVersion` other than `currentVersion` all resolve to `defaultData`. `writeEnvelope` never throws either: a `localStorage.setItem` failure is caught and reported via `{ ok: false }` rather than propagating, so callers can show the "won't be saved this session" notice without a try/catch of their own.

#### 3. Domain API

**File**: `src/lib/storage/index.ts`

**Intent**: The actual contract `S-01` and `S-02` call — deck CRUD and player history — built on `adapter.ts`. Card creation/update/delete keep the in-memory deck array as the source of truth for the current session even when a write fails (fail-soft), so the app stays usable.

**Contract**:
```ts
function listCards(): HerbCard[];
function createCard(input: { name: string; imageDataUrl: string; sourceLabel: string }): HerbCard;
function updateCard(id: string, patch: Partial<Pick<HerbCard, "name" | "imageDataUrl" | "sourceLabel">>): HerbCard | null;
function deleteCard(id: string): boolean;

function getPlayerHistory(name: string): GameResult[];
function appendGameResult(name: string, result: GameResult): void;
```
`id` is generated with `crypto.randomUUID()`. Player lookup for `getPlayerHistory`/`appendGameResult` compares names trimmed and case-insensitively, but stores the record under the first-seen casing/spelling.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npm run astro -- check` (or `npx tsc --noEmit` if check isn't wired to catch `src/lib/`)
- Build still succeeds: `npm run build`

#### Manual Verification:

- In a browser console against the built/dev site, calling `createCard`, `listCards`, `updateCard`, and `deleteCard` behaves as expected and survives a page refresh

---

## Phase 2: Resilience tests

### Overview

Install Vitest, write the test plan naming the two risks this module owns, and add tests proving both hold.

### Changes Required:

#### 1. Test tooling

**File**: `package.json`

**Intent**: Add Vitest and a `happy-dom` test environment so tests can exercise real `localStorage` semantics; add a `test` script.

**Contract**: `devDependencies` gain `vitest` and `happy-dom`; `scripts.test` runs `vitest run`.

#### 2. Vitest configuration

**File**: `vitest.config.ts`

**Intent**: Point Vitest at the `happy-dom` environment so `localStorage` exists in tests.

**Contract**: `test.environment: "happy-dom"`.

#### 3. Test plan

**File**: `context/foundation/test-plan.md`

**Intent**: Name the two concrete risks this module's tests address, per the `mvp-check` criterion's requirement for a documented risk a real test maps to.

**Contract**: Two named risks:
1. A corrupted or invalid stored blob (bad JSON, or an unrecognized `schemaVersion`) must not crash the app on load — it must reset to an empty default instead.
2. A `localStorage` write failure (quota exceeded, private-browsing restrictions) must not crash card creation or block play — the operation fails soft and the app stays usable in-memory for that session.

#### 4. Tests

**File**: `src/lib/storage/adapter.test.ts`

**Intent**: One test per named risk, exercising `adapter.ts` directly (the layer both risks actually live in).

**Contract**: Risk 1 — seed `localStorage` with an invalid JSON string (and separately, a valid envelope with a wrong `schemaVersion`) under the module's key, call `readEnvelope`, assert it returns the supplied default rather than throwing. Risk 2 — `vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new DOMException("quota exceeded"); })`, call `writeEnvelope`, assert it returns `{ ok: false }` rather than throwing.

### Success Criteria:

#### Automated Verification:

- Tests pass: `npm run test`
- Build still succeeds: `npm run build`

#### Manual Verification:

- Manually corrupt the module's `localStorage` key via devtools, reload a page that calls `listCards()`, confirm no crash and an empty deck is returned

---

## Testing Strategy

### Unit Tests:

- `adapter.test.ts`: the two named risks (corrupted/invalid envelope → default; write failure → soft-fail, no throw)

### Integration Tests:

- None for this change — no UI exists yet to integrate against. `S-01`/`S-02` will add integration-level tests against this module's real API once there's a UI calling it.

### Manual Testing Steps:

1. In a dev/build environment, call `createCard`/`listCards`/`updateCard`/`deleteCard` from the browser console and confirm state survives a refresh.
2. Corrupt the `localStorage` key manually via devtools and confirm the app doesn't crash on the next read.

## Performance Considerations

Base64-encoded images inflate storage size by roughly a third over raw bytes; at the PRD's 24-card cap this should stay well within `localStorage`'s per-origin quota, but the write-failure fail-soft path (Phase 2, risk 2) exists specifically because this isn't guaranteed at every browser/quota configuration.

## Migration Notes

Not applicable — this is a from-scratch module, no existing data to migrate. The `schemaVersion` envelope exists so a *future* schema change has a place to plug in a migration, not because one is needed today.

## References

- Roadmap item: `context/foundation/roadmap.md` → `F-01: Local persistence scaffold`
- PRD refs: NFR ("no data loss on-device"), Success Criteria (Secondary, "scores tracked across sessions"), FR-014 (delete)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Persistence module

#### Automated

- [x] 1.1 Type checking passes — 388a894
- [x] 1.2 Build still succeeds — 388a894

#### Manual

- [x] 1.3 Console-level CRUD survives a refresh — 388a894

### Phase 2: Resilience tests

#### Automated

- [x] 2.1 Tests pass — 931bfd7
- [x] 2.2 Build still succeeds — 931bfd7

#### Manual

- [x] 2.3 Manually corrupted storage key doesn't crash the app — 931bfd7
