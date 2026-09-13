# Lessons Learned

> Append-only register of recurring rules and patterns. Re-read at start by /10x-frame, /10x-research, /10x-plan, /10x-plan-review, /10x-implement, /10x-impl-review.

## Optional fields on shared data types need a deliberate-omission signal

**Context:** src/lib/storage/index.ts:50-54,71 (createCard's sourceLabel parameter)

**Problem:** Making HerbCard.sourceLabel optional (to support starter cards with no attribution) removed the compile-time guarantee that every createCard caller supplies one. Harmless today (only seed.ts and its test call createCard, both correctly), but a future caller could omit sourceLabel by accident with no compiler warning to catch it.

**Rule:** [fill in — e.g. 'when a shared data field becomes optional to support one caller's legitimate omission, add a test or comment at each OTHER caller confirming its own omission (or inclusion) is intentional, not accidental']

**Applies to:** [fill in — e.g. 'src/lib/storage/* and any future consumer of createCard/updateCard']
