# DESIGN — Lettrism Shooter

## The thesis

From TurkaGame's brief, in Ted's words: *"lettrism as a programming language, not just a theme
— a level editor or Minecraft sort of thing but in the developer mode of reality."*

The sources support it outright. Al-Būnī's twenty-eight **corporeal letters** are "the building
blocks of manifest reality"; Ibn Turka treats the Arabic alphabet as the cosmos's source code,
which is why for him lettrism is simultaneously mathematics, physics and worship. So the
alphabet is not the decoration on this game's puzzles. **It is the instruction set.**

The shooter frame is what makes it a game rather than a toy: you are being shot at while you
edit, ordinary stone yields to a bullet so shooting is never useless, and the things that
matter — wards, chasms, ledges — cannot be shot at all. **The gun handles matter. The alphabet
handles the world.**

## The one rule, and why it is the whole design

**A letter's power is derived from a checkable fact about its written form or its grammar.**

This is inherited from TurkaGame and it is the difference between a game about lettrism and a
game with Arabic letters on it. The player who notices that ب has a dot below and ت has two
above can *predict* what each does before picking it up. Nothing is arbitrary and nothing has
to be memorised.

| the fact | the power | the world edit | letters |
|---|---|---|---|
| a single upright stroke | AXIS | raise a two-cell pillar | 2 |
| n dots above | RAISE | lift the ground n cells | 12 |
| n dots below | LOWER | sink the ground n cells | 3 |
| a closed form | BIND | bridge a gap into one body | 9 |
| a descending tail | POUR | open a channel through matter | 17 |
| never joins what follows | SEVER | cut — the only thing that opens a ward | 6 |
| a sun letter | ASSIMILATE | the target becomes what is beside it | 14 |
| a moon letter | DISTINGUISH | ward it against all further change | 14 |

The census falls out of the alphabet. It is not a balance decision and it must keep adding up.

### The best of these is the plainest

**A written Arabic word is one rigid body, and the six non-joining letters ا د ذ ر ز و are
where it breaks** — which is simply why a word looks like several pieces on the page. Here that
has two consequences, and they are the same fact seen twice:

- those six are the only letters that **cut a ward**, so the letters that break things are the
  letters that get you past a boundary;
- build with one and the work tends to **fracture at its end**, which is a real cost.

## The landing preview

Ted asked for "landing previews of the effects they might have on the world". Every op is
**pure** — it takes the world and a target and returns a list of changes without writing
anything. So the preview is not an approximation of what will happen; it is the identical
calculation, drawn instead of applied. Gold ghost blocks with a gold outline mean it will work;
a red cross means that letter does nothing there, and the panel says why in words.

That purity is the single most important architectural decision in the project. It also makes
the solver possible.

## The abjad is the economy

Every letter has a numerical value in the abjad reckoning and that value is what its edit costs
from your breath, which regenerates. Alif is 1 and nearly free — which is right, since it is
the letter of the One and the beginning of creation. Rāʾ is 200 and costs 26. The scale is
compressed logarithmically above 10 so the thousand-letters are expensive rather than unusable.

**No balance number was invented.** The price list is the tradition's own arithmetic.

## The chambers

Seven, each teaching one thing, the last combining them.

| # | name | teaches | the problem |
|---|---|---|---|
| 1 | THE UPRIGHT | AXIS | a ledge you cannot jump to |
| 2 | THE CHASM | BIND | a gap too wide to cross |
| 3 | THE WARD | SEVER | warded stone that shooting cannot touch |
| 4 | THE FLOOR | POUR / LOWER | the way on is beneath you |
| 5 | THE TERRACE | RAISE | a floor you cannot climb — lift it instead of building on it |
| 6 | THE WRITTEN WORD | words | five cells of fire; one letter clears one cell |
| 7 | THE WHOLE ART | everything | a ward, a chasm and a ledge, no instruction |

**A teaching chamber carries only the letter it teaches.** The first draft put alif in every
room for convenience and alif quietly solved three of them, which destroyed the lesson. The
verification asserts this now.

## Verification — chambers are proved, not eyeballed

Four of the five chambers in the first draft were unsolvable and looked fine. The model:

- **reachability** is a flood fill using the player's real movement — walk on solid ground,
  jump two cells, fall any distance, step off ledges;
- a chamber is **solvable** if some sequence of legal edits makes the gate reachable from the
  start;
- a teaching chamber must be solvable **only by the primitive it teaches**.

Paste into the page and run after any map or op change:

```js
window.__reach = function (w, sx, sy) {
  const seen=new Set(), q=[[sx,sy]], key=(x,y)=>x+','+y;
  const free=(x,y)=>!isSolid(at(w,x,y))&&at(w,x,y)!==T.HAZARD;
  const grounded=(x,y)=>isSolid(at(w,x,y+1));
  if(!free(sx,sy))return seen; seen.add(key(sx,sy)); let gd=0;
  while(q.length&&gd++<5000){ const[x,y]=q.pop();
    const push=(nx,ny)=>{ if(nx<0||ny<0||nx>=w.cols||ny>=w.rows)return; if(!free(nx,ny))return;
      const k=key(nx,ny); if(seen.has(k))return; seen.add(k); q.push([nx,ny]); };
    if(!grounded(x,y)){ push(x,y+1); continue; }
    push(x-1,y); push(x+1,y);
    for(let up=1;up<=2;up++){ if(!free(x,y-up))break; push(x,y-up); push(x-1,y-up); push(x+1,y-up);
      if(up===2){ push(x-2,y-up); push(x+2,y-up); } }
    push(x-1,y+1); push(x+1,y+1);
  } return seen;
};
window.__gateOf = w => { for(let y=0;y<w.rows;y++) for(let x=0;x<w.cols;x++)
  if(at(w,x,y)===T.GATE) return {x,y}; return null; };
window.__startOf = ch => { for(let y=0;y<ch.map.length;y++){
  const x=ch.map[y].indexOf('@'); if(x>=0) return {x,y}; } return {x:0,y:0}; };
// depth 1, per chamber, reporting WHICH letter+op solves it
window.__d1 = function (i) {
  LS.loadChamber(i);
  const ch=LS.CHAMBERS[i], w=LS.world, st=__startOf(ch), g=__gateOf(w);
  const wins=()=>__reach(w,st.x,st.y).has(g.x+','+g.y);
  if(wins()) return { chamber:i+1, name:ch.name, trivial:true };
  const byOp={};
  for(const gl of ch.letters){ const L=LS.BY_GLYPH[gl]; if(!L) continue;
    for(const op of L.primitives)
      for(let y=0;y<w.rows;y++) for(let x=0;x<w.cols;x++){
        const snap=w.g.slice(); const p=planEdit(w,L,op,x,y);
        if(!p.ok) continue; applyEdit(w,p);
        if(wins()) byOp[L.glyph+' '+op]=(byOp[L.glyph+' '+op]||0)+1;
        w.g.set(snap);
      } }
  return { chamber:i+1, name:ch.name, teaches:ch.teaches, solvedBy:byOp };
};
[0,1,2,3].map(__d1)      // chamber 5 needs a budgeted depth-2; see below
```

The last run is recorded under *Seven chambers* below.

**Do not run this unbounded at depth 3.** It is ~10¹⁰ operations on one thread and it wedges
the tab so completely that even navigating away times out. Chambers needing more than one edit
were checked with a depth-2 search under a budget; chamber 6 was checked by enumerating every
ordered triple of its letters as a word.


## Words — letters in sequence

A single letter is one tool. **A word is a program**, and this is what makes the alphabet an
instruction set rather than a toolbar.

`C` adds the held letter to a word, up to four; `Enter` writes it. Each letter fires in turn,
one cell further **left** each time, because that is the direction Arabic is written. Each step
sees the world the previous step left, so a word composes.

### The orthography is the control flow

Six letters — **ا د ذ ر ز و** — never join what follows. A word **breaks** at such a letter:
everything up to and including it runs, and the rest is lost. This is not invented for the
game; it is why a written Arabic word looks like several pieces on the page.

| word | | breaks |
|---|---|---|
| **باب** | *bāb*, door | after the alif, exactly as the written word does |
| **درب** | *darb*, path | after the dāl, immediately — almost nothing runs |
| **نور** | *nūr*, light | after the wāw |
| **قمر** | *qamar*, moon | never — every letter joins, it runs whole |
| **جبل** | *jabal*, mountain | never |

**A word that runs whole is well-formed and costs a third less.** That is the only reward for
vocabulary and it is a real one: a player who knows how a word is written knows *before writing
it* how much of it will run. The lesson in play is sharper still — put alif anywhere but last
and you lose the rest of the word.

The preview draws it: the letters that will run are outlined in gold with their glyph, the ones
that will be lost are dashed in red.

Twelve ordinary words are recognised and their meanings shown. **No magical claim is made for
any of them** — they are vocabulary, and showing what they mean keeps the alphabet legible.

## Seven chambers

| # | name | teaches | verified |
|---|---|---|---|
| 1 | THE UPRIGHT | AXIS | `ا AXIS` only, 4 placements |
| 2 | THE CHASM | BIND | `م BIND` only, 27 placements |
| 3 | THE WARD | SEVER | `ر SEVER` only, 2 placements |
| 4 | THE FLOOR | POUR | `ج LOWER` 24 and `ج POUR` 16 — both jīm's own features |
| 5 | THE TERRACE | RAISE | needs **two** lifts; the tool repeats |
| 6 | THE WRITTEN WORD | words | **0 single-letter solutions, 42 word solutions** |
| 7 | THE WHOLE ART | everything | solvable in 2 edits |

Chamber 6 is the one that had to be forced. Three earlier drafts were solvable by a single
letter, which defeated the point:

- a five-cell field of fire is too wide for any one edit to clear;
- **SEVER no longer cascades through a hazard.** A cut runs along the grain of a *body* — but
  fire has no grain, and while it did cascade, one alif opened the whole field and did a word's
  work.


## It is an action game first

Ted's correction, and it was right: the first build was a puzzle game with a gun in it. An
editor is only interesting **under pressure**, so the world fights back — and two of the three
things that come for you fight the *editor* rather than the player. That is the whole idea:
you are in an argument with something else that can also rewrite the world, and you have to
out-write it.

| | | what it does |
|---|---|---|
| **ḤĀRIS** ح | the guard | runs you down. Straightforward, and shootable. This is the clock. |
| **MĀḤĪ** م | the eraser | **hunts your most recent edit and unmakes it.** It will not touch you — it does not have to. It draws a dashed line to what it is coming for, so the threat is readable. |
| **KĀTIB** ك | the scribe | keeps its distance and writes walls across your path. |

Named for what they do: *ḥāris* a guard, *māḥī* an effacer, *kātib* a writer.

**What this changes about the editing.** Every edit is now a bet on time. Cutting a ward takes
one letter, but the MĀḤĪ will restore it in seconds, so you must either work faster than it or
kill it first — and killing it means stopping editing. The chambers escalate: chamber 1 has one
guard; the finale has four of all three kinds.

**Verified:** a player who stands still dies five times in thirty seconds; a player who turns
and shoots gets five kills, no deaths and full health over forty. The difficulty rewards
playing, which is the test. The eraser was watched restoring a ward 0.3 seconds after reaching
it.

### What had to go for this to be an action game

**Picking up a letter no longer opens a card.** It opened a full-screen explanation that froze
the world, which is the wrong thing to do to somebody being chased. The narrator says what the
letter does instead, and the card is one click away on the tile. The teaching is unchanged; it
just no longer stops the game to deliver it.

**A hit costs a heart rather than resetting you.** Three hearts, generous invulnerability
frames, and death returns you to the entrance **with your edits intact** — the world you built
stands, which keeps a long chamber from punishing you twice.

## Known limits

- **Three enemy kinds, no boss.** Enough for pressure; not enough for a fight with a shape.
- **Seven chambers.** ASSIMILATE and DISTINGUISH still have no chamber of their own.
- **The bot's platforming is crude**, so the end-to-end playthrough proves the mechanics and
  the gate rather than a clean human run.
- **Twenty-eight letters, six in play.** The codex shows all of them; the chambers hand out
  ا م ر ج ب ن.
- **Words are at most four letters** and act along one row. A word cannot build a staircase,
  which is a real constraint on what puzzles they can express — chamber 6 had to be redesigned
  around a horizontal problem once that became clear.
- **No Ottoman/medieval register split yet.** TurkaGame's brief asks for attributions to be
  marked by period and tradition; this project shows the form-derived facts only, which are
  period-neutral, and does not yet show the traditions' own attributions beside them.
