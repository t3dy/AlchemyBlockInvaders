# PROMPTS → FEATURES

**Read this before building anything in this repository.**

Every prompt Ted has given across the sessions recorded in `CLAUDECONVO1.md`, unpacked into
buildable features with their status. A prompt is a requirement even when it was given in
passing, even when it was three words long, and even when it was aimed at a sibling project —
`ALCHEMYBLOCKSHOOTER` and this repository share a design vocabulary and requirements leak
both ways on purpose.

Status vocabulary:

| mark | meaning |
|---|---|
| **DONE** | built and verified against a running artifact, not just written |
| **PARTIAL** | some of it exists; the gap is named |
| **OPEN** | asked for, not built. These are the backlog. |
| **STANDING** | a rule that constrains all future work rather than a thing to build |

---

## 0. The standing instructions

These are not features. They govern everything else, and an agent that breaks one has failed
the task however good the code is.

| # | instruction | source |
|---|---|---|
| S1 | **STANDING — Be creative, and make decisions without checking in.** "just make any further decisions that need to be made you don't have to check in with me. Be creative and make a rad game based on the ideas I've laid out." Ask only when the answer changes what gets built. | early session |
| S2 | **STANDING — A terse mandate is normal, not a licence to do less.** "go", "continue", "keep it going" mean *continue at full scope*, not *do a small increment*. | prompts 6, 7, 11, 16, 17, 18, 20 |
| S3 | **STANDING — Verify against the live artifact before saying done.** Load the URL, drive the game, read the result. Ted rarely checks mid-build and is the last line of defence otherwise. | `C:\Dev\CLAUDE.md` |
| S4 | **STANDING — Err on the side of over-explaining, and make it toggleable.** | prompt 24 |
| S5 | **STANDING — Symbolism drives mechanics.** A glyph's behaviour must be derivable from what the glyph *means*. Never assign a mechanic arbitrarily and dress it in a symbol afterwards. | prompts 5, 12, 24 |
| S6 | **STANDING — Impress him.** "Be creative and try to impress me!" Ambition is the brief. | prompt 24 |

---

## 1. Instruction, teaching and legibility — prompt 24

> *"all of our game modes are difficult to understand and control. I want you to err on the
> side of explaining too much and giving too many instructions (which should be toggleable on
> and off) like make sure I know how to fire off a power up in the gradius style game"*

| # | feature | status | where |
|---|---|---|---|
| F1.1 | A shared teaching layer usable by every game | **DONE** | `shared/help.js` |
| F1.2 | Always-on hint strip listing every control | **DONE** | `.help-strip`, on by default |
| F1.3 | A full manual: premise, goal, every control, every system | **DONE** | `H`, `?` or `F1` |
| F1.4 | A narrator that explains what just happened, in words | **DONE** | `HELP.say()` |
| F1.5 | **All of it toggleable**, and the choice remembered | **DONE** | `J` strip, `K` narrator, `localStorage` per game |
| F1.6 | **"How do I fire off a power-up"** answered without being looked for | **DONE** | its own manual section in Salamandra *and* Invaders; named in the hint strip of both |
| F1.7 | The same power-up gesture in both Gradius-like games | **DONE** | `Shift` spends the bar in Salamandra and Invaders alike |
| F1.8 | On-screen explanation of a block's property when you hit it | **DONE** | the readout panel names the glyph, its doctrine, its behaviour and the lesson |
| F1.9 | Teaching layer for Nova Heat and Circulatio | **DONE** | breath-window and press-Space-twice are each called out explicitly |
| F1.10 | A spoken/audio tutorial track | **OPEN** | — |
| F1.11 | Per-control contextual hints that fire the first time a situation arises | **OPEN** | e.g. first Mercury encountered → "this one flees; freeze it" |

---

## 2. The glyphs as mechanics — prompts 5, 12, 24

> *"I'm not seeing enough alchemical glyphs and the blocks should have different properties
> depending on the glyphs… like the jupiter block will expand when shot"*
> *"Each of the alchemy glyphs from alchemy blocks should eventually have mechanics"*
> *"the player demonstrating their knowledge of the glyphs by getting faced with challenges
> where knowledge of the alchemical symbolism will help them make the right choices"*

| # | feature | status | where |
|---|---|---|---|
| F2.1 | All 26 glyphs as blocks: 4 elements, 3 principles, 7 planets, 12 operations | **DONE** | `invaders/glyphs.js` |
| F2.2 | **Every property derived from the symbolism** | **DONE** | see the table below |
| F2.3 | **Jupiter expands when shot** — asked for by name | **DONE** | swells ×3, shoves neighbours, then bursts |
| F2.4 | Real alchemical glyphs on screen, not emoji | **DONE** | 🜂🜄🜁🜃🜍🜔☿☉☽♀♂♃♄ and the twelve signs |
| F2.5 | Knowledge of symbolism produces better play | **DONE** | gold only opens to gold; salt only to water; silver reflects all but silver; Mercury must be fixed before it can be struck |
| F2.6 | The property explained on screen as it happens | **DONE** | readout panel + narrator |
| F2.7 | Glyph properties in the other three games | **PARTIAL** | Salamandra has 10 masonry kinds × 11 matters; Nova Heat and Circulatio do not use the glyph table |
| F2.8 | Enemies (not just blocks) with glyph properties | **OPEN** | the 72 Goetia from `GoetiaRevEng`, each weak to its own planet and element |
| F2.9 | Zodiacal *timing* — an operation stronger in its own hour or season | **OPEN** | asked for as "astrological timing mechanics" in DESIGN Phase 3 |

### The property table as built

| glyph | doctrine | mechanic |
|---|---|---|
| 🜂 Fire | the active principle | ignites neighbours; the fire spreads on its own |
| 🜄 Water | universal solvent | dissolves armour within 2 cells |
| 🜁 Air | the vehicle | blast shoves neighbours sideways; opens lanes |
| 🜃 Earth | the fixed and heavy | falls and crushes what is beneath it |
| 🜍 Sulphur | the soul, what burns | ignites every block of its **own register**, boardwide |
| 🜔 Salt | the body, the ash | **grows** instead of breaking; only water unmakes it |
| ☿ Mercury | the volatile spirit | **flees** — teleports rather than dying; must be frozen first |
| ☉ Sol · gold | incorruptible | immune to everything except a gold shot |
| ☽ Luna · silver | the mirror | **reflects your shot back at you** unless the shot is silver |
| ☿ Mercurius · quicksilver | the metal that is a liquid | **splits in two** |
| ♀ Venus · copper | the bell metal | **rings** — triggers everything within 3 cells. The great chain-starter |
| ♂ Mars · iron | the war metal | **detonates** along its whole row and column |
| ♃ Jupiter · tin | the Greater Benefic, expansion | **swells** ×3, shoving neighbours, then bursts |
| ♄ Saturn · lead | the Greater Malefic, old and slow | absorbs damage; **slows** everything near it |
| ♈ Aries | calcination | burns the *properties* off neighbours, leaving inert ash |
| ♉ Taurus | congelation | **freezes** the board nearby — this is how you kill a Mercury |
| ♊ Gemini | separation | spawns a **mirrored twin** across the board |
| ♋ Cancer | solutio | **floods its row**, washing it downward |
| ♌ Leo | digestion | **devours a neighbour and becomes it** |
| ♍ Virgo | distillation | **splits into spirit above and residue below** |
| ♎ Libra | sublimation | **swaps places** with the furthest block |
| ♏ Scorpio | putrefaction | **infects** neighbours; the rot spreads by itself |
| ♐ Sagittarius | incineration | **pierces the whole column** beneath it |
| ♑ Capricorn | fermentation | **raises the recently dead — as gold** |
| ♒ Aquarius | multiplication | **copies whatever is beside it** |
| ♓ Pisces | projection | **transmutes everything within 3 cells into gold** |

---

## 3. Spells, power-ups and cascades — prompts 13, 24

> *"there should be a button to fire off spells like the special weapon options in many games"*
> *"the interactions between the players shooting and spell powers and the elemental /
> alchemical / astrological effects those shots have to create cascading 'rube goldberg' type
> effects when they strike the blocks or the enemies"*

| # | feature | status | where |
|---|---|---|---|
| F3.1 | A dedicated spell button | **DONE** | `Z` `X` `C`, plus clickable panels |
| F3.2 | A spell resource that refills | **DONE** | azoth, 100, +7.5/s, upgradeable |
| F3.3 | Three operations that are the actual art | **DONE** | SOLVE, COAGULA, PROJECTIO — *solve et coagula*, then the projection |
| F3.4 | Gradius power bar with capsules | **DONE** | 6 slots; `Shift` spends |
| F3.5 | **Cascading Rube Goldberg chains** | **DONE** | `invaders/cascade.js`; measured chains of **37** in ordinary play |
| F3.6 | Chains terminate and cannot hang the page | **DONE** | one trigger per block per chain; 400-effect cap |
| F3.7 | The chain length surfaced to the player | **DONE** | CHAIN badge, longest-chain HUD stat, narrator calls out chains ≥ 8 |
| F3.8 | Loaded matter changes the reaction | **DONE** | 7 ammunition types, keys `1`–`7` |
| F3.9 | Spells interacting *with* cascades (a spell that seeds a chain) | **PARTIAL** | PROJECTIO creates gold which changes what chains; no spell currently *triggers* a cascade directly |
| F3.10 | More spells — one per register, or per planet | **OPEN** | 3 now; the register-bound scheme in ALCHEMYBLOCKSHOOTER has 3, a planetary scheme would give 7 |
| F3.11 | Cascades in Nova Heat / Circulatio | **OPEN** | Nova Heat's lit lines are a natural chain substrate |

---

## 4. The tutorial / exhibition level — prompt 24

> *"In the initial level the player should have the opportunity to interact with all the
> different 'Alchemy blocks' and their properties, and try out all the different power ups and
> spells, in a sort of tutorial or exhibition mode."*

| # | feature | status | where |
|---|---|---|---|
| F4.1 | An opening level that is an exhibition, not a challenge | **DONE** | THE CABINET |
| F4.2 | **All 26 blocks present and reachable** | **DONE** | 26 labelled bays |
| F4.3 | Nothing can kill you there | **DONE** | `hurt()` returns immediately in cabinet mode |
| F4.4 | Blocks return after being destroyed, so you can retry with different matter | **DONE** | 3.5 s respawn per bay |
| F4.5 | Every spell available immediately | **DONE** | azoth is bottomless in the cabinet |
| F4.6 | Every power-up available immediately | **DONE** | the bar always has a capsule banked |
| F4.7 | Each bay labelled with what it is and what it does | **DONE** | short name always; full name + behaviour for the bay you stand under |
| F4.8 | A reference sheet available *during* play, not only in the tutorial | **DONE** | `Tab` — the glyph cabinet |
| F4.9 | Guided sequence — "now try water on the salt" | **OPEN** | the room is free-form; a directed path would teach faster |
| F4.10 | An exhibition mode for the other three games | **OPEN** | Salamandra especially: a masonry range |

---

## 5. Levels, modes and content — prompts 1–4, 9, 13, 15

Mostly delivered in `ALCHEMYBLOCKSHOOTER`; recorded here because the requirements are shared.

| # | feature | status | where |
|---|---|---|---|
| F5.1 | Metatron's Cube game | **DONE** | `novaheat/` |
| F5.2 | Kirby's Dream Course bounce game with a 3D world | **DONE** | `circulatio/` |
| F5.3 | Lettrist ruleset | **DONE** | Circulatio, key `4` |
| F5.4 | ~100+ levels from block configurations | **DONE** | 132 in ALCHEMYBLOCKSHOOTER |
| F5.5 | Boom Blox-style structural shooting | **DONE** | cannon mode, ALCHEMYBLOCKSHOOTER |
| F5.6 | Many control schemes | **DONE** | 8 in ALCHEMYBLOCKSHOOTER; 4 genres across this repo |
| F5.7 | A landing page of cards describing each level | **DONE** | ALCHEMYBLOCKSHOOTER level browser |
| F5.8 | A hub explaining all the games | **DONE** | this repo's root `index.html` |
| F5.9 | Hazards themed by element / planet / sign per area | **PARTIAL** | ALCHEMYBLOCKSHOOTER has them; this repo's waves vary by register but have no environmental hazards |
| F5.10 | 20+ monster designs from emblem cutouts | **PARTIAL** | 9 authored, 15 traced in ALCHEMYBLOCKSHOOTER |
| F5.11 | Levels *in this repo* beyond wave-scaling | **OPEN** | Invaders has the Cabinet plus procedural waves; no authored levels |

---

## 6. Graphics, effects, research — prompts 3, 9, 10, 12

| # | feature | status | where |
|---|---|---|---|
| F6.1 | Emblem cutouts as graphics | **PARTIAL** | ALCHEMYBLOCKSHOOTER |
| F6.2 | Colourful plates from OCCULTIMGDB as backgrounds | **DONE** | 165 plates, ALCHEMYBLOCKSHOOTER |
| F6.3 | Elemental lighting / fire / water / electrical effects | **PARTIAL** | particle bursts and flashes only in this repo |
| F6.4 | Research documents — `ELEMENTALEFFECTS.md`, `FREEASSETSTOEMULATE.md`, `GLYPHSTOPOWERUPS.md`, `ALCHEMICALPROCESSES.md` "and 20 other examples" | **PARTIAL** | ALCHEMYBLOCKSHOOTER has `docs/00`–`26`; this repo has the glyph table but not the effects research |
| F6.5 | A research → game-ideas → code pipeline | **DONE** | `C:\Dev\PIPELINE.md` |

---

## 7. Engineering rules learned the hard way

Violating these has already cost real time. They are in `VERIFIED.md` with the evidence.

| # | rule |
|---|---|
| E1 | **One animation loop, guarded.** Two `requestAnimationFrame` chains on one world double its speed. |
| E2 | **Clamp `dt` at BOTH ends.** A negative delta runs the world backwards and turns `cooldown -= dt` into an increment, silently disabling the gun. |
| E3 | **Resolve each entity once per frame.** Per-frame damage in a cull band cost three lives at once. |
| E4 | **Never let a game state be unreachable.** Salamandra could reach the end of its level and neither win nor lose, for ever. |
| E5 | **Debug hooks must be getters.** A captured array reference goes stale the moment the game reassigns it, and then the hook lies to you. |
| E6 | **A hidden browser pane reports `innerWidth: 0`** and suspends `requestAnimationFrame`. Five separate "bugs" have turned out to be this. Set a viewport before concluding anything. |
| E7 | **Bump the `?v=` on a changed script** or a cached browser keeps running the old one. |
| E8 | **Suspect the instrument before the game.** Four bugs in this project were in the test harness. |

---

## 8. The backlog, ordered

What an agent picking this up next should build, most valuable first.

1. **F2.8 — the Goetia as enemies.** 72 seals already exist in `GoetiaRevEng`. Each weak to its own planet and element makes the glyph knowledge matter against *enemies* and not only blocks. This is the single biggest unbuilt idea.
2. **F1.11 — first-encounter hints.** The teaching layer exists; it does not yet fire contextually the first time a player meets a Mercury or a Luna.
3. **F4.9 — a guided path through the Cabinet.** The room is free-form; five directed challenges would teach the system faster than free play.
4. **F3.10 — more spells.** Seven planetary operations rather than three.
5. **F5.11 — authored levels for Invaders**, in the manner of ALCHEMYBLOCKSHOOTER's 132.
6. **F6.3 — real elemental effects.** Fire, water and electrical rendering rather than coloured squares.
7. **F2.9 — zodiacal timing.** An operation that is stronger in its own hour.
8. **F4.10 — a masonry range for Salamandra**, the Cabinet's equivalent.
