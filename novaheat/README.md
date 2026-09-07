# NOVA HEAT — *Fruit of Life*

A sacred-geometry invaders game. Sibling to **Alchemy Block Invaders**, with the verb
inverted: you don't shoot descending blocks, you **build a figure** and the invaders come
to take it apart.

```bash
npx http-server . -p 3003 -c-1
```

Then open <http://localhost:3003/novaheat/> (or use the `novaheat` launch config).

---

## What you are looking at

The page holds **Metatron's Cube** in pencil: the thirteen tangent circles of the **Fruit of
Life**, and all 78 lines that join their centres. Behind it, faint, is the **Flower of Life**.

## What you do

- **Place spheres of prana** into the circles (click, tap, or `Space`). 16 prana each.
- **Any two charged circles light the line between them**, and a lit line burns anything
  crossing it — at the strength of the *weaker* of the two.
- **Charge decays.** The figure always wants to fall apart, faster every Breath.
- **Place on the peak of the inhale** — the dashed window on the breath meter — for 9 prana
  and a 135% overcharge. That timing is the whole skill of the game; in testing it is worth
  about three extra Breaths of survival.

## What is coming for you

The **Nova Mob** walks in from the margin, drains your circles, and heads for the centre.
Every one that reaches a dark centre scorches the page.

| | |
|---|---|
| **Crab** | Rank and file. Dies to any honest line. |
| **The Subliminal Kid** | Fast, and *flickers* — while flickering no beam touches it. |
| **The Heavy Metal Kid** | Slow, huge HP. Soaks your beam so the rest walk through. |
| **Sammy the Butcher** | Ignores spheres, **severs lines** for six seconds each. |
| **Mr Bradly Mr Martin** | Boss, every fourth Breath. Kill it once and it is still two. |

## The two things that save you

- **Cut-Up** (`C`, 40 prana) — scrambles the Mob's positions, damages them, and re-splices
  every line Sammy has cut. Burroughs' counter-move against control, as a button.
- **Mer-Ka-Ba** — not a button. Light **all thirteen** circles at once and two counter-
  rotating tetrahedra turn: the field clears and the heat dumps. But the vehicle is built
  *out of* the figure, so it leaves every circle dark behind it. You buy the turn with the
  whole work.

## Nova Heat

Not a health bar — pressure, and it is literal, because the page is paper. Cream, then
scorch, then char. **Hold seven or more circles and it cools. Hold none and it climbs.**
At 100% the page is ash.

## Controls

| Key | |
|---|---|
| Mouse / touch | aim and place |
| `Space` | place a sphere on the selection |
| `W A S D` / arrows | move the selection |
| `C` | Cut-Up |
| `P` / `Esc` | pause |

## Codex

Fourteen entries, unlocked by *doing* rather than by browsing: the vesica piscis, why 78
lines, the Seed and Fruit of Life, the Mer-Ka-Ba, and each member of the Mob. The geometry
entries are honest about where the "sacred geometry" tradition is a twentieth-century
assembly rather than an ancient one.

See [DESIGN.md](DESIGN.md) for the full design and the sources behind each system.
