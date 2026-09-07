# Four Alchemical Games

**Play them: https://t3dy.github.io/AlchemyBlockInvaders/**

Alchemy is a system of correspondences: fire does one thing to water and another to earth,
gold answers to nothing but itself, the volatile must be fixed before it is any use to you.
Those correspondences are *rules* — and the honest way to learn a rule is to play a game
whose outcome depends on it.

So this repository holds four games, in four different genres, each turning a different part
of the tradition into its mechanics. Nothing is locked and nothing is behind a tutorial.

| game | genre | what it makes into a mechanic |
|---|---|---|
| [**Alchemy Block Invaders**](invaders/) | shooter | the reaction table — every hit is a reaction between two kinds of matter, not damage |
| [**Nova Heat**](novaheat/) | defence | Metatron's Cube as a *graph*: thirteen circles, and the lines between the ones you charge |
| [**Circulatio**](circulatio/) | bounce / golf | physics *as* metaphysics — Aristotelian, Paracelsian, Pythagorean and Lettrist rulesets play differently |
| [**Salamandra**](salamandra/) | side-scrolling flight | the reaction table again, but as architecture you have to read before you can shoot it |

Every game runs in the browser with no install, no account and no build step. The only
dependency anywhere is three.js, which Circulatio loads from a CDN to draw its courses.

## Controls

**Alchemy Block Invaders** — `←` `→` move, `Space` fire, drag on a touch screen. The Tome
button opens the record of every reaction you have discovered.

**Nova Heat** — mouse to aim, click or `Space` to place a sphere (16 prana), `WASD` or arrows
to move the selection, `C` for the Burroughs cut-up (40 prana), `P` to pause. Place on the
peak of the inhale — the dashed window on the breath meter — and the sphere costs 9 and lands
at 135%. That timing is the whole game.

**Circulatio** — `A` `D` aim, `Space` to start the meter then again to strike, `W` `S` loft,
`Z` `X` english, `Tab` ground/air, `Q` `E` turn the table, `1`–`4` change the metaphysics,
`L` inscribe a letter, `R` reset, `N` next course.

**Salamandra** — `WASD` or arrows fly, hold `Space` to fire, `C` `V` cycle matter, `1` `2` `3`
jump to the Elemental, Principle or Astrological register, `Shift` spends the power bar,
`P` pauses.

## Running it locally

Any static server at the repository root will do; the hub and all four games are served from
it. The configurations in `.claude/launch.json` all pass `-c-1` so that an edit is never
hidden behind a cache.

```bash
npx http-server . -p 3001 -c-1
```

## For contributors

- `DEPLOY_STATE.md` — the canonical URL, the host, and the two gotchas that break this site.
  **Read it before touching deployment.**
- `VERIFIED.md` — what has actually been driven and what it showed, including how to step
  these game loops headlessly without the harness lying to you.
- `CLAUDE.md` — file structure and working notes.
- `DESIGN.md`, `TOME_ENTRIES.md`, `ALCHEMICAL_DATA.md`, `GLYPH_DESIGNS.md` — the design
  documents and the text content.

---

## Alchemy Block Invaders — in detail

A Space Invaders-style game where enemies are alchemical blocks, and players learn the secrets of the four elements and their reactions through gameplay.

### Overview

In **Alchemy Block Invaders**, descending blocks embody the four fundamental elements of Paracelsian alchemy: **Fire** (🔥), **Water** (💧), **Air** (🌬️), and **Earth** (🌍). As you shoot each block, you trigger alchemical reactions that transform the blocks and produce cascading effects. Your "Tome" (spellbook) accumulates knowledge of each reaction, unlocking descriptions of what happens when elements meet.

### Gameplay

- **Arrow Keys** — Move left/right
- **Spacebar** — Fire bullets
- **📖 Tome Button** — Open your spellbook to review discovered reactions

### Mechanics

### Core System
- Descending blocks represent the four elements
- Fire bullets transform enemy blocks through alchemical reactions
- Each reaction produces secondary effects and grants affinity
- Kill all enemies to advance to the next wave
- Health decreases if a block reaches the bottom
- Game ends when health reaches 0

### Elements & Their Natures

**Fire** 🔥 — The active principle of transformation. When you fire a bullet, you activate the nature of fire within the block, consuming and transmuting.

**Water** 💧 — The solvent and the mirror. Water responds to fire's heat and binds with earth. It moves where fire is rigid.

**Air** 🌬️ — The medium and messenger. Air rises and disperses. It carries what fire releases and water cannot hold.

**Earth** 🌍 — The vessel and foundation. Earth is stable, heavy, and contains. All transformations eventually settle into earth form.

### Reactions

Each interaction between Fire (your bullet) and an enemy element produces a unique alchemical reaction with secondary effects:

- **Fire + Water** → Steam (Mist Cloud)
- **Fire + Earth** → Ash (Dust)
- **Fire + Air** → Wildfire (Expansion)
- **Water + Earth** → Mud (Stasis)
- **Water + Air** → Mist (Mist Cloud)
- **Air + Earth** → Dust (Dispersion)

### The Tome

Your Tome (accessed via the 📖 button) contains:

1. **Principles** — The fundamental nature of each element
2. **Discovered Reactions** — Descriptions of interactions you've witnessed

As you shoot blocks, new reactions appear in your Tome, revealing the secrets of alchemical transformation.

### Character Sheet

The top-right HUD displays your **Elemental Affinity**, showing how much of each element you've worked with:

- Fire affinity increases when you use fire bullets
- Each element's affinity grows as you interact with it
- Your affinities track your progress as an alchemist

### Scoring & Progression

- **Score** — Points awarded for each block destroyed
- **Health** — Decreases when blocks reach bottom; 0 = Game Over
- **Wave** — Difficulty increases with each wave; more enemies spawn
- **Affinity** — Tracks your mastery of each element

### Files

```
invaders/
├── index.html           # the game's UI and layout
├── game-v2.js           # the script the page loads: shields, glyphs, XP, the
│                        # full alchemical system. Loaded as game-v2.js?v=N —
│                        # bump N whenever it changes or browsers cache the old one
├── game.js              # the superseded MVP script; nothing loads it
└── test.html            # standalone assertions over the MVP script
```

Running it is covered under *Running it locally* above — serve the repository root and
open `/invaders/`.
