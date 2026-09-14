# Herb Card Authoring Implementation Plan

## Overview

Build `S-01` from `context/foundation/roadmap.md`: the starting menu, and the herb-card authoring flow — create a card via a Polish-Wikipedia image lookup with human approval, edit an existing card through the same flow (pre-filled), and delete a card (with confirmation). This is the project's first real UI, built as a single React island on top of `F-01`'s already-tested persistence contract and `herb-seed-cards`' seed data (which this change finally wires up).

## Current State Analysis

The codebase has a complete, tested persistence layer (`src/lib/storage/{types,adapter,index}.ts` — CRUD for herb cards + player history) and a generated seed dataset (`src/lib/storage/seed-data.ts`, 14 entries) with a `seedDefaultCards()` function that is deliberately unwired, waiting for exactly this change. There is no UI code anywhere — `src/pages/index.astro` still renders only the stock Astro "Welcome" scaffold. No UI framework is installed: no `@astrojs/react`, `react`, or `react-dom` in `package.json`, and `astro.config.mjs` has no integrations. `context/foundation/tech-stack.md` already decided the framework question: *"lets a React island carry the whole interactive game client-side with no backend"* — this change is where that decision gets acted on for the first time.

## Desired End State

Visiting the deployed site shows a starting menu (Create Cards / Play Game [disabled] / Exit) instead of the Astro scaffold. On first load, the deck auto-populates with the 14 seed cards. "Create Cards" shows the current deck as a list, with an "Add card" entry point that walks through name entry → Wikipedia lookup → approve/reject → save, and per-card Edit (same flow, pre-filled) and Delete (with a confirm step) actions. Verification: `npm run test` passes (existing suite + new lookup-module tests); `npm run build` succeeds; the deployed site is manually walked through the full create/edit/delete flow.

### Key Discoveries:

- `tech-stack.md`'s React-island decision, combined with `F-01`'s `wrangler.jsonc` choice of `not_found_handling: "single-page-application"` (justified there as "future game screens are planned as client-side state within one route"), together settle the architecture: one island, internal screen state, not multiple Astro routes.
- `herb-seed-cards`' `seedDefaultCards()` (`src/lib/storage/seed.ts`) was explicitly left unwired "until S-01/S-02 build a real menu/game page" — this change is that page landing.
- The herb names in `seed-data.ts` are Polish common names (e.g. "koper wloski") — a lookup against English Wikipedia would fail almost every search; Polish Wikipedia (`pl.wikipedia.org`) is required for the lookup to actually work for this content.
- Real Wikipedia page titles carry proper capitalization and Polish diacritics (e.g. the actual title is "Koper włoski", not "koper wloski") that a raw typed name will essentially never match via direct title lookup — the lookup must resolve through Wikipedia's *search* endpoint first to find the right title, then fetch that title's summary, rather than attempting a direct title-to-summary call.
- `happy-dom` (this project's Vitest environment, from `F-01`) has limited/stubbed `<canvas>` support — `drawImage`/`toDataURL` don't produce real pixel data under it. The image-resize step (Canvas-based, browser-only) is therefore not meaningfully unit-testable here; it's covered by manual verification instead, consistent with the "pure-logic tests only" scope decided for this change.

## What We're NOT Doing

- No component/DOM-rendering tests (no React Testing Library) — only the pure lookup/parsing logic is unit tested, per this session's decision.
- No image-candidate picker UI — lookup auto-resolves to a single best match via Wikipedia's search endpoint, per this session's decision.
- No actual "Play Game" screen — the button exists and is disabled/"coming soon"; `S-02` builds its real behavior.
- No confirmation step for edit (matching FR-013's existing precedent) — only delete gets a confirmation, per this session's decision.
- No offline/service-worker image caching beyond what's already stored as base64 in `localStorage` — a lookup requires a live network connection to Wikipedia.
- No further changes to `F-01`'s `index.ts`/`adapter.ts` contracts beyond what `unified-starter-cards` already landed (`HerbCard.sourceLabel` and `createCard`'s input are now optional, so starter cards don't need a meaningless attribution placeholder) — this change still only calls `seedDefaultCards()`, it doesn't modify `seed-data.ts`/`seed.ts` itself. Phases 3-4's own `createCard`/`updateCard` calls always pass a real `sourceLabel` from a Wikipedia lookup, so the widened-but-not-narrowed contract doesn't affect them.

## Implementation Approach

Add `@astrojs/react` and mount one root island (`GameApp`) from `src/pages/index.astro`, holding a small top-level screen state (`"menu" | "cards"`). Wikipedia search/summary fetching and the fetch-and-resize-to-data-URL step live as plain, framework-free functions in `src/lib/wikipedia.ts` — testable in isolation, imported by the React components but not entangled with them. `seedDefaultCards()` runs once on the island's initial mount.

## Critical Implementation Details

- **Wikipedia CORS**: this environment can't make live network calls to verify at planning time, but Wikipedia's REST API (`/api/rest_v1/...`) and the `w/api.php` search endpoint (with `origin=*`) are documented as CORS-enabled for anonymous read access, and `upload.wikimedia.org` (the image CDN) is documented as CORS-enabled for its media files — this is why the approach is viable without a backend proxy. As the very first implementation step in Phase 1, do a live manual smoke-test of one search+summary+image fetch before building the rest of the flow around it, so a CORS or endpoint-shape surprise is caught immediately rather than after the UI is built.
- **Lookup resolution order**: always call the search endpoint first (`list=search`, `srsearch=<name>`) to resolve the best-matching page title, then fetch that title's summary — never attempt a direct title-to-summary call first, since typed Polish herb names won't match real Wikipedia title capitalization/diacritics.
- **A lookup with no image**: some Wikipedia pages have no thumbnail (`summary.thumbnail` absent). Treat this the same as "no result found" — surface it as a lookup failure, returning the user to name entry, not a success with a missing image.

## Phase 1: Astro+React scaffold + Wikipedia lookup module

### Overview

Stand up the React island infrastructure and the tested, framework-free lookup logic — no UI screens yet.

### Changes Required:

#### 1. Add React integration

**File**: `astro.config.mjs`, `package.json`

**Intent**: Enable React islands per `tech-stack.md`'s decision.

**Contract**: `package.json` gains `@astrojs/react`, `react`, `react-dom` as dependencies (React is runtime, not dev-only, since it ships to the browser). `astro.config.mjs`'s `defineConfig` gains `integrations: [react()]`.

#### 2. Wikipedia lookup module

**File**: `src/lib/wikipedia.ts`

**Intent**: Resolve a herb name to a single best-match image + attribution, entirely client-side, with no UI concerns.

**Contract**:
```ts
export interface HerbLookupResult {
  title: string;        // resolved Wikipedia page title
  imageUrl: string;     // thumbnail source URL
  sourceLabel: string;  // e.g. "Wikipedia: <title>"
}

export async function lookupHerbImage(name: string): Promise<HerbLookupResult | null>;
```
Internally: search `pl.wikipedia.org`'s `w/api.php` (`action=query&list=search&format=json&origin=*&srsearch=<name>`) for the top hit's title; fetch that title's `/api/rest_v1/page/summary/<title>`; return `null` if no search hit, the summary fetch fails, or the summary has no `thumbnail`. `sourceLabel` is built from the resolved title (per this session's generic-but-accurate attribution style, echoing `herb-seed-cards`' "Wikipedia (GFDL)" convention but naming the specific page).

#### 3. Image fetch + resize helper

**File**: `src/lib/image.ts`

**Intent**: Turn a remote image URL into a base64 data URL sized consistently with `herb-seed-cards`' seed images, so hand-authored and seed cards don't wildly differ in storage footprint.

**Contract**:
```ts
export async function urlToResizedDataUrl(url: string, maxWidth?: number): Promise<string>;
```
Fetches the URL as a blob, draws it to an off-screen `<canvas>` scaled to `maxWidth` (default 480, matching `herb-seed-cards`), and returns `canvas.toDataURL("image/jpeg", 0.75)`. Not unit-tested (see Key Discoveries) — covered by this phase's manual verification.

#### 4. Lookup module tests

**File**: `src/lib/wikipedia.test.ts`

**Intent**: Cover `lookupHerbImage`'s branching (found-with-image, found-no-thumbnail, no-search-hit, fetch failure) without any real network call.

**Contract**: Mock `global.fetch` per test case (search response, summary response) and assert `lookupHerbImage` returns the expected `HerbLookupResult` or `null` for each branch.

### Success Criteria:

#### Automated Verification:

- Tests pass: `npm run test`
- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`

#### Manual Verification:

- Live smoke-test: call `lookupHerbImage("koper włoski")` (or similar) from a browser console against the dev server and confirm it returns a real image URL — this is the CORS/endpoint-shape canary mentioned in Critical Implementation Details
- Call `urlToResizedDataUrl` with that URL and confirm the returned data URL renders as a legible, appropriately-sized image

---

## Phase 2: Menu + card list

### Overview

The starting menu and a read-only view of the current deck — verifiable with the 14 seed cards alone, before any create/edit/delete behavior exists.

### Changes Required:

#### 1. Root island mount

**File**: `src/pages/index.astro`

**Intent**: Replace the Astro scaffold's `Welcome` component with the real app entry point.

**Contract**: Renders `<GameApp client:load />` inside the existing `Layout.astro`. The stock `Welcome.astro`/its assets (`astro.svg`, `background.svg`) are no longer referenced from this page (may be deleted or left unreferenced — implementer's judgment, not load-bearing).

#### 2. Root app component

**File**: `src/components/GameApp.tsx`

**Intent**: Top-level screen state and the one-time seed call.

**Contract**: On initial mount (once, e.g. via `useEffect` with an empty dependency array — or module-level, before first render, whichever reads more naturally as a React idiom), calls `seedDefaultCards()` from `src/lib/storage/seed`. Holds `screen: "menu" | "cards"` state; renders `Menu` or `CardManager` accordingly.

#### 3. Menu component

**File**: `src/components/Menu.tsx`

**Intent**: FR-001's three-option menu.

**Contract**: Three actions — "Create Cards" (sets screen to `"cards"`), "Play Game" (rendered `disabled`, labeled to indicate it's not yet available), "Exit" (per this session's resolution of FR-001's ambiguous web-context meaning: shows a friendly "you can close this tab now" message in place of the menu, since a browser tab can't be closed programmatically).

#### 4. Card list component

**File**: `src/components/CardManager.tsx` (or a dedicated `CardList.tsx` — implementer's call whether create/edit/delete state also lives here or splits further; both are internal to this component tree, not part of this plan's external contract)

**Intent**: Read-only display of the current deck for this phase — each entry shows its image, name, and source label. A "Back to menu" action returns `screen` to `"menu"`.

**Contract**: Calls `listCards()` from `src/lib/storage` on render/mount to populate the list.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`

#### Manual Verification:

- Loading the deployed/dev site shows the menu, not the Astro scaffold
- "Create Cards" shows all 14 seed cards (name + image) on first visit
- Refreshing the page does not re-seed or duplicate cards (still exactly 14)
- "Play Game" is visibly disabled; "Exit" shows the close-tab message and returns to the menu

---

## Phase 3: Create flow

### Overview

Add a card from scratch: name entry → lookup → approve/reject → save.

### Changes Required:

#### 1. Card form component

**File**: `src/components/CardForm.tsx`

**Intent**: The create flow's UI — also reused by Phase 4's edit flow.

**Contract**: Internal states: name entry (text input + submit) → looking up (loading indicator) → approve (shows the resolved image, source label, Approve/Reject) → error (no result found; returns to name entry, per this session's reject/retry decision applying equally to a failed lookup). On Approve: calls `urlToResizedDataUrl`, then `createCard({name, imageDataUrl, sourceLabel})` from `src/lib/storage`, then returns to the card list. On Reject: returns to name entry, pre-filled with the same typed name, per this session's decision.

#### 2. Wire "Add card" entry point

**File**: `src/components/CardManager.tsx`

**Intent**: Expose `CardForm` from the card list view.

**Contract**: An "Add card" action switches the list view to `CardForm` in create mode (no pre-filled name, no existing card id); on save or cancel, returns to the list.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`

#### Manual Verification:

- Add a new card with a real herb name; confirm the looked-up image and source label display before saving, and the card appears in the list after approval
- Reject a looked-up image; confirm the flow returns to name entry (not the list) with the name still filled in
- Enter a name with no Wikipedia match; confirm a clear "not found" state that returns to name entry rather than crashing or silently failing
- Refresh the page after adding a card; confirm it's still there (persisted, not just in-memory)

---

## Phase 4: Edit + delete

### Overview

Reuse `CardForm` for editing; add delete with confirmation.

### Changes Required:

#### 1. Edit wiring

**File**: `src/components/CardManager.tsx`, `src/components/CardForm.tsx`

**Intent**: Per this session's decision, editing reuses the create form pre-filled, not a separate screen.

**Contract**: An existing card's "Edit" action switches to `CardForm` in edit mode: pre-filled with the card's current name, showing its current image without re-triggering a lookup. The form offers two explicit actions distinct from create mode: save the name change alone (calls `updateCard(id, {name})`, no new lookup), or trigger a fresh lookup (re-enters the same lookup → approve/reject flow as create; on approval, calls `updateCard(id, {name, imageDataUrl, sourceLabel})` instead of `createCard`).

#### 2. Delete with confirmation

**File**: `src/components/CardManager.tsx`

**Intent**: Per this session's decision, delete requires one confirmation step.

**Contract**: A card's "Delete" action shows an inline confirm ("Delete `<name>`?" / Yes / No) before calling `deleteCard(id)` from `src/lib/storage`. "No" or dismissing returns to the plain list with no change.

### Success Criteria:

#### Automated Verification:

- Type checking passes: `npx tsc --noEmit`
- Build still succeeds: `npm run build`
- Full suite still passes: `npm run test`

#### Manual Verification:

- Edit an existing card's name only (no new lookup); confirm the image is unchanged and the name updates in the list
- Edit an existing card and trigger a new lookup; confirm approving the new image replaces the old one (same card id, not a duplicate)
- Delete a card; confirm the "Delete `<name>`?" prompt appears, "No" leaves it intact, "Yes" removes it and the list reflects one fewer card after a refresh

---

## Testing Strategy

### Unit Tests:

- `wikipedia.test.ts`: `lookupHerbImage`'s branches (found, no-thumbnail, no-search-hit, fetch failure), all via mocked `fetch` — no live network calls in the test suite itself

### Integration Tests:

- None — per this session's "pure-logic tests only" decision, no component/DOM-rendering tests this slice.

### Manual Testing Steps:

1. Fresh page load: confirm menu appears, deck auto-seeds with 14 cards, refreshing doesn't duplicate them.
2. Full create flow: add a card, reject once, retry, approve, confirm it persists across a refresh.
3. Full edit flow: rename-only, and rename-with-new-image, confirming no duplicate card is created.
4. Full delete flow: confirm step appears, cancel path leaves the card, confirm path removes it.
5. A no-match herb name: confirm a clean "not found" state, not a crash.

## Performance Considerations

Image resize (Canvas, ~480px wide, JPEG q0.75) mirrors `herb-seed-cards`' compression settings, keeping hand-authored cards' storage footprint consistent with the seed cards' ~36-44KB each rather than whatever size Wikipedia's raw thumbnail happens to be.

## Migration Notes

Not applicable — this only adds new cards via user action or the existing `seedDefaultCards()` one-time seed; no existing data is migrated or transformed.

## References

- Prior work: `context/changes/local-persistence-scaffold/plan.md` (`F-01` — the persistence contract this change builds a UI on top of)
- Prior work: `context/changes/herb-seed-cards/plan.md` (the seed data and `seedDefaultCards()` this change finally wires up)
- PRD refs: FR-001 (navigation), FR-002/FR-003 (create + approve), FR-013 (edit, same flow), FR-014 (delete)
- Architecture decision: `context/foundation/tech-stack.md` (React island), `context/changes/local-persistence-scaffold/plan.md`'s `wrangler.jsonc` rationale (single-page-application routing)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Astro+React scaffold + Wikipedia lookup module

#### Automated

- [x] 1.1 Tests pass — ae182de
- [x] 1.2 Type checking passes — ae182de
- [x] 1.3 Build still succeeds — ae182de

#### Manual

- [x] 1.4 Live lookup smoke-test returns a real image URL — ae182de
- [x] 1.5 Resize helper produces a legible, appropriately-sized image — ae182de

### Phase 2: Menu + card list

#### Automated

- [x] 2.1 Type checking passes
- [x] 2.2 Build still succeeds

#### Manual

- [x] 2.3 Menu shows instead of the Astro scaffold
- [x] 2.4 Create Cards shows all 14 seed cards on first visit
- [x] 2.5 Refresh does not re-seed or duplicate cards
- [x] 2.6 Play Game is disabled; Exit shows the close-tab message

### Phase 3: Create flow

#### Automated

- [ ] 3.1 Type checking passes
- [ ] 3.2 Build still succeeds

#### Manual

- [ ] 3.3 Add a card end-to-end; it appears in the list after approval
- [ ] 3.4 Reject returns to name entry with the name preserved
- [ ] 3.5 No-match name shows a clean not-found state
- [ ] 3.6 New card persists across a refresh

### Phase 4: Edit + delete

#### Automated

- [ ] 4.1 Type checking passes
- [ ] 4.2 Build still succeeds
- [ ] 4.3 Full test suite passes

#### Manual

- [ ] 4.4 Rename-only edit preserves the image
- [ ] 4.5 Rename-with-new-image edit replaces in place (no duplicate)
- [ ] 4.6 Delete confirm/cancel/confirm-yes all behave correctly
