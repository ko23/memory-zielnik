# Herb Seed Cards Implementation Plan

## Overview

Turn the 14 source JPGs in `./herbs-pictures` into a starter deck of herb cards. A one-time Node script resizes/recompresses each image, base64-encodes it, derives a title from the filename, and writes a committed seed-data file. A small `seedDefaultCards()` function then populates an empty deck from that data using `F-01`'s existing `createCard` contract — but nothing calls it yet; wiring it into an actual page is deferred to `S-01`/`S-02`.

## Current State Analysis

`src/lib/storage/` (from `F-01`) already exposes `createCard(input: {name, imageDataUrl, sourceLabel}): HerbCard`, `listCards(): HerbCard[]`, and the rest of the CRUD contract, backed by a versioned, fail-soft `localStorage` adapter. No seed data, no generation scripts, and no `scripts/` directory exist yet. `sharp@0.35.4` is already present in `node_modules` as a transitive dependency of Astro's image tooling but isn't declared in `package.json`. The 14 source images live at the repo root in `./herbs-pictures/*.jpg` (1.9MB total, individual files 53KB–361KB), each named as a Polish herb common name with `-` separating words (e.g. `koper-wloski.jpg`).

## Desired End State

`assets/herb-seed-sources/*.jpg` holds the (moved) source images. `scripts/generate-herb-seed-data.mjs` can regenerate `src/lib/storage/seed-data.ts` — a committed array of 14 `{name, imageDataUrl, sourceLabel}` entries, each image resized to ~480px wide and re-encoded at JPEG quality ~75. `src/lib/storage/seed.ts` exports `seedDefaultCards()`, which creates all 14 as real `HerbCard`s (via `createCard`) only when the deck is currently empty. Verification: `npm run test` passes (including new seed tests); `npm run build` still succeeds; running the generation script reproduces `seed-data.ts` deterministically from the source images.

### Key Discoveries:

- `createCard`'s existing contract (`index.ts`) is exactly the right integration point — no changes needed to `F-01`'s API surface, only a new consumer of it.
- `sharp` is already resolvable (`require("sharp")` works today) but undeclared — must be added as an explicit devDependency so the generation script doesn't rely on hoisting from Astro's own dependency tree.
- Filenames need no normalization beyond the literal instruction: strip `.jpg`, replace `-` with ` ` (e.g. `koper-wloski.jpg` → `koper wloski`, left lowercase, no diacritic restoration or capitalization — not asked for).

## What We're NOT Doing

- No wiring of `seedDefaultCards()` into any page — it stays uncalled until `S-01`/`S-02` build a real menu/game page, per this session's decision. Nothing user-visible changes when this change lands.
- No per-image Wikipedia author/page-URL attribution — every card's `sourceLabel` is the generic `"Wikipedia (GFDL)"`, per this session's decision.
- No changes to `F-01`'s `createCard`/`adapter.ts` contracts — this change is purely a new consumer.
- No automatic/build-time regeneration of `seed-data.ts` on every `npm run build` — the generation script is run manually, on demand, only when source images change.
- No deletion of the original `herbs-pictures` images — they're moved (not copied) to `assets/herb-seed-sources/` and kept as the regeneratable source of truth, per this session's decision.

## Implementation Approach

A one-time, manually-run generation script (`scripts/generate-herb-seed-data.mjs`) reads the moved source images, uses `sharp` to resize+recompress each, base64-encodes the result, derives the title from the filename, and writes `src/lib/storage/seed-data.ts` as a plain data array — deliberately *not* full `HerbCard` objects, since `id`/`createdAt`/`updatedAt` should reflect when a given user's browser actually seeds their deck, not when the script ran. `seedDefaultCards()` is a thin consumer: check `listCards().length === 0`, then `createCard()` each seed entry in order.

## Phase 1: Generate seed data

### Overview

Move the source images, write and run the generation script, commit the resulting seed-data file.

### Changes Required:

#### 1. Move source images

**File**: `assets/herb-seed-sources/*.jpg` (moved from `./herbs-pictures/*.jpg`)

**Intent**: Give the source images a permanent, clearly-named home as regeneratable input, separate from `src/assets/` (which holds Astro-pipeline UI assets, not seed-data sources).

**Contract**: Same 14 filenames, same content, new parent directory. `./herbs-pictures/` no longer exists after the move.

#### 2. Add `sharp` as an explicit devDependency

**File**: `package.json`

**Intent**: Pin the image-processing library the generation script depends on, rather than relying on it being hoisted transitively from Astro's own tooling.

**Contract**: `devDependencies` gains `sharp` at its currently-resolved version (`0.35.4`).

#### 3. Generation script

**File**: `scripts/generate-herb-seed-data.mjs`

**Intent**: A manually-run, idempotent script that reads every `.jpg` in `assets/herb-seed-sources/`, resizes/recompresses it, derives its title, and emits the seed-data file.

**Contract**: For each file: `sharp(path).resize({ width: 480 }).jpeg({ quality: 75 }).toBuffer()`, base64-encode as a `data:image/jpeg;base64,...` string; title = filename with `.jpg` stripped and `-` replaced with ` `; `sourceLabel` = the literal string `"Wikipedia (GFDL)"`. Writes `src/lib/storage/seed-data.ts` exporting:
```ts
export interface HerbSeedCard {
  name: string;
  imageDataUrl: string;
  sourceLabel: string;
}

export const HERB_SEED_CARDS: HerbSeedCard[] = [ /* 14 entries, sorted by filename */ ];
```
The file header notes it's generated and names the regeneration command (`node scripts/generate-herb-seed-data.mjs`).

#### 4. Run the script once

**Intent**: Produce the actual committed `seed-data.ts` for this change.

**Contract**: `node scripts/generate-herb-seed-data.mjs` succeeds and produces exactly 14 entries.

### Success Criteria:

#### Automated Verification:

- Generation script runs cleanly: `node scripts/generate-herb-seed-data.mjs`
- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`

#### Manual Verification:

- Spot-check 2-3 generated `imageDataUrl` entries by pasting into a browser address bar (or an `<img>` tag) to confirm they render as the correct herb photo, resized and still legible

---

## Phase 2: Seeding function + tests

### Overview

The thin, tested consumer of `seed-data.ts` and `F-01`'s `createCard` contract.

### Changes Required:

#### 1. Seeding function

**File**: `src/lib/storage/seed.ts`

**Intent**: Populate the deck from the generated seed data, but only when it's currently empty — never overwrite or duplicate a deck the user has already started authoring.

**Contract**:
```ts
export function seedDefaultCards(): void;
```
No-op if `listCards().length > 0`; otherwise calls `createCard({ name, imageDataUrl, sourceLabel })` once per `HERB_SEED_CARDS` entry, in array order.

#### 2. Tests

**File**: `src/lib/storage/seed.test.ts`

**Intent**: Prove the two behaviors that matter: it seeds an empty deck fully, and it never touches a non-empty one.

**Contract**: One test asserts `listCards()` has all 14 seed entries (by name) after calling `seedDefaultCards()` against an empty deck. A second test pre-creates one card via `createCard`, calls `seedDefaultCards()`, and asserts the deck still has exactly that one card (no seed entries added).

### Success Criteria:

#### Automated Verification:

- Tests pass: `npm run test`
- Build still succeeds: `npm run build`

#### Manual Verification:

- None — this phase's behavior is fully covered by automated tests; there's no UI to eyeball yet

---

## Testing Strategy

### Unit Tests:

- `seed.test.ts`: seeds a fully empty deck; does nothing to a non-empty deck

### Integration Tests:

- None — no UI exists yet to integrate against; `S-01`/`S-02` will exercise `seedDefaultCards()` end-to-end once they wire it in.

### Manual Testing Steps:

1. Run the generation script and spot-check a few resulting images render correctly and are legibly sized.
2. Run `npm run test` and confirm the new seed tests pass alongside `F-01`'s existing suite.

## Performance Considerations

Resizing to ~480px wide at JPEG quality ~75 should bring each image to roughly 20-40KB before base64 inflation (~33%), keeping the full 14-card seed well under 1MB in `localStorage` — a meaningful improvement over the ~2.5MB the original-resolution images would have consumed.

## Migration Notes

Not applicable — this only adds new cards to an empty deck; it never touches or migrates existing data.

## References

- Prior work: `context/changes/local-persistence-scaffold/plan.md` (`F-01` — the persistence contract this change consumes)
- PRD refs: FR-002 (herb card fields: name, image, source label) — seed cards populate the same shape, without going through the lookup/approval flow those FRs describe for user-authored cards

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Generate seed data

#### Automated

- [x] 1.1 Generation script runs cleanly — 3ba36d2
- [x] 1.2 Type checking passes — 3ba36d2
- [x] 1.3 Build still succeeds — 3ba36d2

#### Manual

- [x] 1.4 Spot-checked generated images render correctly — 3ba36d2

### Phase 2: Seeding function + tests

#### Automated

- [x] 2.1 Tests pass — 1355441
- [x] 2.2 Build still succeeds — 1355441
