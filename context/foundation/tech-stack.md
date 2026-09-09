---
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
---

## Why this stack

Solo developer shipping a 2-player herb memory game in a 4-day after-hours crunch, with a PRD that explicitly rules out login, server accounts, and cloud sync — everything lives on-device. The recommended default for `(web-app, js)`, 10x-astro-starter, was rejected at the path-fork because it bundles Supabase auth and a hosted database this project doesn't need. Custom-path reasoning surfaced Astro (plain) as the strongest fit: it ships zero JS by default, uses file-based routing conventions, and lets a React island carry the whole interactive game client-side with no backend. It clears all four agent-friendly gates (typed, convention-based, popular in JS training data, well-documented) with verified bootstrapper confidence, so no quality override was needed. Vite+React was considered as an even more minimal option but fails the convention-based gate. Deployment defaults to Cloudflare Pages per the starter; CI runs on GitHub Actions with auto-deploy-on-merge, matching the solo/short-timeline profile.
