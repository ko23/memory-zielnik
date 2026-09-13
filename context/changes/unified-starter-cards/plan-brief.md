# Unified Starter Cards — Plan Brief

> Full plan: `context/changes/unified-starter-cards/plan.md`

## What & Why

Make starter herb cards genuinely first-class, editable/deletable deck entries — same as user-added cards — instead of forcing them to carry a meaningless `sourceLabel` attribution they don't have. Starters already skip approval today; this just widens the data contract so that stays true without a fake placeholder value.

## Starting Point

`HerbCard.sourceLabel` is required; `seed-data.ts` (14 entries) carries `{name, imageDataUrl, sourceLabel: "Wikipedia (GFDL)"}`; `seedDefaultCards()` already calls `createCard()` per entry when the deck is empty. No page has ever called it yet, so there's no live data in the old shape to migrate.

## Desired End State

`HerbCard.sourceLabel` is optional. `seed-data.ts` entries are `{name, path, imageDataUrl}` — `path` traces back to the source file for regeneration, never persisted onto a card. Starter cards, once seeded, are ordinary `HerbCard`s with no `sourceLabel` — editable/deletable exactly like user cards.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Missing source label in future UI | Show nothing (no placeholder) | Absence communicates "not looked up" without inventing UI copy for a screen that doesn't exist yet | Plan |
| Sibling plan coordination | Patch `herb-card-authoring/plan.md`'s stale boundary now | A plan shouldn't contain a claim this change directly falsifies | Plan |
| Testing scope | Extend `seed.test.ts` for the new shape | Matches this project's established habit of testing its core data contracts | Plan |
| `path`'s role | Seed-file metadata only, never on `HerbCard` | Keeps starter cards structurally identical to user cards once created | Plan |

## Scope

**In scope:**
- `HerbCard.sourceLabel` → optional; `createCard`'s input likewise
- `seed-data.ts` + generator reshaped to `{name, path, imageDataUrl}`
- `seed.ts` updated to the new shape
- `seed.test.ts` extended
- Correcting `herb-card-authoring/plan.md`'s stale scope claim

**Out of scope:**
- Any UI (still not built — `herb-card-authoring` Phases 2-4)
- The image-lookup-vs-upload question for newly-added herbs
- Adding `path` (or anything else) to the persisted `HerbCard` type

## Architecture / Approach

Widen `F-01`'s `HerbCard`/`createCard` contract (optional `sourceLabel`), reshape `herb-seed-cards`' generator output, update its one consumer (`seed.ts`), then correct the one sibling plan whose documented boundary this crosses.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Data model + seed restructuring | Optional `sourceLabel`, new seed shape, updated seeding, extended tests | None significant — small, well-tested area |
| 2. Amend herb-card-authoring/plan.md | Corrected documentation | None — docs only |

**Prerequisites:** `local-persistence-scaffold` (F-01) and `herb-seed-cards` — both already implemented.
**Estimated effort:** Not estimated (project convention — agentic execution is non-linear).

## Open Risks & Assumptions

- None significant — no live data to migrate, no UI to break, a well-understood and already-tested area of the codebase.

## Success Criteria (Summary)

- `npm run test` and `npm run build` pass with the new seed shape and optional `sourceLabel`.
- Re-running the generator reproduces `seed-data.ts` in the new `{name, path, imageDataUrl}` shape.
- `herb-card-authoring/plan.md` no longer contains a false scope claim.
