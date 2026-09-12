---
project: herbs-masters-duel
researched_at: 2026-09-12
recommended_platform: Cloudflare (Workers with static assets)
runner_up: Vercel
context_type: mvp
tech_stack:
  language: TypeScript/JavaScript
  framework: Astro (static output, "basics" template)
  runtime: npm
---

## Recommendation

**Deploy on Cloudflare — specifically Workers with static assets, not classic Pages.**

Cloudflare cleared all five agent-friendly criteria (CLI-first via Wrangler, fully managed, `llms.txt`-published docs, deterministic deploy/rollback, GA first-party MCP/Claude Code integration), and the developer interview confirmed existing Cloudflare familiarity plus a cost-minimization priority — static asset requests are unmetered and free regardless of volume, matching this project's zero-backend, local-only design perfectly. The one adjustment from the stack pick: `tech-stack.md` names `cloudflare-pages` as the deployment target, but Cloudflare's own current direction steers new static-site projects to Workers-with-static-assets instead (classic Pages is GA but in maintenance mode) — the anti-bias cross-check surfaced this, and it should be corrected at bootstrap time rather than migrated later.

## Platform Comparison

| Platform | CLI-first | Managed/Serverless | Agent-readable docs | Stable deploy API | MCP/Integration | Total |
|---|---|---|---|---|---|---|
| Cloudflare | Pass | Pass | Pass | Pass | Pass | 5 Pass |
| Vercel | Pass | Pass | Pass | Pass | Partial | 4 Pass, 1 Partial |
| Netlify | Pass | Pass | Pass | Pass | Partial | 4 Pass, 1 Partial |
| Railway | Pass | Partial | Pass | Pass | Pass | 4 Pass, 1 Partial |
| Render | Partial | Pass | Fail | Pass | Pass | 3 Pass, 1 Partial, 1 Fail |
| Fly.io | Partial | Partial | Pass | Partial | Partial | 1 Pass, 4 Partial |

**Cloudflare** — Wrangler deploys, tails logs, and rolls back (Workers-native, last 10 versions) in single commands; static requests are unmetered/free; `llms.txt` published for both Pages and Workers; first-party MCP server and a documented Claude Code integration, both GA. Only soft spot: rollback on classic Pages itself (as opposed to Workers) is dashboard-driven, not CLI-native — resolved by deploying via Workers-assets instead.

**Vercel** — Zero-config static Astro deploys; `vercel`/`vercel rollback`/`vercel logs` all CLI; official `llms.txt`/`llms-full.txt`. MCP integration (`mcp.vercel.com`) is real but newer/less battle-tested than Cloudflare's, scored Partial. Hobby plan prohibits commercial use (not a concern for a personal/family project) and rollback is limited to the immediately-previous deployment only.

**Netlify** — Same zero-config static fit as Vercel; `netlify deploy`/`netlify logs` (the latter GA since 2026-05) are solid, but there's no dedicated rollback subcommand (redeploy a prior build via CLI/UI instead). MCP server exists and is actively promoted but has no confirmed GA label, scored Partial. Its post-Sept-2025 credit-based free tier (300 credits/mo, ~15GB bandwidth) is meaningfully smaller than Vercel's and pauses the whole team's sites on breach — a real constraint even at this project's low traffic.

**Railway** — Strong CLI (`railway up`/`logs`/`redeploy`) and a GA official MCP server, but it's a container-based PaaS: hosting a purely static site here means paying for an always-on container (Managed/Serverless scored Partial) — no permanent free tier, realistically $5–10/mo minimum even at near-zero traffic. Directly conflicts with the interview's cost-minimization answer for a project with zero technical need for a running server.

**Render** — Has a dedicated, genuinely free, always-on Static Sites product (no spin-down, unlike its Web Services) — architecturally the right fit. But no public docs-source repo or `llms.txt` was found; docs live only as rendered HTML, scoring a Fail on agent-readable docs. Official MCP server (GA, Aug 2025) is a strength.

**Fly.io** — The weakest fit: fundamentally a container/microVM platform, so serving a static site means maintaining a Dockerfile and running an always-on nginx container — real overkill for zero backend needs. No dedicated rollback command (manual multi-step via `fly releases` + `fly deploy --image`). No free tier since Oct 2024 (~$5/mo floor). MCP server exists but is explicitly beta/early-stage.

### Shortlisted Platforms

#### 1. Cloudflare (Recommended)

Clears all five criteria, matches stated platform familiarity, and static hosting is genuinely free at any traffic level this project will see. The maintenance-mode status of classic Pages is a real but addressable risk — deploy via Workers-with-static-assets from the start.

#### 2. Vercel

The strongest alternative if Cloudflare's platform-direction churn is unwelcome. Zero-config, generous free tier, deterministic CLI deploy/rollback/logs. Gap vs. the recommendation: MCP integration is newer and less proven, and Hobby-tier rollback only reaches one deployment back.

#### 3. Netlify

Comparable static-hosting fit to Vercel with equally solid CLI tooling, but the post-2025 credit-based free tier is a real constraint (smaller effective bandwidth allowance, and a breach pauses the whole team's sites rather than just this one). Gap vs. the recommendation: same MCP-maturity caveat as Vercel, plus the tighter free tier.

## Anti-Bias Cross-Check: Cloudflare

### Devil's Advocate — Weaknesses

1. **Pages is in maintenance mode.** `tech-stack.md` names `cloudflare-pages` as the deployment target, but Cloudflare is steering all new investment (Dynamic Workers, Sandbox SDK, enhanced static-asset handling) to "Workers + static assets" instead — building on classic Pages means starting on the de-prioritized path.
2. **Free-tier ceiling shifts if scope ever grows.** Static requests are unmetered today, but the moment any dynamic Worker logic is added (e.g. a future shared leaderboard), the free plan caps at 100k requests/**day** — a much tighter ceiling than the current zero-backend design suggests.
3. **Routing edge cases differ between Pages and Workers-assets** — trailing slashes, `_redirects`/`_headers` behavior, and 404 handling aren't identical, so a config that works today could behave differently on a future migration.
4. **Cloudflare-specific terminology (Wrangler config, KV/D1/R2 bindings) has a steeper learning curve than a zero-config static host** — for a solo dev on a short timeline, an unfamiliar Wrangler quirk costs time a Vercel/Netlify deploy wouldn't.
5. **No CLI-native rollback for classic Pages** — dashboard-driven or a manual redeploy of a prior commit, weaker than the "one CLI call" ideal despite the overall Pass score. (Resolved by using Workers-assets, which has native `wrangler rollback`.)

### Pre-Mortem — How This Could Fail

The team deployed the herb-matching game on Cloudflare Pages, picked for existing familiarity and cost. Early on, everything worked — the free tier handled the family's traffic easily. Six months later, wanting a shared leaderboard, the developer added a small Worker function to sync scores across devices — quietly reversing the PRD's original no-backend decision, and moving the project off the pure-static path Cloudflare itself now steers people away from. Migrating from classic Pages to Cloudflare's recommended Workers-with-static-assets model turned into an afternoon of debugging subtly different routing behavior — trailing slashes and a `_redirects` file that worked differently under the new model. Worse, the free Workers tier's 100k-requests-per-day cap (once dynamic logic existed) was closer than expected once a few relatives shared the link. A quick feature add became a week of config archaeology, because the "temporary" static deployment had quietly become a foundation nobody revisited.

### Unknown Unknowns

- Cloudflare now recommends new static sites start on "Workers with static assets," not classic Pages — but most tutorials (and `tech-stack.md`) still say "Pages." Following older docs risks building on the path Cloudflare itself is de-emphasizing.
- `wrangler.toml`/`wrangler.jsonc` config shape has changed across major Wrangler versions — a command from an older blog post may reference a deprecated format.
- Cloudflare's build system pins the Node version via its own dashboard setting, separate from `package.json`'s `engines` field — a mismatch here can break CI in a way that doesn't obviously point at the real cause.
- The `AGENTS.md` `astro dev --background` workflow has no bearing on the deployed build — Cloudflare's build sandbox handles env vars differently than local dev once (if ever) an SSR adapter is added.
- "Unlimited free static requests" applies only to true static assets — accidentally adding the `@astrojs/cloudflare` SSR adapter (thinking it's needed) silently switches billing/behavior from unmetered static to metered Worker invocations.

**User decision**: Proceed with Cloudflare, risks noted — recorded in the risk register below. No platform swap.

## Operational Story

- **Preview deploys**: Every git branch/PR pushed to a Workers-with-static-assets project gets an automatic preview URL (`<branch>.<project>.workers.dev` or equivalent) via Cloudflare's Git integration — no extra config needed for a solo repo; no fork-PR restriction applies since there's no external-contributor scenario here.
- **Secrets**: This project has no server-side secrets today (no backend, no API keys) — if any are added later (e.g. an image-lookup API key for FR-002), they'd live in Wrangler Secrets (`wrangler secret put`), readable only at runtime by the Worker, never checked into the repo.
- **Rollback**: `wrangler rollback` reverts to any of the 10 most recent deployed versions in one command — deterministic, no data-migration caveats since there's no database.
- **Approval**: Routine deploys (merge to main → auto-deploy per `tech-stack.md`'s `ci_default_flow: auto-deploy-on-merge`) can run unattended. A human should approve: the one-time switch from Pages to Workers-assets at initial setup, and any future decision to add a backend/Worker logic (since that's a PRD-scope change, not just an infra change).
- **Logs**: `wrangler tail` streams live production logs from the terminal; no dashboard needed for read-only observability.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| Bootstrapping on classic Cloudflare Pages instead of Workers-with-static-assets, building on the de-prioritized path | Devil's advocate | M | M | At deploy setup, explicitly choose "Workers + static assets" in the Cloudflare dashboard/Wrangler config, not the legacy Pages project type |
| Free-tier request ceiling (100k/day) becomes relevant if a backend is added later, contradicting current zero-backend assumption | Devil's advocate / Pre-mortem | L | M | Treat any future Worker/backend addition as a PRD-scope change requiring explicit sign-off (already a Hard Rule in `AGENTS.md`), not a silent infra tweak |
| Routing behavior (trailing slashes, `_redirects`) differs between Pages and Workers-assets, causing subtle bugs on migration | Devil's advocate / Unknown unknowns | L | L | Test routing (direct-load every route, refresh on a nested path) after initial deploy, before relying on it |
| Wrangler config format drift across versions — a copied command references a deprecated `wrangler.toml`/`wrangler.jsonc` shape | Unknown unknowns | M | L | Always run `wrangler --version` and consult the version-matched docs (or `wrangler.jsonc` via `llms.txt`) rather than copying commands from older blog posts |
| Accidentally adding the `@astrojs/cloudflare` SSR adapter (unneeded for static output) silently switches billing/behavior to metered Worker invocations | Unknown unknowns / Research finding | L | M | Keep `astro.config.mjs` on the default static output; only add the adapter if SSR is deliberately introduced, and note that decision in `AGENTS.md` |
| Cloudflare's dashboard-level Node version pin diverges from `package.json`'s `engines` field, breaking CI without an obvious cause | Unknown unknowns | L | L | Explicitly set the Cloudflare build's Node version to match `engines.node` (`>=22.12.0`) in project settings at first deploy |

## Getting Started

1. Confirm the Astro build stays static (`output: 'static'` is Astro's default and already in use — no adapter needed): verify `astro.config.mjs` has no `@astrojs/cloudflare` (or any SSR) adapter.
2. Install Wrangler: `npm install -D wrangler` (Astro's official Cloudflare guide no longer requires a separate global install for static deploys).
3. Create the Cloudflare project as a **Workers with static assets** project (not "Pages") — either via the dashboard's Git integration (connect the repo, set build command `npm run build`, output directory `dist`) or `npx wrangler deploy` after adding a minimal `wrangler.jsonc` pointing `assets.directory` at `dist`.
4. Set the project's Node version to match `package.json`'s `engines.node` (`>=22.12.0`) in the Cloudflare build settings, so local and CI builds behave identically.
5. Push to the connected branch to trigger the first deploy; verify the preview URL, then confirm routing (`/`, a refresh on any future nested route) before treating it as production-ready.

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration
- CI/CD pipeline setup (GitHub Actions workflow file itself — `tech-stack.md` already recorded the provider/flow choice, but no `.github/workflows/*.yml` was generated in this research)
- Production-scale architecture (multi-region, HA, DR)
