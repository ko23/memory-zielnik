# MVP Check

Run the 10xBuilder MVP-readiness analysis against this repository and save a timestamped report, so the same criteria can be re-run over time as a progress tracker.

## Source of truth for the criteria

The analysis rules live in `.claude/prompts/mvp-check.md` (fetched via `npx @przeprogramowani/10x-cli get m0l0`). **Read that file fresh at the start of every run** — do not hardcode a copy of the criteria here. If the file is missing, tell the user to run `npx @przeprogramowani/10x-cli@latest get m0l0` first, then stop.

## Procedure

1. Read `.claude/prompts/mvp-check.md` in full.
2. Follow its instructions exactly: infer the project's domain/shape from the repo's actual files (don't assume a web app), then judge each of the 5 criteria (CRUD, business logic, tests-addressing-a-risk, authentication-tied-to-a-user, documentation) against real evidence found in the repo. Do not evaluate visual design, styling, or deployment — the prompt says these are out of scope.
3. Base every ✅ on evidence actually located in the repo (file paths, function names). If you can't find evidence, mark ❌ — the bar is "minimal", not "more than asked".
4. Produce the report in the exact output format the prompt specifies: Checklist (✅/❌ per criterion), Project Status (X/5 as a percentage), and Priority Improvements for each unmet criterion — tailored to this project's actual type and stack, not generic advice.
5. **Always write the report in English**, regardless of the language the user asked in.
6. Print the full report to the conversation.
7. Save the same report to `mvp-checker-reports/mvp-check-<YYYY-MM-DD_HH-MM-SS>.md` (create the `mvp-checker-reports/` directory if it doesn't exist). Use `date +"%Y-%m-%d_%H-%M-%S"` for the timestamp so multiple runs on the same day never collide. Never overwrite a prior report — each run gets its own timestamped file.
8. If the current result is identical to the most recent prior report in `mvp-checker-reports/` (same checklist, same status), say so explicitly in the report's closing line (e.g. "No change from the previous report — no application code has changed since"), so the file's value as a progress tracker is clear at a glance.

## Notes

- This skill only reads the repo and the prompt file, and writes exactly one new file per run (plus a chat message). It does not modify project code or other documentation.
- If `.claude/prompts/mvp-check.md` has been updated (e.g. by a newer `10x-cli` lesson fetch) since the last run, the new criteria apply automatically — this skill never drifts from the canonical prompt.
