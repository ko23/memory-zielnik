# Cauldron Tile Back — Plan Brief

> Full plan: `context/changes/cauldron-tile-back/plan.md`
> Research: `context/changes/cauldron-tile-back/research.md`

## What & Why

Face-down memory-match tiles currently show a plain `"?"` character. This change swaps that placeholder for a themed brown-cauldron-on-fire image, filling the tile's full 150×150px footprint — the visual polish requested in GitHub issue #8.

## Starting Point

`GameBoard.tsx`'s face-up/face-down ternary renders `"?"` for any face-down tile. The source photo (`assets/herb-seed-sources/cauldron.jpg`, 2MB, 4000×6000px) already exists in the repo but sits inside the directory `scripts/generate-herb-seed-data.mjs` scans to auto-generate herb cards — a latent hazard where re-running that script would bake in a bogus "cauldron" herb card. No runtime serving path for the image exists yet.

## Desired End State

Every face-down tile shows the cauldron image, cropped full-bleed to fill the entire tile square, with no visible empty space and no `"?"`. The raw source photo no longer lives in the herb-seed scan directory, so the collision hazard is closed.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Resize width/quality | 300px width, quality 75 | Right-sized for this image's single 150px consumer — smaller than the herb-card 480px convention, which also covers transient preview sizes this asset doesn't have | Plan |
| Crop behavior | `object-fit: cover` (full-bleed) | Reads like a real card back with no empty space; T1's "never crop" reasoning for face-up herb photos doesn't apply to a decorative, non-identifying image | Plan |
| Asset location | `src/assets/` | Extends the existing (if lightly-used) Vite/Astro static-import precedent; works cleanly from a `client:load` React island | Plan |
| Collision-hazard fix | Relocation alone (no script changes) | Moving the raw source out of the scanned directory fully closes the hazard as a side effect of a step this change needs anyway | Plan |

## Scope

**In scope:**
- Resize and relocate the cauldron source image
- Swap `GameBoard.tsx`'s `"?"` fallback for the cauldron image
- Add a `.tileBack` CSS class

**Out of scope:**
- Adding an exclude-filter guard to `generate-herb-seed-data.mjs`
- Any animation or interaction on the tile back
- New automated tests (matches T1/T3 convention — manual verification only)

## Architecture / Approach

Two phases, mirroring the T3 (`multi-row-tile-grid`) precedent of separating asset prep from component wiring:
1. **Asset prep**: one-off `sharp` resize (300px, quality 75) of the raw source, relocated from `assets/herb-seed-sources/cauldron.jpg` to `assets/cauldron-source.jpg`, with the resized output landing at `src/assets/cauldron.jpg`.
2. **Component wiring**: import the resized asset in `GameBoard.tsx`, swap the `"?"` branch for an `<img className={styles.tileBack} src={cauldronBack.src} alt="" />`, and add `.tileBack { width: 100%; height: 100%; object-fit: cover; }` to `GameBoard.module.css`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Asset preparation | Resized runtime asset at `src/assets/cauldron.jpg`; raw source relocated, collision hazard closed | Sharp's ESM invocation syntax (`--input-type=module`) is non-obvious — the plan spells out the exact command |
| 2. Component integration | Every face-down tile renders the cauldron image | `cover` crop might cut the cauldron/flame out of frame — flagged as a manual check |

**Prerequisites:** None — `sharp` and the `src/assets/` import pattern already exist in the codebase; no new dependencies.
**Estimated effort:** ~1 session, single pass through both phases.

## Open Risks & Assumptions

- Assumes the `cover` crop keeps the cauldron/flame subject visually centered after cropping the 2:3 portrait source to a 1:1 square — Phase 2's manual verification checks this directly; if it fails, the fix is a `sharp` `.extract()` crop-region adjustment during Phase 1, not a redesign.

## Success Criteria (Summary)

- Every face-down tile shows the cauldron image filling the tile, no `"?"` visible
- `assets/herb-seed-sources/` no longer contains `cauldron.jpg` — re-running the herb-seed generation script can't pick it up as a bogus card
- `npx astro check` and `npm run build` both pass with no new errors
