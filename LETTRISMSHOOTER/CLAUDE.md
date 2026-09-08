# LETTRISM SHOOTER — agent guide

> A side-scrolling shooter in which **the world is editable and the Arabic alphabet is the
> editor**. You collect tiles bearing the letters; each grants the world-edit its own written
> form dictates; you build, cut, bridge and pour your way through chambers that cannot be shot
> through.

A side project of **Four Alchemical Games** (`../`), sharing that repo's deploy and its
`shared/help.js` teaching layer. Built on the lettrist engine from **TurkaGame**
(`C:\Dev\TurkaGame`).

**Read `DESIGN.md` before changing mechanics** and `DECISIONS.md` before re-litigating a
choice. Inherits `C:\Dev\CLAUDE.md`'s working discipline — verify against the running
artifact before saying done, log decisions to a file, no secrets in chat.

## The one rule

**What a letter does is derived from its written form or its grammar — never assigned by
taste.** Anyone with a grammar can check it. This is TurkaGame's rule and it is the reason
the project is worth doing:

| the fact | the power | letters |
|---|---|---|
| a single upright stroke | **AXIS** — raise a pillar | 2 |
| n dots above | **RAISE** — lift the ground n cells | 12 |
| n dots below | **LOWER** — sink the ground n cells | 3 |
| a closed form | **BIND** — bridge a gap into one body | 9 |
| a descending tail | **POUR** — open a channel through matter | 17 |
| never joins what follows (ا د ذ ر ز و) | **SEVER** — cut; the only thing that opens a ward | 6 |
| a sun letter | **ASSIMILATE** — the target becomes what is beside it | 14 |
| a moon letter | **DISTINGUISH** — ward it against all further change | 14 |

The census is not a design decision — it falls out of the alphabet. If you add a primitive it
must be granted by a checkable fact, and the census must still add up.

**The abjad value is the price.** A letter's numerical value is what its edit costs from your
breath. Alif is 1; the thousand-letters are ruinous. The economy is the tradition's own
arithmetic.

## Files

```
LETTRISMSHOOTER/
├── index.html        the page: HUD, the letter card, the codex, the chamber briefs
├── src/
│   ├── letters.json  the 28 letters with the facts the powers derive from.
│   │                 ADAPTED FROM TurkaGame/v2/data/letters.json — if that
│   │                 changes, re-derive rather than hand-editing here
│   ├── edit.js       the eight ops. EVERY OP IS PURE: it returns a list of
│   │                 changes and never writes. That is what makes the landing
│   │                 preview possible — the same call is drawn or applied
│   └── game.js       the loop, the chambers, the HUD
├── CLAUDE.md         this file
├── DESIGN.md         why it is built this way
├── DECISIONS.md      the record
└── README.md         player-facing
```

## Verifying a change

Serve the parent repo root and open `/LETTRISMSHOOTER/`. The game exposes `window.LS`
(getters, because these are reassigned):

```js
LS.start(); LS.loadChamber(2); LS.planAt(x, y); LS.commitEdit();
LS.frame(t)     // step the loop by hand
LS.world, LS.player, LS.state, LS.CHAMBERS, LS.BY_GLYPH
```

**Two traps, both hit while building this:**

- **`CELL` is computed from viewport height**, so it is not 34. Read the live `CELL` before
  converting pixels to cells or every number you compute will be wrong.
- **Do not run an unbounded solver in the page.** A depth-3 search over every cell is ~10¹⁰
  operations on a single thread and it wedges the tab so hard that even `navigate` times out.
  Bound the depth, bound the candidate set, and give it a millisecond budget.

## Chambers must be PROVED solvable, not eyeballed

Four of the five chambers in the first draft were unsolvable, and the eye did not catch it.
There is a reachability model — flood fill with the player's real movement, walk / jump two
cells / fall any distance — and every chamber is checked against it. The check also asserts
that a teaching chamber can be solved **only by the primitive it teaches**, which caught alif
quietly solving three of them.

The harness lives in `DESIGN.md` § *Verification*; paste it into the page and run it after any
map or op change.
