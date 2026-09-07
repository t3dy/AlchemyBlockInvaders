# CIRCULATIO — a bounce engine whose physics is a metaphysics

> Infrastructure for 3D bounce-course games in the Kirby's Dream Course line: you are the
> ball, you strike yourself around an isometric course with pool shots and lofted jumps,
> every body you touch is cleared, and when one remains it becomes the cup.
>
> The engine-level idea comes from the lettrist-game-engine notes in `TurkaGame/`:
> **a historical metaphysical system is not a skin on the physics, it is the physics.**

---

## 1. Why this shape

Two things in the brief turned out to be the same requirement, and the whole architecture
falls out of noticing that:

- **Kirby's Dream Course** needs a shot preview — you must see the line before you commit.
- The **lettrist engine notes** demand "landing previews": the player must see what an
  operation will do to the world *before* they write it, and §5 asks for these to be "much
  richer than just a ghost block."

A preview that is a separate approximation drifts from the real physics and lies to the
player. So `physics.js` is written as a **pure module** — no imports, no Three.js, no
globals — and the preview is the real simulation run forward on a cloned ball. Measured
drift between the previewed endpoint and the played endpoint is **1.0 × 10⁻⁵ world units**,
which is float noise. What you are shown is what happens.

The same purity makes the engine testable headlessly at a fixed timestep, which is how
everything in §6 was actually measured rather than eyeballed.

---

## 2. Rulesets are the physics

`rules.js` defines four metaphysical rulesets. Each supplies the *complete* constant set
that `physics.js` reads: gravity, restitution, friction, air drag, rolling friction, Magnus
coefficient, spin bite, settle and stop thresholds. Selecting one does not adjust difficulty;
it changes what the world is.

| Ruleset | Reading | Full-power roll | Provenance |
|---|---|---|---|
| **ARISTOTELIAN** | Heavy bodies seek their natural place and stop when they arrive. Strong gravity, dead bounces, ground that grips. | 9.8 u | INTERPRETATION |
| **PARACELSIAN** | *Tria prima*, with Mercury the volatile dominant. Slippery, rebounds hard, long lines possible, stopping where you meant to is not. | 15.2 u | INTERPRETATION |
| **IKHWĀN / PYTHAGOREAN** | Number and consonant ratio are the armature of the cosmos. Every rebound snaps to a musical ratio (1:2, 2:3, 3:4, 8:9), so bounce heights walk a scale and long bounce chains become *plannable*. | 15.6 u | INTERPRETATION |
| **LETTRIST** | The alphabet is the substrate, not the description. Global constants go slack; local law is whatever letter is inscribed on the tile you are touching. | 13.5 u | GAME FICTION |

Measured on an isolated flat plane, ball radius 0.32, max shot speed 17.5 u/s, course span
12–17 u. Aristotelian deliberately cannot cross a course in one shot; Paracelsian can.

**Provenance is tracked on every ruleset, letter and power** — `SOURCE` /
`INTERPRETATION` / `GAME FICTION` — and displayed in the player-facing frame, following the
discipline in the TurkaGame notes: never let a good mechanic pass itself off as a source.
The Pythagorean *reading* of bounce ratios is ours; the Ikhwān's arithmetic-and-music
epistles are real. The panel says which is which.

---

## 3. Letters as the instruction set

Under the lettrist ruleset the physics asks, per contact, "what is written here?" — which is
exactly the query the notes ask for (*"What does ب do under the current metaphysical
ruleset?"*). `rules.js` answers it from a data table, not from hard-coded logic.

| | Letter | Abjad | Element | Operation |
|---|---|---|---|---|
| ا | alif | 1 | fire | tile becomes **aether** — near-frictionless, near-elastic |
| ب | bāʼ | 2 | earth | tile becomes **chalk** — heavy grip, dead rebound |
| ج | jīm | 3 | water | tile becomes **glass** — slick, the ball slides on |
| م | mīm | 40 | water | tile becomes **pitch** — swallows momentum outright |
| ن | nūn | 50 | air | tile becomes a **bumper** — returns more than it receives |

Each carries two provenance tags: one for the *historical gloss* (SOURCE) and one for the
*game operation* (GAME FICTION). The gloss is attested; the physical mapping is invented,
and says so.

**This is deliberately the shallowest rung** of the ladder in the notes — letters
manipulating materials (level 3 of 7). The deeper rungs (letters manipulating processes,
then rules, then the world's grammar) hang off the same table without restructuring: a
letter's `operation` is data, and `materialOverride` is already a per-contact hook.

Colliders are stored **one box per tile, deliberately unmerged**, because an inscription
rewrites a single tile's law and tiles must stay individually addressable.

---

## 4. Powers

Alchemical operations and sacred-geometry figures. Each changes *what a shot can do* rather
than adding a number, and each is applied on top of the ruleset so it reads the same under
every metaphysics.

- **CALCINATIO** — fire dries pitch: tiles the ball touches stop being traps, permanently.
- **SOLUTIO** — friction cut to a quarter. A long ricocheting run.
- **SUBLIMATIO** — one upward impulse in mid-flight, on command. The second jump.
- **COAGULATIO** — no rebound at all, 1.5× gravity. Stops nearly where it lands.
- **VESICA** — the shot splits into two mirrored balls, both really simulated; either may
  take the cup, and on settling the better-placed one is kept.
- **MER-KA-BA** — gravity suspended for one second of flight. The straight line.

---

## 5. Course format

A course is a **text height-map** plus a short feature list. Two authoring paths, both
supported on purpose:

```
'444444444444'     .    void — the ball falls through
'411111111114'     0-9  floor height, in UNIT (0.7) steps
'411222222114'
'412..1111124'     optional parallel `mats` grid:
'412..1111124'       g glass   c chalk   p pitch   a aether
```

`THE TABLET` is hand-written like this. `THE VESSEL` is generated by a function, for a round
flask shape a character grid is bad at. Both compile to the same colliders through
`buildColliders`, then into a spatial-hash broadphase — without which the preview, which
runs several hundred real simulation steps every time the aim changes, would test all 217
colliders at each of them.

---

## 6. Verification record

Run headlessly in-browser against the shipped constants.

| Check | Result |
|---|---|
| Preview endpoint vs played endpoint | drift **1.0e-5 u** — the preview is the simulation |
| 240 shots, 4 rulesets, random yaw/power/loft | 232 settled on a surface, 8 fell into the void (by design), **0 sank into geometry, 0 never settled** |
| Deepest penetration into a block | **0.000 u** — no tunnelling |
| Flat-plane roll distance | distinct and monotonic per ruleset (table in §2) |
| Bounces on a flat roll | 0 — no phantom contacts |
| Full loop | bodies cleared → last becomes cup → ball enters → "FIXED, 2 strokes against par 5" |
| Ruleset / letter / camera / mode key paths | all update state and panel |
| Inscription resolution | `ba` on a tile resolves to **chalk under LETTRIST, stone under ARISTOTELIAN** |

### Bugs found and fixed during verification

1. **Rolling friction was a per-frame percentage** (`pow(1-μ, dt*60)`), so at 60 fps a
   full-power shot died inside a single tile. Reworked as Coulomb deceleration
   (`μ · rollDrag · gravity`, in units/s²), which also makes "how far does a full shot roll"
   a tunable number per metaphysics instead of an accident of the frame rate.
2. **Impact friction was charged on every resting contact.** A ball sitting on a floor
   re-contacts it every substep; taxing each one compounded to roughly −14 % per substep.
   Tangential friction now applies only when normal speed exceeds the settle threshold.
3. **`loadCourse` never cleared `lastRest`**, so a "fresh" course spawned the ball wherever
   the previous run ended — in testing, wedged against a wall, unable to move.
4. **The cup rule only fired on a kill**, so a course authored with a single body would
   never open its cup. `maybeMakeCup()` now also runs at load.
5. **Magnus curve used a half-updated velocity** — `vel.x` was modified, then read back for
   the `vel.z` term. Cached both first.
6. **No shot timeout.** Between a bumper and a wall a ball can trade energy for a very long
   time. Shots now damp at 9 s and force-settle at 13 s.
7. **THE TABLET's spawn sat with its pit square between the ball and every body** — every
   line fell in. Moved.

---

## 7. Known limits

- **Ramps are a clipped plane, not a solid.** Their sides and back face are not collidable,
  so a ramp's high end must be authored flush against a block. Documented in
  `physics.js: ramp()`.
- **Void falls replace the ball where it was struck from**, standard mini-golf behaviour —
  which means a player repeating an identical bad shot loops. Fine for a human, a trap for
  a scripted bot.
- **Course difficulty is not tuned.** The engine is verified; the two courses are
  demonstrations of the two authoring paths, not balanced holes. `THE VESSEL`'s middle
  shelf currently wants an air shot or a ramp approach, and par 5 is a guess.
- **No audio, no mobile controls.**

## 8. Not yet built

Camera zoom; a proper in-page course editor writing the character grid; letters that
manipulate *processes* and *rules* rather than materials; a second board geometry; enemy
behaviours (bodies are currently static targets); chain/combo scoring for clearing several
bodies in one shot, which this genre lives on.
