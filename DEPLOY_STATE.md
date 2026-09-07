# DEPLOY STATE — Four Alchemical Games

Read this before touching anything to do with deployment.

## Canonical

| | |
|---|---|
| **Live URL** | https://t3dy.github.io/AlchemyBlockInvaders/ |
| **Host** | GitHub Pages, served from `main` at the repository root (`/`) |
| **Repository** | https://github.com/t3dy/AlchemyBlockInvaders |
| **Build step** | none — the repository *is* the site |
| **Env vars** | none |

There is no second host. Nothing here needs a server: all four games are static HTML,
CSS and JavaScript, they hold no state beyond the page, and they talk to nothing. Per the
workspace hosting policy that makes Pages correct and Vercel wrong for this project.

## What is served where

| path | what |
|---|---|
| `/` | the hub — what the games are for, and the controls for each |
| `/invaders/` | Alchemy Block Invaders |
| `/novaheat/` | Nova Heat |
| `/circulatio/` | Circulatio |
| `/salamandra/` | Salamandra |

## The base-path gotcha

**Pages serves this repository from `/AlchemyBlockInvaders/`, not from `/`.** Any path
written root-absolute — `src="/game.js"`, `href="/novaheat/"` — resolves against
`t3dy.github.io` and 404s. This is the single most common way one of these sites breaks.

Every link and every script tag in this repository is **relative** and must stay that
way. To check before pushing:

```bash
grep -rn 'src="/\|href="/\|from "/' --include=*.html --include=*.js .
```

That must print nothing.

## The cache gotcha

`invaders/index.html` loads its script as `game-v2.js?v=3`. **Bump that number whenever
`game-v2.js` changes.** Without it a browser holding an earlier build keeps running the
old game, and the fix you just deployed appears not to have worked. The local dev servers
in `.claude/launch.json` all pass `-c-1` for the same reason.

## Deploying a change

Pages publishes `main` on push. There is nothing to build and nothing to run.

```bash
git push origin main
```

Then **load the live URL and click into the game you changed** — not the local server.
A green Actions tick means Pages accepted the commit, not that the game still works.

## Known-good state

Last verified 2026-09-07. All four games driven headlessly through their own loops: each
starts, plays, and reaches a real ending. Details and method in `VERIFIED.md`.

One thing that verification cannot cover: the preview pane used for testing suspends
`requestAnimationFrame`, so every result was produced by stepping each game's frame
function by hand. Smooth animation is confirmed only by opening the live site in a real
browser.
