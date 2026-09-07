# AGENTS — AlchemyBlockInvaders

The roles, the orchestration rules and the research pipeline are **workspace-level**, because
agents move between the game projects in `C:\Dev` and the corpus is shared:

- `C:\Dev\AGENTS.md` — roles and handover contracts
- `C:\Dev\ORCHESTRATION.md` — running several agents without collisions
- `C:\Dev\PIPELINE.md` — research → mechanics → design → code, and where the 953 PDFs are
- `C:\Dev\research-artifacts\INDEX.md` — check before reading any source

## Specific to this repository

**Read `PROMPTSTOFEATURES.md` first.** It is the spec: every requirement Ted has given,
unpacked into features with status, the standing instructions, and the engineering rules.
The backlog at the end of it is ordered — start at the top.

Four games live here and they are independent:

| directory | game | notes |
|---|---|---|
| `invaders/` | Alchemy Block Invaders | v3: `glyphs.js` + `cascade.js` + `spells.js` + `game-v3.js` |
| `novaheat/` | Nova Heat | classic script |
| `circulatio/` | Circulatio | ES modules + three.js from a CDN |
| `salamandra/` | Salamandra | classic script; exposes `window.SAL` |

`shared/help.js` is the teaching layer used by all four. Any new game here installs it —
the standing instruction is to over-explain and make it toggleable.

**Before you say a change works:** serve the root, drive the game, read the numbers. And set
a viewport first — a hidden preview pane reports `innerWidth: 0` and suspends
`requestAnimationFrame`, which has been mistaken for a game bug five times.
