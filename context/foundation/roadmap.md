---
project: "Herbs Masters Duel"
version: 1
status: draft
created: 2026-09-13
updated: 2026-09-14
prd_version: 2
main_goal: speed
top_blocker: time
milestone_id: first-playable-duel
milestone_seq: 1
milestone_status: open
---

# Roadmap: Herbs Masters Duel

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline.
> Edit-in-place; archive when superseded.
> Slices below are listed in dependency order. The "At a glance" table is the index.

## Milestone

**M-1: First Playable Duel — full MVP loop** — Status: open

- **Intent:** Ship the complete MVP loop the PRD defines as its single Primary Success Criterion — a user can author herb cards (looked-up image, human-approved) and two players can play a full memory-matching game to completion, with a winner/tie and score shown.
- **Source materials:** `context/foundation/prd.md` (v1)
- **Done when:** every F-NN and S-NN below is `done`.
- **Scope anchors:** FR-001–FR-014, US-01

## Vision recap

Parents teaching kids to recognize and use herbs have no good way to make the knowledge stick — a one-off plant-ID photo lookup answers once and leaves no lasting memory. This project replaces that lookup with a name+image matching game: repeated recall under uncertainty is what builds retention, especially for kids who need play rather than lookup to hold their attention.

## North star

**S-02: User can set up and play a full 2-player memory-matching game to completion, with a winner (or tie) and score shown.** This matches the PRD's single Primary Success Criterion and its Business Logic section directly: the memory mechanic itself — flip, recall, match/mismatch — is what produces retention, so playing a full game to completion is what actually validates the core hypothesis (that this format makes herb recognition stick).

> "North star" here means the smallest end-to-end slice worth proving first — not necessarily the flashiest one, but the one whose success or failure tells you the most about whether the rest of the plan holds.

## At a glance

| ID   | Change ID                | Outcome (user can …)                                                                 | Prerequisites | PRD refs                          | Status   |
| ---- | ------------------------ | ------------------------------------------------------------------------------------ | -------------- | ---------------------------------- | -------- |
| F-01 | local-persistence-scaffold | (foundation) local save/load for the herb-card deck and player profile/scores        | —               | NFR (no data loss), Success Criteria (Secondary) | in-progress |
| S-01 | herb-card-authoring       | create, approve/reject, edit, and delete herb cards with a looked-up image + source label | F-01        | FR-001, FR-002, FR-003, FR-013, FR-014 | in-progress |
| S-02 | two-player-memory-match   | set up and play a full 2-player memory-matching game to completion, scores remembered | S-01, F-01      | US-01, FR-004–FR-012               | in-progress |

## Baseline

What's already in place in the codebase as of `2026-09-13` (auto-inspected + user-confirmed).
Foundations below assume these are accurate and do NOT re-scaffold them.

- **Frontend:** partial — Astro "basics" scaffold only (`src/pages/index.astro`, `src/components/Welcome.astro`, `src/layouts/Layout.astro`); no game or card-authoring UI exists yet.
- **Backend / API:** absent — by design; PRD requires zero backend (local-only, no login/server accounts).
- **Data:** absent — no persistence code found in `src/` (no localStorage/IndexedDB usage); PRD requires cards and profile/scores to survive refresh/restart.
- **Auth:** absent — intentionally, per PRD Access Control (flat local profile, no login) and `tech-stack.md` (`has_auth: false`). Not a gap.
- **Deploy / infra:** partial — Cloudflare Workers (static assets) deploy pipeline stood up and verified today, live at `https://herbs-masters-duel.ko23.workers.dev` (`wrangler.jsonc` + `context/deployment/deploy-plan.md`); GitHub Actions auto-deploy-on-merge (named in `tech-stack.md`) not yet wired — no `.github/workflows` exists.
- **Observability:** absent — no app-level logging/error-tracking; `wrangler tail` available manually but nothing wired in.

## Foundations

### F-01: Local persistence scaffold

- **Outcome:** (foundation) a minimal save/load contract exists (e.g. wrapping `localStorage` or IndexedDB) that can create, read, update, and delete herb-card deck entries and persist player profile/score records across a browser refresh or restart.
- **Change ID:** local-persistence-scaffold
- **PRD refs:** NFR "Authored herb cards and local profile data (progress, scores) survive a browser refresh or restart without loss"; Success Criteria (Secondary) "Scores are tracked across sessions"; FR-014 (delete requires a corresponding storage primitive)
- **Unlocks:** S-01 (deck must survive refresh), S-02 (player names/scores tracked across sessions)
- **Prerequisites:** —
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Building one shared persistence contract before either slice means both S-01 and S-02 rely on it instead of inventing ad hoc storage twice — low risk, well-understood browser APIs, minimal scope.
- **Status:** in-progress

## Slices

### S-01: Herb card authoring with image lookup and approval

- **Outcome:** user can create a herb card (name + looked-up image + source/species label), approve or reject the looked-up image before it saves, edit an existing card's name/image through the same approve/reject flow, and delete an existing card from the deck — reached from the starting menu.
- **Change ID:** herb-card-authoring
- **PRD refs:** FR-001, FR-002, FR-003, FR-013, FR-014
- **Prerequisites:** F-01
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** — (resolved during `/10x-plan`: Polish Wikipedia REST API's page-summary endpoint, chosen for CORS-friendly anonymous fetch and consistency with `herb-seed-cards`' image provenance — see `context/changes/herb-card-authoring/plan.md`)
- **Risk:** Sequenced first because S-02 (the north star) depends on it — cards must exist before a game can be played — and it carries the riskiest technical unknown in the whole product (image-lookup accuracy); better to hit that early regardless of which slice validates the core hypothesis.
- **Status:** in-progress

### S-02: Two-player memory match to completion

- **Outcome:** user can enter both player names, choose who goes first, pick a tile-pair count (10–24, capped at deck size), and play a full memory-matching game — flipping tiles, keeping the turn on a match, passing it on a mismatch — until a winner (or tie) and score are shown, with scores remembered across sessions.
- **Change ID:** two-player-memory-match
- **PRD refs:** US-01, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012
- **Prerequisites:** S-01 (needs at least 10 herb cards to exist), F-01 (cross-session score tracking)
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** This is the north star — the PRD's single Primary Success Criterion and the flow that actually tests whether the memory mechanic produces retention. Built as one continuous flow by design — setup, turn mechanics, and the end screen are one testable session per the PRD's own single User Story (US-01); splitting it further would produce pieces that aren't independently meaningful to play or verify.
- **Status:** in-progress

## Backlog Handoff

| Roadmap ID | Change ID                | Suggested issue title                                          | Ready for `/10x-plan` | Notes                    |
| ---------- | ------------------------- | ---------------------------------------------------------------- | ---------------------- | ------------------------ |
| F-01       | local-persistence-scaffold | Add local persistence scaffold for herb-card deck and player scores | yes                     | —                         |
| S-01       | herb-card-authoring        | Herb card authoring: create, approve/reject image, edit, delete    | no                      | Waiting on F-01           |
| S-02       | two-player-memory-match    | Two-player memory match: setup through winner/tie screen           | yes                     | —                         |

## Open Roadmap Questions

None — the PRD's own `## Open Questions` is empty, and no cross-cutting question surfaced during decomposition. S-01's image-source choice is slice-scoped (see its Unknowns), not roadmap-wide.

## Parked

- **No custom plant-identification / computer-vision** — Why parked: PRD `## Non-Goals`; image lookup + human approval is deliberately enough.
- **No more than 2 local players** — Why parked: PRD `## Non-Goals`; strictly one device, two people taking turns.
- **No cloud sync / cross-device play** — Why parked: PRD `## Non-Goals`; progress and decks never leave the device.
- **No content beyond herbs** — Why parked: PRD `## Non-Goals`; herbs only, to keep the domain rule focused.
- **No user authentication / login accounts** — Why parked: PRD `## Non-Goals`; reconsidered and explicitly declined again on 2026-09-12 — accounts would require a backend this project deliberately avoids.
- **Adaptive / spaced-repetition difficulty** — Why parked: `shape-notes.md`'s "Forward: technical-roadmap" — explicitly deferred as a later-version candidate, not part of this milestone.
- **GitHub Actions auto-deploy-on-merge CI wiring** — Why parked: `tech-stack.md` names this as the intended flow, but no slice in this milestone depends on it; the manually-verified `wrangler deploy` pipeline is sufficient for MVP verification, and wiring CI now would spend time this crunch can't spare.

## Milestone History

(none yet — first milestone)

## Done

(none yet)
