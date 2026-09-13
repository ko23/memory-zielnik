# Herb Card Authoring — Plan Brief

> Full plan: `context/changes/herb-card-authoring/plan.md`

## What & Why

Build the project's first real UI: a starting menu and the herb-card authoring flow (create via Wikipedia image lookup + approval, edit, delete). This is `S-01` on the roadmap — the north star's hard prerequisite, since `S-02` (playing the game) needs cards to exist first.

## Starting Point

`F-01` provides a fully tested `localStorage` CRUD contract; `herb-seed-cards` provides 14 seed cards and a `seedDefaultCards()` function left deliberately unwired. No UI exists — the deployed site still shows the stock Astro scaffold, and no React tooling is installed yet, though `tech-stack.md` already decided a React island is the architecture.

## Desired End State

Visiting the site shows a menu (Create Cards / Play Game [disabled] / Exit), auto-seeded with 14 herb cards on first visit. "Create Cards" lets you add a card by name (looked up against Polish Wikipedia, shown for approval before saving), edit an existing card's name and/or image through the same flow, and delete a card with one confirmation step.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Image lookup source | Polish Wikipedia REST API (search then page-summary) | CORS-friendly, no API key, matches the seed images' own provenance; search-first because typed names won't match real title capitalization/diacritics | Plan |
| Search UX | Auto-pick single best match | Matches FR-002's singular phrasing; simplest flow for a kid-friendly UI | Plan |
| On reject | Return to name entry, retry | Rejecting shouldn't be a dead end that restarts the whole action | Plan |
| Edit UI | Reuse the create form, pre-filled | FR-013 literally specifies the same approve/reject flow as create | Plan |
| Delete | Requires a confirm step | Delete is irreversible; edit's precedent (no confirm) doesn't extend to destructive actions | Plan |
| "Play Game" button | Shown, disabled | FR-001's full menu is visible/testable now; no throwaway work when S-02 lands | Plan |
| Testing scope | Pure-logic tests only (lookup module) | No new component-testing tooling; Canvas resize isn't meaningfully testable under happy-dom anyway | Plan |
| Architecture | Single React island, internal screen state | Matches tech-stack.md's decision and F-01's single-page-application deploy config | Plan |

## Scope

**In scope:**
- `@astrojs/react` integration
- `src/lib/wikipedia.ts` (search + summary lookup, tested) and `src/lib/image.ts` (fetch + Canvas resize)
- Menu, card list, create form, edit (reusing the form), delete-with-confirm
- Wiring `seedDefaultCards()` to actually run

**Out of scope:**
- The real "Play Game" screen (`S-02`)
- Image-candidate picker UI
- Component/DOM-rendering tests
- Any change to `F-01`'s or `herb-seed-cards`' existing contracts

## Architecture / Approach

One React island (`GameApp`) mounted from `src/pages/index.astro`, holding `screen: "menu" | "cards"` state. Wikipedia lookup and image encoding are plain, framework-free, tested functions the UI components call — not entangled with React itself.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Astro+React scaffold + lookup module | React integration, tested `lookupHerbImage`, resize helper | Wikipedia CORS behavior can't be verified until a live smoke-test runs |
| 2. Menu + card list | Real menu replaces the scaffold; seed data finally visible | None significant |
| 3. Create flow | Full name→lookup→approve→save path | Reject/retry and no-match states need careful handling |
| 4. Edit + delete | Form reuse for edit; confirm-gated delete | Edit-with-new-image must replace in place, not duplicate |

**Prerequisites:** `F-01` (local-persistence-scaffold) and `herb-seed-cards` — both already implemented.
**Estimated effort:** Not estimated (project convention — agentic execution is non-linear).

## Open Risks & Assumptions

- Wikipedia's REST/search API and `upload.wikimedia.org` CORS behavior is documented as anonymous-fetch-friendly, but hasn't been live-verified in this planning session (no network access here) — Phase 1's first manual step is a canary smoke-test specifically to catch this early.
- FR-001's "Exit" has no clean web-native meaning (browsers can't close a tab via JS); resolved as a friendly close-tab message rather than left ambiguous.

## Success Criteria (Summary)

- A visitor can create, edit, and delete herb cards through Wikipedia-backed lookups, with changes surviving a page refresh.
- The 14 seed cards appear automatically on first visit, without duplicating on subsequent visits.
- `npm run test` and `npm run build` both pass throughout.
