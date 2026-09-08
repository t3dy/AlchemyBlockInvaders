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
