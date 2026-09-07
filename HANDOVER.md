# HANDOVER — Four Alchemical Games

**Written 2026-09-07. Read this first in a new session, then `PROMPTSTOFEATURES.md`.**

Live: **https://t3dy.github.io/AlchemyBlockInvaders/**
Repo: github.com/t3dy/AlchemyBlockInvaders (public, `main`, Pages from `/`)

---

## Where things stand in one paragraph

Four browser games share this repository behind a hub that explains what each is for. The
flagship, **Alchemy Block Invaders**, has been rebuilt: all 26 alchemical glyphs are blocks
whose behaviour follows from their symbolism, a cascade engine turns one shot into chains of
forty-plus, three spells and a Gradius power bar hang off dedicated keys, an exhibition level
called THE CABINET lets you try everything safely, and **all 72 spirits of the Goetia are
enemies** whose rank, legions, offices and attributions are each mechanical. A shared teaching
layer gives every game a hint panel, a full manual and a narrator, all toggleable. Everything
is deployed and verified on the live site.

---

## The four games

| path | game | genre | state |
|---|---|---|---|
| `invaders/` | Alchemy Block Invaders | shooter | **v3** — the deep one. 26 glyphs, cascades, spells, Cabinet, 72 Goetia |
| `novaheat/` | Nova Heat | defence on Metatron's Cube | works; teaching layer added |
| `circulatio/` | Circulatio | bounce/golf, physics-as-metaphysics | works; 2 courses only |
| `salamandra/` | Salamandra | side-scrolling flight | works; winnable; teaching layer added |

`shared/help.js` is the teaching layer used by all four. `index.html` at the root is the hub.

### How the invaders game is put together

| file | what it holds |
|---|---|
| `invaders/glyphs.js` | **the 26 glyph blocks.** Each `onHit` returns a list of *effects* and mutates nothing — that purity is what lets a 40-long chain resolve cleanly |
| `invaders/cascade.js` | the effect resolver. A work queue, not recursion; one trigger per block per chain; 400-effect cap |
| `invaders/spells.js` | SOLVE / COAGULA / PROJECTIO on `Z` `X` `C`; the Gradius bar spent with `Shift` |
| `invaders/goetia.js` | **the 72 spirits**: ranks → bearings, legions → retinue, offices → 17 powers, planet+element → weakness |
| `invaders/goetia-text.json` | the 72 verbatim descriptions + attributions |
| `invaders/game-v3.js` | the engine: THE CABINET, WAVES, and the gate encounters |

`game-v2.js` and `game.js` are superseded and nothing loads them.

---

## The design rule that governs everything

**A mechanic must be recoverable from its symbolism without being told.**

Jupiter's block swells when shot because Jupiter is the Greater Benefic and the principle of
increase. Gold is immune to everything but gold because gold is incorruptible. Bael goes
invisible because his office is to make men invisible. Andromalius steals a power-up and gives
it back when killed because his office is to return thieves and stolen goods.

If you cannot write that sentence for something you are adding, it is not ready. This is the
legibility gate in `C:\Dev\PIPELINE.md` and it is the whole point of the project.

---

## What to build next, in order

The full ordered backlog is at the end of `PROMPTSTOFEATURES.md`. The top of it now:

1. **The Goetia seals as art.** `C:\Dev\GoetiaRevEng\` holds all 72 public-domain seals,
   already segmented and normalised. The spirits are in the game but are drawn as a generic
   ring of marks; using their actual seals is the highest-value visual work available and the
   asset is already made.
2. **First-encounter hints.** The teaching layer exists but does not yet fire contextually the
   first time a player meets a Mercury (which flees), a Luna (which reflects), or their first
   spirit.
3. **A guided path through the Cabinet.** The room is free-form; five directed challenges
   ("now try water on the salt") would teach the system faster than free play.
4. **Backfill the citations.** The 26-glyph table and the Goetia mechanics were written from
   working knowledge and from the text, but no RESEARCHER pass has produced page-level
   attribution. `C:\Dev\research-artifacts\INDEX.md` names this as the wanted backfill.
5. **Rudd specifically.** Skinner & Rankine's edition is at `E:\pdf\Grimoire\` and Asprem's
   article beside it. Nobody has yet written down *where Rudd's witness differs* from the
   1904 text the game ships. That is a real research question with a real artifact at the end.
6. **More spells** — seven planetary operations rather than three.
7. **Authored levels for Invaders**, in the manner of ALCHEMYBLOCKSHOOTER's 132.
8. **Salamandra's masonry range** — the Cabinet's equivalent for that game.

---

## The research corpus — and the thing that had been missing

`C:\Dev\PIPELINE.md` is the map. The headline correction made this session:

**`E:\pdf` is the main library — 2,863 PDFs, three times the size of the `C:\Dev` holdings,
and it was not recorded in any system file.** Agents had been working from the smaller store
without knowing the larger one existed.

Two things to know before reading anything:

- **`plain_text_drafts/`** — many folders carry a subfolder of already-OCR'd `.txt` beside the
  PDFs. Always check for one first; it is faster and greppable and needs no tooling.
- **`C:\Dev\research-artifacts\INDEX.md`** — check before reading any source at all. The topic
  may already be extracted.

### Goetia and grimoires specifically

| what | where |
|---|---|
| the 72 structured | `C:\Dev\ALCHEMYBLOCKSHOOTER\data\goetia.json` |
| the 72 verbatim + attributions | `C:\Dev\AlchemyBlockInvaders\invaders\goetia-text.json` |
| all 72 seals | `C:\Dev\GoetiaRevEng\` |
| **Mathers/Crowley 1904 — PUBLIC DOMAIN** | `E:\pdf\crowley\plain_text_drafts\` |
| Peterson, *Lesser Key* | `E:\pdf\magic\medieval magic\plain_text_drafts\` |
| **Skinner & Rankine, *Goetia of Dr Rudd* — IN COPYRIGHT** | `E:\pdf\Grimoire\` |
| Asprem on Rudd | `E:\pdf\Grimoire\`, and `C:\Dev\megabase\chats_2026\` |

**The copyright rule.** Period texts (pre-1929) may be shipped verbatim. Modern editions,
translations and apparatus may not, however scholarly. Where both exist, ship the public-domain
one and cite the modern one as background. That is exactly what the Goetia work does: text from
Mathers 1904, Skinner & Rankine read but not reproduced, and the game says so on screen.

---

## The agentic environment

Workspace-level, because agents move between the game projects and the corpus is shared:

| file | what |
|---|---|
| `C:\Dev\AGENTS.md` | seven roles — RESEARCHER, EXTRACTOR, DESIGNER, BUILDER, VERIFIER, DEPLOYER, AUDITOR — and the contract each owes. **Handovers go through files, never through conversation.** |
| `C:\Dev\ORCHESTRATION.md` | running several agents at once. **One writer per file, always.** Manifest checkpointing for jobs that outlive a session |
| `C:\Dev\PIPELINE.md` | research → mechanics → design → code, and the corpus map |
| `C:\Dev\research-artifacts\INDEX.md` | every extracted artifact |

`AGENTS.md` in this repo is a short pointer to those plus what is specific here.

---

## Traps that have already cost real time

These are in `VERIFIED.md` with the evidence. Every one was found the hard way.

| # | trap |
|---|---|
| 1 | **A hidden browser pane reports `innerWidth: 0` and suspends `requestAnimationFrame`.** Five separate "bugs" have been this. On the first live test of v3 the game ran 0.4 seconds and scored zero, which looks exactly like a broken deploy. **Set a viewport before concluding anything:** `resize_window {width:1200, height:860}` |
| 2 | **Screenshots time out in this pane** while the DOM and game state read fine. Verify by measuring, not by looking |
| 3 | **Step a game loop from its own `last` timestamp**, not `performance.now()`. A synchronous loop does not advance the wall clock, so re-reading it gives `dt ≈ 0` and nothing moves |
| 4 | **Debug hooks must be getters.** A captured array goes stale the moment the game reassigns it, and then the hook lies to you |
| 5 | **Check a function's real signature.** `bulletSystem.fire(x, y)` called with no arguments put every bullet at NaN and made the game look broken |
| 6 | **Suspect the instrument first.** Four bugs in this project were in the test harness, and every one made the game look worse than it was |
| 7 | **Pages serves from a subpath.** Any root-absolute path 404s the whole site. Before pushing: `grep -rn 'src="/\|href="/\|from "/' --include=*.html --include=*.js .` must print nothing |
| 8 | **Wait for *your* build.** `pages/builds/latest` may still show the *previous* build as "built". Match on the commit sha, not the status — this bit once already this session |
| 9 | **Bump the `?v=` on any changed script**, or a cached browser keeps running the old one |

### Engine rules, learned from real bugs

One animation loop guarded by a flag. `dt` clamped at **both** ends — a negative delta runs the
world backwards and turns `cooldown -= dt` into an increment, silently disabling the gun. Each
entity resolved exactly once per frame. **No unreachable game states** — Salamandra could once
reach the end of its level and neither win nor lose, for ever.

---

## How to verify a change here

```bash
npx http-server . -p 3001 -c-1
```

Then drive it. The invaders game exposes `window.ABI` with getters:

```js
ABI.startCabinet();                     // the exhibition
ABI.startWaves();                       // the game
ABI.startGate(3);                       // force a Goetic encounter
ABI.strike(block, {glyph:'fire', power:2, x:b.x, y:b.y});
ABI.frame(performance.now() + i*16.7);  // step the loop by hand
ABI.GOETIA                              // all 72, built
ABI.spirit                              // the one on the board
```

Salamandra exposes `window.SAL`, Circulatio `window.CIRC` — both through getters, for the
reason in trap 4.

**Before saying done:** load the live URL, play the thing, and say plainly what you could not
confirm. Ted rarely checks mid-build, so the agent is usually the last check.

---

## Deploying

`DEPLOY_STATE.md` has the detail. Short version: Pages publishes `main` on push, there is no
build step, and the two ways this site breaks are a root-absolute path and a cached script.
After pushing, wait for the build **whose sha matches your commit**, then load the live URL and
play a game. A green build is not a working site.
