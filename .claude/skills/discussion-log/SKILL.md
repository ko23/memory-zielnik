# Discussion Log

Append a structured record of the current turn — the user's prompt, any question(s) asked, the answer(s) given, the resulting suggestion or action, and the assistant's actual closing reply — to this project's running discussion log at `discussion-log/<YYYY-MM-DD>.md`.

This is a durable audit trail of decisions made on this project, not a draft document. It is **append-only**: existing entries are never edited, reordered, or removed, even to fix a typo.

## When to use

After every turn in a working session on this project that involves a user prompt — whether or not it included an `AskUserQuestion` round or produced a file change. Log trivial turns too (with just a `Prompt` field); the point is continuity, not curation.

## Procedure

1. **Resolve today's file.** Run `date +%Y-%m-%d` and target `discussion-log/<date>.md`. Create the `discussion-log/` directory if it doesn't exist yet.
2. **Determine the next turn number.**
   - If the file doesn't exist, create it with the header below and start at Turn 1.
   - If it exists, find the highest existing `## [HH:MM] Turn N` heading (e.g. `grep -oE '^## \[[0-9:]+\] Turn [0-9]+' <file> | tail -1`) and use `N+1`. Do not read or rewrite the rest of the file — only append.
   - If the file has pre-existing content from before this skill existed (e.g. a narrative summary with no turn numbers), leave it untouched and start numbering at Turn 1 for the first skill-managed entry, appended after that content.
3. **Compose the entry** using the template below, with the current time from `date +%H:%M`.
4. **Append** the entry to the end of the file in a single write (do not touch anything above it).

### New-file header

```markdown
# Discussion Log — <YYYY-MM-DD>

Append-only log of prompts, questions, answers, and suggestions from working sessions on this project. New entries are appended below; existing entries are never edited or removed.

---
```

### Entry template

```markdown
## [HH:MM] Turn N

**Prompt:** <the user's message this turn, verbatim or lightly trimmed for length — note "(trimmed)" if shortened>

**Question(s) asked:**
- <question header>: "<question text>" — options: <option labels, comma-separated>

**Answer(s):**
- <question header>: <the option(s) selected, or the free-text answer>

**Suggestion / Result:** <concrete outcome — files changed, decisions recorded, values set, or the assistant's recommendation. Name specifics, not a vague summary.>

**Assistant reply:** <the actual closing chat message shown to the user this turn, verbatim or lightly trimmed for length — note "(trimmed)" if shortened>
```

## Field rules

- **Omit a field entirely** (not as an empty placeholder) if it didn't apply this turn — e.g. no `Question(s) asked` / `Answer(s)` fields if no `AskUserQuestion` round happened; no `Suggestion / Result` if the turn was purely a clarifying question with nothing decided yet.
- Multi-question turns list every question/answer pair as its own bullet under the respective field, in the order asked.
- Keep `Prompt` in the user's own words. Only trim for extreme length (e.g. a pasted file or long tool output), and say so.
- `Suggestion / Result` should be concrete: name the files touched, the value changed, or the decision recorded — not "made some updates."
- `Assistant reply` captures the actual final message displayed to the user this turn (e.g. "Done — three things happened: ..."), not a re-paraphrase of `Suggestion / Result`. If the reply was long (a full report, a large diff summary), reproduce it in full when reasonable; only trim for extreme length, and say so. If the closing reply and `Suggestion / Result` would be near-duplicates for a short/simple turn, it's fine for them to overlap — don't force artificial distinction.

## Guardrails

- Never overwrite the file — always append.
- Never edit a previously written entry, including this skill's own past entries or any pre-existing content in the file.
- One file per calendar day. Turn numbers restart at 1 in each new day's file (and, per the note above, at the first skill-managed entry in a file that has older non-turn-numbered content).
- This skill only touches `discussion-log/<date>.md`. It does not summarize into any other file (e.g. `context/foundation/lessons.md` is a different, unrelated log owned by `/10x-lesson`).
