# Herb Seed Cards — Plan Brief

> Full plan: `context/changes/herb-seed-cards/plan.md`

## What & Why

Turn the 14 local herb photos in `./herbs-pictures` into a starter deck, so the game has real content to play with as soon as the game UI exists, instead of starting from an empty deck every time.

## Starting Point

`F-01` (local persistence scaffold) already exposes `createCard`/`listCards`/etc. as a tested `localStorage`-backed contract, but nothing has ever called it — the deck is empty and there's no seed data anywhere in the repo.

## Desired End State

A committed, regeneratable seed-data file (`src/lib/storage/seed-data.ts`) holding 14 resized, base64-encoded herb images with titles derived from filenames, plus a `seedDefaultCards()` function that populates an empty deck from it. Nothing calls it yet — that's `S-01`/`S-02`'s job.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Image compression | Resize to ~480px wide, JPEG q~75 via `sharp` | Keeps the 14-card seed well under 1MB, protecting the localStorage-quota budget `F-01`'s test-plan already flagged as a real risk | Plan |
| Attribution | Generic `"Wikipedia (GFDL)"` per card | No per-image author/page URLs were supplied; ships now rather than blocking on data-gathering | Plan |
| Live wiring | None yet — function exists, unwired | Keeps this change a pure library addition, consistent with `F-01`'s "no UI" precedent; `S-01`/`S-02` will call it | Plan |
| Source images | Moved to `assets/herb-seed-sources/`, kept committed | Preserves the ability to regenerate at different compression settings later | Plan |
| Seed-data shape | Plain `{name, imageDataUrl, sourceLabel}`, not full `HerbCard` | `id`/timestamps should reflect when a real user's browser seeds their own deck, not when the script ran | Plan |

## Scope

**In scope:**
- Move + commit source images under `assets/herb-seed-sources/`
- One-time generation script (`sharp` resize/recompress, title derivation)
- Committed `seed-data.ts` (14 entries)
- `seedDefaultCards()` + tests

**Out of scope:**
- Wiring the seed call into any page (deferred to `S-01`/`S-02`)
- Per-image Wikipedia attribution (author/page URL)
- Build-time/automatic regeneration of seed data
- Any change to `F-01`'s persistence contract itself

## Architecture / Approach

`scripts/generate-herb-seed-data.mjs` (manual, one-time) → `src/lib/storage/seed-data.ts` (committed data) → `src/lib/storage/seed.ts`'s `seedDefaultCards()` (thin consumer of `F-01`'s existing `createCard`).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Generate seed data | Moved source images, generation script, committed seed-data.ts | Wrong resize/quality settings could either bloat storage or degrade image quality too far |
| 2. Seeding function + tests | `seedDefaultCards()`, tests for empty-deck and non-empty-deck cases | None significant — thin, well-tested wrapper over an already-tested contract |

**Prerequisites:** `F-01` (local-persistence-scaffold) — already implemented.
**Estimated effort:** Not estimated (project convention — agentic execution is non-linear).

## Open Risks & Assumptions

- Generic GFDL attribution may need to be revisited if this project ever needs strict license compliance (currently accepted as MVP-sufficient).
- Resize/quality settings (480px, q75) are a judgment call, not derived from a hard requirement — easy to tune later since the script is regeneratable.

## Success Criteria (Summary)

- Running the generation script reproduces `seed-data.ts` from the source images.
- `npm run test` passes, including new tests proving `seedDefaultCards()` populates an empty deck and leaves a non-empty one untouched.
- `npm run build` still succeeds.
