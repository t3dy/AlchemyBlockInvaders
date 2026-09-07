# DEPLOY STATE — Four Alchemical Games

Read this before touching anything to do with deployment.

## Canonical

| | |
|---|---|
| **Live URL** | https://t3dy.github.io/AlchemyBlockInvaders/ |
| **Host** | GitHub Pages, served from `main` at the repository root (`/`) |
| **Repository** | https://github.com/t3dy/AlchemyBlockInvaders (public) |
| **Build step** | none — the repository *is* the site |
| **Env vars** | none |

There is no second host. Nothing here needs a server: all four games are static HTML,
CSS and JavaScript, they hold no state beyond the page, and they talk to nothing. Per the
workspace hosting policy that makes Pages correct and Vercel wrong for this project.

## What is served where

| path | what |
|---|---|
| `/` | the hub — what the games are for, and the controls for each |
| `/invaders/` | Alchemy Block Invaders (v3 - 26 glyph blocks, cascades, spells, the Cabinet) |
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

`invaders/index.html` loads four scripts with `?v=` queries - `glyphs.js`, `cascade.js`,
`spells.js` and `game-v3.js`. **Bump the number on any of them you change.**
(`game-v2.js` is superseded and nothing loads it.) Without it a browser holding an earlier build keeps running the
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

## Published

First published 2026-09-07. `gh repo create --public --push`, then Pages enabled on `main`
at `/`. First build succeeded with no error.

**Verified against the live URL, not the local server:**

| | |
|---|---|
| every path | `/`, `/invaders/`, `/novaheat/`, `/circulatio/`, `/salamandra/` and each game's script return 200 |
| deployed bytes | identical to local for every file once line endings are normalised — git converted CRLF to LF on commit, which is harmless |
| relative links | the hub's four links resolve to `t3dy.github.io/AlchemyBlockInvaders/<game>/`, i.e. the subpath discipline holds |
| Alchemy Block Invaders | all seven shields play: waves 3-6, scores 320-860, real game over each time |
| Nova Heat | untouched run scorches out at 32 s; played run 255 s, score 6120, 10 codex entries |
| Salamandra | lane opened at 92 s, flew through, **THE LOCK IS OPEN**, score 1035 |
| Circulatio | three.js loads from the CDN, the cup opens, the ball sinks, the round is scored |

### A trap when testing the live site

The browser pane reports **`innerWidth: 0`** when it is hidden. Alchemy Block Invaders sizes
its canvas from the viewport, so at zero the floor is at y=0, every block is instantly past
it, and the game ends in 0.4 seconds looking utterly broken. It is not: give the tab a real
viewport first and it plays normally.

```
resize_window { width: 1100, height: 800 }
```

This is the fifth time a zero viewport has been mistaken for a game bug in this workspace.
Set the size before drawing any conclusion about a game that dies immediately.

## Shared code

`shared/help.js` is loaded by all four games as `../shared/help.js`. It is the only file
outside a game directory that the site serves, and it must stay relative like everything else.
