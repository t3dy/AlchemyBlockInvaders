# NOVA HEAT — *Fruit of Life* / A Sacred Geometry Invaders Game

> Sibling to **Alchemy Block Invaders**. Same mashup instinct — esoteric diagram meets
> arcade cabinet — but the verb is inverted. In Block Invaders you *destroy* descending
> matter. Here you **build** a figure and the invaders come to take it apart.

---

## 1. The Premise

The screen is a sheet of cream paper. Drawn on it, faint as pencil, is **Metatron's Cube**:
thirteen circles of the *Fruit of Life* with all seventy-eight lines that join their centres.

You are the hand that meditates on the figure. You place **spheres of prana** into the
thirteen circles. Any two charged circles light the line between them, and a lit line burns.
The figure is simultaneously your mandala, your fortress, and your weapon.

Coming in from the black margin are the **Nova Mob** — pixel invaders, cribbed from the
cabinet and from Burroughs. They do not want to kill you. They want to *drain the figure*,
reach the centre, and burn the paper. As they succeed, **Nova Heat** rises: the cream page
scorches to amber, then chars to black.

Hold the geometry and the paper cools. Lose it and the paper burns.

---

## 2. Sources & What They Contribute

| Source | Contributes |
|---|---|
| **Metatron's Cube / Fruit of Life** | The board itself: 13 nodes, 78 edges. Not decoration — the edge set *is* the mechanic. |
| **Seed of Life (7 circles)** | Mid-game milestone: centre + inner ring lit = "the six days". Grants a cooling pulse. |
| **Flower of Life** | The watermark behind the board; the figure you never finish. |
| **Mer-Ka-Ba (Drunvalo Melchizedek)** | All 13 lit at once spins up two counter-rotating tetrahedra. Field-clearing ultimate. |
| **Pranayama / meditative breath** | The resource clock. Prana regenerates on a sine breath; placing on the peak of the inhale is cheaper and overcharges the sphere. |
| **Space Invaders** | Sprites, wave structure, the creeping-in-from-the-edge pressure, score. |
| **Burroughs, *Nova Express* / *The Ticket That Exploded*** | The antagonists (the Nova Mob), the failure meter (Nova Heat), and the **Cut-Up** ability — the counter-weapon against control is to scramble the tape. |

Burroughs is used as *register and mechanic*, not as quotation. All Codex prose is original;
the books are named, not excerpted.

---

## 3. Board Geometry (exact)

Let `U` be the distance between adjacent circle centres, and each circle's radius be `U/2`
(the Fruit of Life circles are mutually tangent).

- **Node 0** — centre. `(0, 0)`. Called **THE SEED**.
- **Nodes 1–6** — inner ring, distance `U`, at −90°, −30°, 30°, 90°, 150°, 210°. **DAY I–VI**.
- **Nodes 7–12** — outer ring, distance `2U`, at the same six angles. **FRUIT I–VI**.

**Edges** = every unordered pair of the 13 nodes = `13·12/2` = **78 lines**. That is Metatron's
Cube, drawn exactly, no cheating.

The full edge set is always visible in pencil. Only edges whose *both* endpoints hold charge
are live.

---

## 4. Core Loop

```
breathe  →  place spheres  →  edges light  →  edges burn invaders
   ↑                                                  │
   └────────── charge decays, invaders drain ─────────┘
```

1. **Prana** regenerates on a 7-second breath cycle (`sin`). Regen is fastest at the top of
   the inhale.
2. **Place a sphere** on a hovered/selected node (click, tap, or Space). Costs 16 prana —
   **9, and charges to 135%, if placed inside the inhale-peak window.** The window is shown
   as a ring pulse on the breath meter; this is the game's skill expression.
3. **Charge decays** continuously (faster each Breath/wave). A node is *lit* while charge > 0.
4. **Lit edges** deal damage per second to any invader within the beam, scaled by
   `min(chargeA, chargeB)`. Two strong nodes make a hot line; two guttering ones make a
   flicker.
5. **Invaders** walk to a target node, drain its charge, then re-target. A dark centre lets
   them **burn**: +Nova Heat, invader consumed.
6. **7+ nodes lit** cools the page (Nova Heat decays). **0 nodes lit** heats it fast.
7. **All 13 lit** → **MER-KA-BA**: two counter-rotating tetrahedra, field cleared, heat
   dumped, big score. Once per Breath.

Nova Heat 100% = the page is ash. Game over.

---

## 5. The Nova Mob

| Name | Role | Behaviour |
|---|---|---|
| **Crab** | Baseline | Straight walk, drains, dies to beams. |
| **The Subliminal Kid** | Fast / phasing | Half again as fast, drains fast, and **flickers** — while flickering it takes no beam damage. Punishes thin defences. |
| **The Heavy Metal Kid** | Tank | Slow, very high HP. Soaks the beam so the rest walk through. |
| **Sammy the Butcher** | Edge-cutter | Immune to the first line it crosses, and **severs** it for 6 s. Cuts your figure apart rather than draining it. |
| **Mr Bradly Mr Martin** | Boss (every 4th Breath) | Huge HP; on death **splits in two**, per the doubled name. |

## 6. Player Verbs

- **Place** (click / tap / Space) — the whole game.
- **Cut-Up** (`C` / button, 40 prana, 3 s cooldown) — scrambles every invader's position,
  damages them, and **restores every severed edge**. The Burroughs counter-move: when the
  Mob cuts your tape, you cut theirs.
- **Mer-Ka-Ba** — not a button. It is what happens when the figure is complete.

## 7. The Codex

The pedagogical organ, matching Block Invaders' Tome. Entries unlock on *events*, never on
menus: first sphere, first lit line, Seed of Life, Fruit of Life, Metatron's Cube, first
Mer-Ka-Ba, first Cut-Up, and one per Nova Mob member on first sighting. Each entry teaches
the actual geometry (vesica piscis, why 78, what the Platonic projections are) or names the
Burroughs/Melchizedek source honestly, including where the "sacred geometry" tradition is
19th–20th-century synthesis rather than ancient fact.

## 8. Visual Design

The reference image is cream paper, ink linework, four flat pixel-invader colours
(red `#e8402a`, cyan `#29a8e0`, yellow `#f5c518`, brown `#6b4423`). The game keeps that
exactly — **and burns it.** Background lerps cream → scorched amber → char as Nova Heat
rises; ink inverts to hot gold so linework survives on the charred page. The entire failure
state is legible as *the paper catching fire*, no HUD required.

## 9. Deliberately Not In v1

Rotation of the figure; 3-D Mer-Ka-Ba; the Egg of Life (8 spheres, 3-D) as a second board;
tuning per-node "Platonic solid" bonuses; audio; the 64-tetrahedron grid as an endgame board.

---

## 10. Tuning Record (verified in-browser, headless sim)

Balance was set by driving `update()` directly at fixed timesteps with scripted "players" of
varying skill, rather than by feel. Results at the shipped constants:

| Player | Places/sec | Peak-timed | Dies on Breath | Survives |
|---|---|---|---|---|
| Idle (no input) | 0 | – | 1 | ~40 s |
| Sloppy | 1–2 | no | 7 | ~3 min |
| Good | 3 | yes | 10 | ~5 min |
| Perfect bot | 5 | yes | 12 | ~6 min |

Everyone dies; the run is a score attack. **Peak-timing the inhale is worth roughly three
Breaths**, which is the intended size of the skill gap.

Two decisions came out of that testing and should not be quietly reverted:

1. **Mer-Ka-Ba discharges the figure.** At first it only cleared the field, so a competent
   player triggered it once per Breath and pinned Nova Heat at zero from Breath 4 onward —
   the ultimate became routine and the game stopped being a game. Spending the figure makes
   completing it a *decision* (you are dark and reheating for several seconds afterwards)
   and prevents a permanent 13-lit lock.
2. **Charge decay outruns prana at high Breaths.** `decayBase 0.060 + 0.015/Breath` means
   holding all thirteen is just affordable with perfect peak-timing around Breath 4, and
   arithmetically impossible by Breath 8. The figure *must* start collapsing; the question
   is only which circles you let go.

Bugs found and fixed during verification, worth knowing about if this code is reused:

- `layout()` read `canvas.clientWidth` unguarded; in a hidden tab that is `0`, which set
  `U = 0` and collapsed the entire board to a point with nothing able to move. Now falls
  back to `window.innerWidth`, and `frame()` re-lays-out when the size actually changes.
- A focused button swallowed the next `Space` as its own activation — pressing Space to
  place a sphere right after clicking "Begin" silently restarted the run. All `.btn`s now
  blur on click.
- `P` opened the pause overlay but could not close it, because the overlay early-return in
  the key handler ran first.
- Sprite colours that landed near the page's own luminance vanished as it scorched (the
  brown Heavy Metal Kid on amber). Sprites and spheres now run through a luminance-contrast
  guard that pushes a colour away from the background while keeping its hue.
