---
bootstrapped_at: 2026-09-10T22:12:54Z
starter_id: astro
starter_name: "Astro"
project_name: herbs-masters-duel
language_family: js
package_manager: npm
cwd_strategy: subdir-then-move
bootstrapper_confidence: verified
phase_3_status: ok
audit_command: "npm audit --json"
---

## Hand-off

```yaml
starter_id: astro
package_manager: npm
project_name: herbs-masters-duel
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: verified
  path_taken: custom
  quality_override: false
  self_check_answers:
    typed: true
    from_official_starter: true
    conventions: true
    docs_current: true
    can_judge_agent: false
  has_auth: false
  has_payments: false
  has_realtime: false
  has_ai: false
  has_background_jobs: false
```

**Why this stack** (verbatim from the hand-off body):

Solo developer shipping a 2-player herb memory game in a 4-day after-hours crunch, with a PRD that explicitly rules out login, server accounts, and cloud sync — everything lives on-device. The recommended default for `(web-app, js)`, 10x-astro-starter, was rejected at the path-fork because it bundles Supabase auth and a hosted database this project doesn't need. Custom-path reasoning surfaced Astro (plain) as the strongest fit: it ships zero JS by default, uses file-based routing conventions, and lets a React island carry the whole interactive game client-side with no backend. It clears all four agent-friendly gates (typed, convention-based, popular in JS training data, well-documented) with verified bootstrapper confidence, so no quality override was needed. Vite+React was considered as an even more minimal option but fails the convention-based gate. Deployment defaults to Cloudflare Pages per the starter; CI runs on GitHub Actions with auto-deploy-on-merge, matching the solo/short-timeline profile.

## Pre-scaffold verification

| Signal             | Value                                     | Severity | Notes                                                  |
| ------------------ | ------------------------------------------ | -------- | ------------------------------------------------------- |
| npm package        | create-astro v5.2.4 published 2026-08-24   | fresh    | resolved from `cmd_template` (`npm create astro@latest`); unchanged from the prior run |
| GitHub repo        | not run                                    | n/a      | `docs_url` (`https://docs.astro.build`) is not a GitHub URL |

## Scaffold log

**Resolved invocation**: `npm create astro@latest -- .bootstrap-scaffold --template basics --install --git --yes`
**Strategy**: subdir-then-move
**Exit code**: 0
**Files moved**: 0 top-level entries (every entry conflicted this run)
**Conflicts (.scaffold siblings)**: `AGENTS.md`, `astro.config.mjs`, `CLAUDE.md`, `package.json`, `package-lock.json`, `README.md`, `tsconfig.json`, `src/`, `public/`, `.vscode/`, `node_modules/` — all sidelined as `.scaffold` siblings, overwriting the (identical) `.scaffold` siblings left by the prior run
**.gitignore handling**: no new lines to append — every pattern from the scaffold's `.gitignore` was already present in cwd's from the prior run's merge
**.bootstrap-scaffold cleanup**: deleted (its initialized `.git/` was dropped before move-up since cwd already has its own git repo)

**Re-run note**: this is the second bootstrap run against this cwd (see `bootstrapped_at` vs. the prior run ~1 hour earlier). The populated-cwd guard fired (cwd already had `package.json` from the first run); the user confirmed "Continue." Since nothing in the active project tree had diverged from a fresh scaffold, every conflicting entry landed as a byte-identical `.scaffold` sibling — including a full duplicate `node_modules.scaffold` (~161 packages), which is redundant disk usage safe to delete manually (see Next steps).

## Post-scaffold audit

**Tool**: `npm audit --json`
**Summary**: 0 CRITICAL, 0 HIGH, 0 MODERATE, 0 LOW
**Direct vs transitive**: not applicable — 0 findings total (285 total dependencies: 178 prod, 108 optional, 2 peer, 0 dev)

Clean tree. No findings in any severity tier. Audit was run against the active (non-`.scaffold`) `node_modules/`.

## Hints recorded but not acted on

| Hint                       | Value                              |
| -------------------------- | ----------------------------------- |
| bootstrapper_confidence    | verified                            |
| quality_override           | false                                |
| path_taken                 | custom                              |
| self_check_answers         | typed: true, from_official_starter: true, conventions: true, docs_current: true, can_judge_agent: false |
| team_size                  | solo                                |
| deployment_target          | cloudflare-pages                    |
| ci_provider                | github-actions                      |
| ci_default_flow            | auto-deploy-on-merge                |
| has_auth                   | false                                |
| has_payments                | false                                |
| has_realtime                | false                                |
| has_ai                      | false                                |
| has_background_jobs         | false                                |

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- This run produced only `.scaffold` siblings (no active files changed) since nothing had diverged from the first run's scaffold. Safe cleanup: `rm -rf node_modules.scaffold package.json.scaffold package-lock.json.scaffold public.scaffold src.scaffold .vscode.scaffold AGENTS.md.scaffold astro.config.mjs.scaffold CLAUDE.md.scaffold README.md.scaffold tsconfig.json.scaffold` once you've confirmed you don't need to diff anything against them.
- Review `CLAUDE.md.scaffold` (Astro's own generated agent-instructions file, a symlink to its `AGENTS.md`) against your existing `CLAUDE.md` (the 10xDevs course rules file) and decide whether to fold any Astro-specific guidance into your real `CLAUDE.md`.
- Address audit findings per your project's risk tolerance — none were found in this run.
- `deployment_target: cloudflare-pages` and CI/CD choices were recorded as hints but not acted on in v1 — no `wrangler.toml` or GitHub Actions workflow was generated.
