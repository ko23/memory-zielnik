# Herbs Masters Duel (memory-zielnik)

A two-player, on-device memory-matching game that teaches kids to recognize and use herbs. Players build a deck of herb cards — a name plus a looked-up reference image, approved by a human before it's saved — then take turns flipping tiles until every pair is found. Repeated recall under uncertainty is what makes the herb names and appearances stick, unlike a one-off plant-ID photo lookup.

- **Live**: https://herbs-masters-duel.ko23.workers.dev
- **Stack**: Astro (static output) deployed to Cloudflare Workers with static assets — no backend, no login; everything lives on-device in `localStorage` (see `src/lib/storage/`)
- **Status**: MVP in progress. The local-persistence foundation (create/read/update/delete for herb cards, per-player score history) is implemented and tested; card-authoring and gameplay screens are next
- **Project docs**: `context/foundation/prd.md` (requirements), `context/foundation/roadmap.md` (milestone & slice tracking), `context/foundation/tech-stack.md`, `context/foundation/infrastructure.md`

---

## Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
