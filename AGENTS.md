Herbs Masters Duel is a browser-only, 2-player memory-matching game that teaches herb names and images, built with Astro (client-side, no backend). See @context/foundation/prd.md for product requirements and @context/foundation/tech-stack.md for the stack rationale.

## Hard Rules

- Do not add a backend, database, authentication, or cloud sync. The PRD (`## Non-Goals` and `## Access Control` in @context/foundation/prd.md) locks this to a local-only, single-profile browser app — no Supabase, no server accounts, no cross-device sync.
- Read @context/foundation/prd.md and @context/foundation/tech-stack.md before making product or stack decisions — they are the source of truth for scope and the chosen starter's rationale.

## Project Structure

- `src/pages/` — file-based routes (currently just `index.astro`).
- `src/components/` — Astro components; the game UI will likely live here as a React island per @context/foundation/tech-stack.md.
- `src/layouts/` — shared page layout (`Layout.astro`).
- `context/foundation/` — PRD, tech-stack hand-off, shape-notes. `context/changes/bootstrap-verification/` — the bootstrap run's audit log.

## Commands

- `npm run dev` — start the dev server at `localhost:4321`.
- `npm run build` — build to `./dist/`.
- `npm run preview` — preview the production build locally.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
