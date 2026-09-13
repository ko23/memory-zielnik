---
project: "Herbs Masters Duel"
created: 2026-09-13
---

# Test Plan

Named risks this project's automated tests address, and the test(s) that cover each. New risks are appended here as later slices add their own test coverage — this file doesn't get rewritten per change, only extended.

## Risks

### Risk 1: Corrupted or invalid stored data must not crash the app

**Statement:** A corrupted or invalid stored blob in `localStorage` — bad JSON, or an envelope with an unrecognized `schemaVersion` — must not crash the app on load. It must reset to an empty default instead, so the user can keep playing rather than seeing a broken page.

**Why this risk matters:** `localStorage` is user/browser-controlled state outside the app's control (manual edits via devtools, a browser crash mid-write, or a future schema change reading old data). Since the deck and player history are the entire data layer for this app (no backend to fall back on), an unhandled parse failure here would be a hard crash with no recovery path.

**Covered by:** `src/lib/storage/adapter.test.ts` — seeds `localStorage` with invalid JSON, and separately with a validly-shaped envelope carrying the wrong `schemaVersion`, and asserts `readEnvelope` returns the supplied default in both cases rather than throwing.

### Risk 2: A storage write failure must not crash card creation or block play

**Statement:** A `localStorage` write failure (quota exceeded, private-browsing restrictions) must not crash card creation or block play. The operation must fail soft, leaving the app usable in-memory for that session.

**Why this risk matters:** Base64-cached images (`src/lib/storage`'s chosen approach for herb-card images) inflate storage size by roughly a third over raw bytes, making quota-exceeded a real possibility at this app's scale, not just a theoretical private-browsing edge case. A kids' game that crashes or blocks play over a non-critical persistence guarantee fails the PRD's "kid-appropriate UX" guardrail.

**Covered by:** `src/lib/storage/adapter.test.ts` — mocks `localStorage.setItem` to throw (simulating quota exceeded), and asserts `writeEnvelope` returns `{ ok: false }` rather than throwing.
