# DECISIONS — Lettrism Shooter

## 2026-09-07 — kickoff

- **A subfolder of Four Alchemical Games, not its own repo.** Ted asked for "a subfolder with
  its own system files". It therefore deploys with the rest at
  `t3dy.github.io/AlchemyBlockInvaders/LETTRISMSHOOTER/` and reuses `../shared/help.js`.
- **The letter data is ADAPTED from TurkaGame, not re-derived.** `v2/data/letters.json` already
  builds each letter's primitives from checkable facts, and its census is asserted by its own
  build script. Re-deriving would risk the two projects drifting apart on the same claims.
  If TurkaGame's file changes, re-run the adaptation rather than hand-editing ours.
- **The eight primitives are carried over unchanged**, including their names. A player who
  learns AXIS here has learned it for the other project too.
- **Every op is pure.** They return a list of changes and never write. This is what makes the
  landing preview exact rather than approximate — the preview and the edit are the same call.
  It also made the solvability harness possible, which caught four broken chambers.
- **The abjad value is the price.** No balance number invented; the economy is the tradition's
  own arithmetic, compressed logarithmically above 10 so the thousand-letters stay usable.
- **A teaching chamber carries ONLY the letter it teaches.** The first draft put alif in every
  room for convenience and alif quietly solved three of them. Verified against now.
- **AXIS raises TWO cells, not four.** Four is taller than the player's jump, so the pillar was
  unclimbable and the tool was useless. Two is exactly the jump: you gain height by pillaring
  repeatedly, as in Minecraft.
- **A ward resists everything but the cut.** ASSIMILATE could originally clone empty air onto a
  ward and quietly unmake it, which destroyed the point of the severing letters.
- **The gate is not solid.** It was in the SOLID set, so the player was blocked from ever
  stepping into it and no chamber could be won.
- **No enemies in the first slice.** The shooter frame is established by the gun, the hazards
  and the fall; enemies are the next increment and are recorded as a known limit rather than
  half-built.

## 2026-09-08 — words

- **Built the word system**, which was the first open question below and is the idea that makes
  this a programming language rather than eight tools. Letters compose, execute right to left,
  and **break at a non-joining letter** exactly as the written word does.
- **A well-formed word costs a third less.** The only reward for vocabulary, and it makes
  knowing the orthography worth something mechanically rather than decoratively.
- **Twelve ordinary words recognised, with meanings shown, and no magical claim made for any.**
  They are vocabulary; the game says so.
- **A word acts along one row.** It cannot build a staircase. This is a real constraint and it
  forced chamber 6 to be redesigned around a horizontal problem (a field of fire) rather than a
  vertical one.
- **SEVER no longer cascades through a hazard.** A cut runs along the grain of a body; fire has
  no grain. While it did, one letter cleared a whole field and no word was ever needed.
- **Two new chambers**: THE TERRACE for RAISE, which had no chamber, and THE WRITTEN WORD, which
  is verified to have *no* single-letter solution.

## 2026-09-08 — action first

Ted: *"remember this is an action game first and foremost."* Correct, and the first two builds
were not. What changed:

- **Three enemy kinds, and two of them fight the EDITOR.** The MĀḤĪ unmakes your most recent
  edit; the KĀTIB writes walls in your way. Only the ḤĀRIS simply chases. Enemies that merely
  chased would have made this an action game with a puzzle bolted on; enemies that rewrite the
  world make the editing itself the fight.
- **Every edit is a bet on time.** The MĀḤĪ restores a cut ward in seconds, so you either work
  faster than it or stop to kill it. That tension did not exist before and it is the reason to
  play.
- **Picking up a letter no longer freezes the world.** A full-screen card is the wrong thing to
  put in front of somebody being chased. The narrator carries the same information and the card
  is a click away.
- **Hearts, not instant resets.** Three, with generous invulnerability, and death keeps your
  edits — the world you built stands.
- **Tuned down from the first pass:** three concurrent enemies rather than five, slower guards,
  longer spawn interval. A stationary player was dying five times in thirty seconds, which is
  not difficulty, it is a mobbing.
- **Enemies cannot lock a chamber.** The eraser only ever restores a tile to its original state
  and the scribe's walls are ordinary stone, which a shot opens. Neither can make a room
  unwinnable.

## 2026-09-08 (later) — the gun is the letter

- **Your shot takes its character from the letter you hold.** The letters were the editor and
  the gun was a separate dumb thing; unifying them is what makes the loaded letter matter every
  second instead of only when you stop to build. Nothing extra to learn — the shot comes from
  the same primitive as the edit.
- **A shot is always free.** An action game needs an unconditional basic attack. The abjad
  price stays on the edits, where it means something.
- **The gun keeps the letter's rule:** a severing shot opens a ward and no other shot does,
  exactly as the severing edit does.
- **Pick the most characterful primitive, not the first.** `primitives[0]` gave twelve letters
  the same shot and nobody the spread. Priority order now, with SEVER first.
- **A chain counter**, so skill has somewhere to show. It does not yet pay for anything, and
  that is written down as a limit rather than left implied.

## Open questions for Ted

- **Should the traditions' own attributions be shown beside the form-derived ones?** TurkaGame's
  `POWERSOFTHELETTERS.md` has planet, lunar mansion, nature and divine name per letter, with
  honesty labels. Showing them would make the letter card much richer, but they are
  period-and-tradition specific and the brief asks for that to be marked. Currently the card
  shows only the period-neutral facts of form and grammar.
- **Should letters be spendable-and-lost, or permanent once collected?** Currently permanent,
  paid for from a regenerating breath. Consumable tiles would make routing a resource puzzle.
- **Should a word be able to act vertically?** It currently writes along one row. Letting a
  word descend, or follow the cursor's drag, would let words express climbing puzzles — but
  writing is horizontal, so there is a fidelity cost to be weighed.
- **Should the abjad SUM of a word matter?** Gematria is the obvious next layer: a word whose
  total equals another word's total might do that word's work. It is well attested and it would
  make the arithmetic worth learning, but it needs sources rather than invention.
