---
bootstrapped_at: 2026-09-10T21:11:10Z
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
| npm package        | create-astro v5.2.4 published 2026-08-24   | fresh    | resolved from `cmd_template` (`npm create astro@latest`) |
| GitHub repo        | not run                                    | n/a      | `docs_url` (`https://docs.astro.build`) is not a GitHub URL |

## Scaffold log

**Resolved invocation**: `npm create astro@latest -- .bootstrap-scaffold --template basics --install --git --yes`
**Strategy**: subdir-then-move
**Exit code**: 0
**Files moved**: 10 top-level entries (`AGENTS.md`, `astro.config.mjs`, `package.json`, `package-lock.json`, `README.md`, `tsconfig.json`, `src/`, `public/`, `.vscode/`, `node_modules/`)
**Conflicts (.scaffold siblings)**: `CLAUDE.md` → `CLAUDE.md.scaffold` (a symlink to `AGENTS.md`; resolves correctly post-move since `AGENTS.md` moved in cleanly)
**.gitignore handling**: append-merged (cwd's `.*.swp` line kept first, scaffold's patterns appended under a `# from astro` separator comment)
**.bootstrap-scaffold cleanup**: deleted (its cloned/initialized `.git/` was dropped before move-up since cwd already has its own git repo; not part of the standard conflict matrix but consistent with the git-clone strategy's own `.git`-drop rule)

## Post-scaffold audit

**Tool**: `npm audit --json`
**Summary**: 0 CRITICAL, 0 HIGH, 0 MODERATE, 0 LOW
**Direct vs transitive**: not applicable — 0 findings total (285 total dependencies: 178 prod, 108 optional, 2 peer, 0 dev)

Clean tree. No findings in any severity tier.

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
- Review `CLAUDE.md.scaffold` (Astro's own generated agent-instructions file, a symlink to its `AGENTS.md`) against your existing `CLAUDE.md` (the 10xDevs course rules file) and decide whether to fold any Astro-specific guidance into your real `CLAUDE.md`.
- The scaffold's own `AGENTS.md` moved in without conflict — review it too, since it now sits alongside your course `CLAUDE.md`.
- Address audit findings per your project's risk tolerance — none were found in this run, but re-run `npm audit` after adding dependencies.
- `deployment_target: cloudflare-pages` and CI/CD choices were recorded as hints but not acted on in v1 — no `wrangler.toml` or GitHub Actions workflow was generated.
