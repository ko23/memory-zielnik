---
project: "Herb Masters Duel"
context_type: greenfield
created: 2026-09-09
updated: 2026-09-09
product_type: web-app
target_scale:
  users: medium
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 1
  hard_deadline: 2026-09-13
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: "pain category"
      decision: "missing capability + workflow friction + decision paralysis + data trapped somewhere"
    - topic: "insight"
      decision: "ID apps answer once; games teach through repeated exposure — especially needed for kids"
    - topic: "persona scope"
      decision: "broader parent+child pattern, not limited to author's household; parent and child play together, turn-taking; both can author content"
    - topic: "access model"
      decision: "local profile, on-device only, no login"
    - topic: "role separation"
      decision: "flat — no distinct roles between parent and child"
    - topic: "MVP flow / scope-cost"
      decision: "AI image generation scoped down to image lookup (e.g. Wikipedia) + user approval; 3-week after-hours timeline confirmed doable"
  frs_drafted: 12
  quality_check_status: accepted
---

# Shape Notes

## Seed idea (verbatim)

> Herbs self-learning through memory name+image game

## Vision & Problem Statement

Parents trying to teach their kids to recognize and use herbs have no good way to make the knowledge stick. When they encounter a herb — in the garden, kitchen, or wild — they resort to taking a photo and running it through a plant-identification search, which is slow, sometimes uncertain, and even when it succeeds, leaves no lasting memory: the next time they see the same herb, they still don't know it by heart, and they still don't know how or why to use it.

Plant-identification apps solve the wrong problem: they optimize for a single correct answer, not the repeated exposure that builds memory. A name+image matching game format is what makes identification stick — particularly for kids, who need play rather than lookup to hold their attention long enough to learn.

## User & Persona

**Primary persona**: A parent teaching their kid(s) to recognize and use herbs (not limited to the author's own household — the design targets the broader parent+child pattern). Parent and child play together at one device, taking turns tapping/matching cards; either of them can also author or edit the game's herb content (names and images). The parent reaches for this product when they want a structured, repeatable, playful way to build lasting herb-recognition knowledge with their child, instead of a one-off photo-ID lookup each time a herb comes up.

## Access Control

Local profile; no login, no server account. Progress and any authored/edited herb content (names, images) live on-device only. Flat model — no distinct roles: parent and child are equivalent within a profile, and either can play or author/edit content.

## Success Criteria

### Primary
- A user can create herb cards (herb name + a looked-up candidate image from a public reference source, approved or rejected by the user) and two players can play a full matching game to completion — flipping tiles until all pairs are collected — with a winner and score shown at the end.

### Secondary
- Scores are tracked across sessions (remembered per player name, beyond a single game).

### Guardrails
- No inappropriate images slip through the approval step — since images are looked up rather than curated, the approval step must reliably let users reject wrong/unsafe images before they enter the deck.
- Kid-appropriate UX — interactions and text stay simple/friendly enough for a child to follow without adult help mid-game.
- No data loss on-device — authored herb cards and local profile data survive browser refreshes/restarts.
- Fast enough to not lose kids' attention — card flips and image lookups feel instant.

## Timeline acknowledgment

Acknowledged on 2026-09-09: full FR set (navigation, card creation with image lookup + approval, game setup, gameplay, end screen) is targeted for a 4-day after-hours crunch (hard deadline 2026-09-13), well under the initially-discussed 3-week estimate. The user explicitly accepted the sustained-effort cost of this compressed timeline ("it's crunching time, baby") after the conflict between the original 3-week estimate and the hard deadline was surfaced.

## Functional Requirements

### Navigation
- FR-001: User can navigate the starting menu to Create Cards, Play Game, or Exit, and return to the starting menu after each. Priority: must-have
  > Socrates: No counter-argument raised; stands as written.

### Card creation
- FR-002: User can create a herb card with a name, a looked-up image from a public reference source, and the image's source/species label shown alongside it for cross-checking. Priority: must-have
  > Socrates: Counter-argument considered: "an automated lookup could return the wrong plant, defeating the point of teaching correct herbs." Resolution: revised to also display the image's source/species label, giving the approval step in FR-003 something concrete to check against.
- FR-003: User can approve or reject the looked-up image before it's saved to a herb card. Priority: must-have
  > Socrates: Counter-argument considered: "a naive approval by any user (including a child) doesn't guarantee correctness." Resolution: paired with FR-002's source/species label — approval remains best-effort, not a correctness guarantee, but now has a name to cross-check against rather than a bare image.

### Game setup
- FR-004: Player can enter their name before the game begins. Priority: must-have
  > Socrates: Counter-argument considered: "typing is a barrier for young kids, and names add no value for a fixed 2-player household." Resolution: kept as written — writing a name is good for engagement, and it's a worthwhile skill for young kids to practice.
- FR-005: Player can choose the number of tile pairs for a game — minimum 10, maximum 24, and never exceeding the number of herb cards available in the deck. Priority: must-have
  > Socrates: Counter-argument considered: "choosing a count could exceed the number of available herb cards." Resolution: revised to cap the count at both the deck size and a hard maximum of 24 — above 24 the board is hard to play and hard to fit on screen.

### Gameplay
- FR-006: Player can select 2 tiles per turn; on a match, they keep the turn and select again. Priority: must-have
  > Socrates: Counter-argument considered: "a player with a strong memory could dominate the whole game, leaving the other player with little to do." Resolution: kept as written — this is the standard classic Memory-game rule.
- FR-007: When a player's two selected tiles don't match, their turn ends and play passes to the next player. Priority: must-have
  > Socrates: Counter-argument considered: "could frustrate a much-younger sibling repeatedly losing turns to an adult with better memory." Resolution: kept as written — it's good for memory training.
- FR-008: When a player's two selected tiles match, both tiles are removed from the board and credited to that player's collected pairs. Priority: must-have
  > Socrates: No counter-argument raised; stands as written.
- FR-009: When all tile pairs have been collected, the game ends and a winner (with score) is shown. Priority: must-have
  > Socrates: No counter-argument raised; stands as written.
- FR-010: When a player's two selected tiles don't match, both tiles flip back face-down before the next player's turn begins. Priority: must-have
  > Socrates: Counter-argument considered: "could be too punishing for very young kids, who might need a peek/hint instead of tiles vanishing instantly." Resolution: kept as written — it's good for memory training.
- FR-011: Before the game begins, players are asked to choose who goes first. Priority: must-have
  > Socrates: Counter-argument considered: "letting players 'choose' who goes first could cause sibling friction/arguing instead of a quick setup step." Resolution: kept as written; no counter-argument accepted.
- FR-012: When both players end the game with the same number of collected pairs, the end screen declares a tie rather than a winner. Priority: must-have
  > Socrates: Counter-argument considered: "a flat tie could feel anticlimactic for kids after a full game." Resolution: kept as written; no counter-argument accepted.

## User Stories

### US-01: Two players start and play a full memory game

- **Given** the starting menu is shown
- **When** both players choose "Play Game"
- **Then** they enter their names and choose the number of tile pairs (minimum 10), and the game board is shown to begin play

#### Acceptance Criteria
- A player must set their name; if they try to skip or leave it blank, they are prompted again until a name is set.
- The tile pair count cannot be set below 10 or above 24, and cannot exceed the number of herb cards currently in the deck.

## Business Logic

The game teaches herb names and appearances by repeatedly forcing recall under uncertainty: each herb card appears twice among a shuffled, face-down set of tiles, and a player only clears a pair by correctly remembering where its match is hidden.

The rule consumes the set of herb cards the user has authored (name + looked-up image) and the tile-pair count chosen at setup, which together determine the shuffled board. Its output is a completed board where both players have repeatedly seen and recalled each herb's name-image pairing — reinforced because remembering earlier flips is the only way to find a match later. The user encounters this rule directly during gameplay: flipping two tiles either rewards a correct memory (match, tiles cleared, turn continues) or costs the turn (mismatch, tiles flip back, memory demand persists into the next attempt) — the same mechanic that produces "fun" is what produces retention.

No adaptive difficulty for the MVP — the board shuffle is uniform, with no per-card tracking of what a player struggles with. An adaptive/spaced-repetition version (herbs a player mismatches more often resurface more frequently) was considered and deliberately deferred; see `## Forward: technical-roadmap`.

## Non-Functional Requirements

- The product is fully usable in a modern desktop web browser, with no native app installation required.
- A tile flip responds within 100 ms of the player's tap/click; image lookups during card creation may take longer since that's a separate, non-gameplay flow.
- Authored herb cards and local profile data (progress, scores) survive a browser refresh or restart without loss.
- The image-approval step reliably lets a user reject a wrong or unsafe looked-up image before it enters the deck.

## Non-Goals

- No custom plant-identification / computer-vision — the app never attempts to auto-identify a herb from a user's own photo; image lookup (and human approval) is enough.
- No more than 2 local players — no support for 3+ players or online/remote multiplayer; strictly one device, two people taking turns.
- No cloud sync / cross-device play — progress and decks never leave the device, consistent with the local-profile access model.
- No content beyond herbs — no other plant categories, animals, or general trivia; herbs only, to keep the domain rule focused.

## Forward: tech-stack

- Card creation's image lookup was discussed using Wikipedia as an example public reference source. The PRD generalizes this to "a public reference source" to stay vendor-neutral — the actual data source/API is a downstream tech-stack-selection decision.

## Forward: technical-roadmap

- Adaptive/spaced-repetition difficulty (herbs a player mismatches more often resurface more frequently) was considered during Business Logic shaping and deliberately deferred out of MVP scope — a candidate for a later version, not part of this PRD.
