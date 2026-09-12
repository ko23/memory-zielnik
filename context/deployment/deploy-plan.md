---
project: herbs-masters-duel
deployed_at: 2026-09-12
platform: Cloudflare Workers (static assets)
deployed_url: https://herbs-masters-duel.ko23.workers.dev
version_id: a9604c46-a003-4c79-a37d-7c3635945ff7
---

## What was deployed

First-ever deploy of the project — still the bare Astro "basics" scaffold (`src/pages/index.astro` + `Welcome.astro`), no game logic yet. Purpose was to stand up the deployment pipeline end-to-end early, per `context/foundation/infrastructure.md`'s recommendation of Cloudflare Workers with static assets (explicitly not classic Pages, despite `tech-stack.md` naming `cloudflare-pages`).

## Setup performed

1. `npm install -D wrangler@4.131.1` — added as a devDependency (previously only available via `npx` global cache).
   - Note: `workerd`'s postinstall script was blocked by the project's existing `allowScripts` policy (`package.json` only allows `esbuild`). This is fine — `workerd` is only needed for local `wrangler dev`, not for `wrangler deploy`.
2. Created `wrangler.jsonc` at the repo root:
   ```jsonc
   {
     "name": "herbs-masters-duel",
     "compatibility_date": "2026-09-12",
     "assets": {
       "directory": "./dist",
       "not_found_handling": "single-page-application"
     }
   }
   ```
   No `main` field — assets-only Worker (no server-side script). SPA fallback chosen because future game screens are planned as client-side state within one route, not separate URLs.

## Deploy commands (exact, for repeatability)

```bash
npm run build        # astro build -> dist/
npx wrangler deploy  # NOT `wrangler pages deploy` — Workers and Pages commands are not interchangeable
```

First `wrangler deploy` run created the Worker project automatically on the already-authenticated Cloudflare account (`ko23@o2.pl`, account `5b006205e9bb5b17589347b5dc2c8563`) — no dashboard step required.

## Verification performed

- `curl -I https://herbs-masters-duel.ko23.workers.dev` → `HTTP/2 200`, `server: cloudflare`.
- `curl -s` body confirmed as the Astro scaffold HTML (title "Astro Basics"), not an error/placeholder page.

## Operational reference (from infrastructure.md)

- **Rollback**: `wrangler rollback` — reverts to any of the 10 most recent deployed versions, one command, no data-migration caveats (no database exists).
- **Logs**: `wrangler tail` — streams live production logs from the terminal.
- **Secrets**: none exist yet (no backend). If added later, use `wrangler secret put`, never commit to the repo.
- **Approval boundary**: routine deploys can run unattended once CI is wired up; a human must approve any future decision to add server-side Worker logic (PRD-scope change, not just infra).

## Not yet done (explicitly out of scope for this deploy)

- GitHub Actions CI/CD wiring (`tech-stack.md` records `ci_provider: github-actions`, `ci_default_flow: auto-deploy-on-merge`, but no workflow file exists yet — today's deploy was manual CLI).
- Custom domain / routing beyond the default `workers.dev` subdomain.
