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

Five, each teaching one primitive, the last combining them.

| # | name | teaches | the problem |
|---|---|---|---|
| 1 | THE UPRIGHT | AXIS | a ledge you cannot jump to |
| 2 | THE CHASM | BIND | a gap too wide to cross |
| 3 | THE WARD | SEVER | warded stone that shooting cannot touch |
| 4 | THE FLOOR | POUR / LOWER | the way on is beneath you |
| 5 | THE WHOLE ART | everything | a ward, a chasm and a ledge, no instruction |

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

**Last run, 2026-09-07:**

| chamber | teaches | solved by |
|---|---|---|
| 1 THE UPRIGHT | AXIS | `ا AXIS` only, 4 placements |
| 2 THE CHASM | BIND | `م BIND` only, 27 placements |
| 3 THE WARD | SEVER | `ر SEVER` only, 2 placements |
| 4 THE FLOOR | POUR | `ج LOWER` 24 and `ج POUR` 16 — both are jīm's own features (dots below, a tail), so both are legitimate |
| 5 THE WHOLE ART | all | solvable in 2 edits (`ا AXIS` ×2, going *over* the ward rather than through it) |

**Do not run this unbounded at depth 3.** It is ~10¹⁰ operations on one thread and it wedges
the tab so completely that even navigating away times out. Chamber 5 was checked with a
depth-2 search under a 12-second budget.

## Known limits

- **No enemies yet.** The shooter half is currently only the gun and the terrain; the tension
  comes from hazards and from falling. Enemies that damage the world, or that repair it behind
  you, are the obvious next thing and would make the editor matter under pressure.
- **Five chambers.** Enough to teach the eight primitives, not enough to exhaust them —
  RAISE, ASSIMILATE and DISTINGUISH have no chamber of their own.
- **The bot's platforming is crude**, so the end-to-end playthrough proves the mechanics and
  the gate rather than a clean human run.
- **Twenty-eight letters, five in play.** The codex shows all of them; the chambers hand out
  ا م ر ج ب.
- **No Ottoman/medieval register split yet.** TurkaGame's brief asks for attributions to be
  marked by period and tradition; this project shows the form-derived facts only, which are
  period-neutral, and does not yet show the traditions' own attributions beside them.
