# Lettrism Shooter

**The developer mode of reality.** A side-scrolling shooter in which the world is editable and
the Arabic alphabet is the editor.

Al-Būnī calls the twenty-eight Arabic letters the *corporeal letters* — "the building blocks of
manifest reality" — and Ibn Turka treats the alphabet as the cosmos's source code. So here the
alphabet is not the theme. It is the level editor.

You collect tiles bearing the letters, and each grants the world-edit that its own written form
dictates. A single upright stroke **raises a pillar**. A closed loop **bridges a chasm**. A
descending tail **opens a channel** through solid matter. Dots above lift the ground, dots below
sink it. And the six letters that never join what follows — which is simply why an Arabic word
looks like several pieces on the page — **cut**, and are the only thing that opens warded stone.

You cannot shoot your way to the gate. Ordinary stone yields to a shot; a ward does not, a
chasm cannot be shot across, a ledge cannot be shot up to. You have to edit the world.

## Controls

| | |
|---|---|
| `A` `D` | walk |
| `W` | jump |
| `Space` | shoot — opens ordinary stone, nothing else |
| mouse | aim the edit cursor; the ghost shows exactly what will happen |
| click / `F` | **commit the edit** |
| `1`–`9` | choose a letter you are carrying |
| `C` | **add it to a word** |
| `Enter` | write the word |
| `Backspace` | unmake the word |
| `Q` `E` | cycle letters |
| `Tab` | the codex of all twenty-eight |
| `R` | restart the chamber |
| `H` | the full manual |

## The eight edits

| the fact about the letter | what it does |
|---|---|
| a single upright stroke | **AXIS** — raise a two-cell pillar |
| n dots above | **RAISE** — lift the ground |
| n dots below | **LOWER** — sink the ground |
| a closed form | **BIND** — bridge a gap into one body |
| a descending tail | **POUR** — open a channel through matter |
| never joins what follows | **SEVER** — cut; the only thing that opens a ward |
| a sun letter | **ASSIMILATE** — the target becomes what is beside it |
| a moon letter | **DISTINGUISH** — ward it against all further change |

Nothing was assigned by taste — every power is derived from a fact anyone can check against a
grammar. A letter's **abjad value is what its edit costs**, so the economy is the tradition's
own arithmetic too.

## Words

A single letter is one tool. A word is a program. Press `C` to add the letter you hold to a
word, up to four, then `Enter` to write it — each letter fires one cell further left, as Arabic
is written.

**And the orthography is the control flow.** Six letters — ا د ذ ر ز و — never join what
follows, so a word *breaks* at one of them: everything up to it runs and the rest is lost.
That is simply why a written Arabic word looks like several pieces on the page.

| | | |
|---|---|---|
| **باب** | *bāb*, door | breaks after the alif, as the written word does |
| **درب** | *darb*, path | breaks after the dāl, immediately |
| **قمر** | *qamar*, moon | every letter joins — it runs whole |
| **جبل** | *jabal*, mountain | runs whole |

A word that runs whole is **well-formed** and costs a third less. Put alif anywhere but last
and you will lose the rest of what you wrote.

## Provenance

Built on the lettrist engine from [TurkaGame](../../TurkaGame/), a research project on Ṣāʾin
al-Dīn ʿAlī ibn Turka Iṣfahānī (1369–1432) and the Islamicate science of letters. The letter
data is adapted from that project's `v2/data/letters.json`, which derives each letter's
primitives from its form and grammar rather than from a table someone chose.

A side project of [Four Alchemical Games](../).
