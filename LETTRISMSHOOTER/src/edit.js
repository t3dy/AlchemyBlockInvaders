// ===================================================================
// THE EIGHT EDITS — lettrism as a level editor
//
// The premise, taken from TurkaGame: the Arabic alphabet is not the
// THEME of this game, it is its instruction set. Al-Buni's twenty-eight
// "corporeal letters" are the building blocks of manifest reality, so
// here they are literally the building blocks — a Minecraft-ish toolkit
// for editing the world while you are being shot at.
//
// The rule that keeps this honest is TurkaGame's, and it is stricter
// than any tradition's: WHAT A LETTER DOES IS DERIVED FROM ITS WRITTEN
// FORM, not assigned by taste. Anyone with a grammar can check it.
//
//   a single upright stroke        AXIS         raise a pillar
//   n dots above                   RAISE n      lift the ground n cells
//   n dots below                   LOWER n      sink the ground n cells
//   a closed loop                  BIND         bridge a gap into one body
//   a descending tail              POUR         open a channel through
//   never joins what follows       SEVER        cut — the only thing that
//                                               opens warded stone
//   a sun letter (lam assimilates) ASSIMILATE   clone the material beside it
//   a moon letter (lam stays)      DISTINGUISH  ward it; reveal what is hidden
//
// The census falls out of the alphabet rather than being chosen:
// AXIS 2 · LOWER 3 · SEVER 6 · BIND 9 · RAISE 12 · ASSIMILATE 14 ·
// DISTINGUISH 14 · POUR 17.
//
// EVERY OP IS PURE. It takes the world and a target and returns a list
// of changes; it never writes. That is what makes the landing preview
// possible: the same call that would edit the world can instead be
// drawn as a ghost, so you always see what a letter will do before you
// spend it.
// ===================================================================

const T = {
  EMPTY: 0,
  STONE: 1,     // ordinary matter. Most edits work on it
  WARD:  2,     // warded stone. ONLY SEVER opens it — the boundary letters
  FLOW:  3,     // a channel: passable, and things fall through it
  GLASS: 4,     // bound matter: solid, but it remembers it was two things
  HAZARD:5,     // kills on contact; can be severed or poured away
  GATE:  6      // the lock at the end of a chamber
};

const TILE_NAME = {
  0: 'empty', 1: 'stone', 2: 'warded stone', 3: 'channel',
  4: 'bound matter', 5: 'hazard', 6: 'gate'
};

// The gate is deliberately NOT solid. It is a cell you walk INTO to win,
// and while it was in this set the player was blocked from ever entering
// it, which made every chamber unwinnable.
const SOLID = { 1: true, 2: true, 4: true };
function isSolid(t) { return !!SOLID[t]; }

// ---------- the world ----------
function makeWorld(cols, rows) {
  return { cols: cols, rows: rows, g: new Uint8Array(cols * rows) };
}
function at(w, x, y) {
  if (x < 0 || y < 0 || x >= w.cols || y >= w.rows) return T.WARD;   // outside is warded
  return w.g[y * w.cols + x];
}
function setAt(w, x, y, v) {
  if (x < 0 || y < 0 || x >= w.cols || y >= w.rows) return;
  w.g[y * w.cols + x] = v;
}

// ===================================================================
// The ops. Each returns { changes:[{x,y,to,from}], ok, why }
// `why` is what the game prints so the player learns the rule.
// ===================================================================

function opAXIS(w, x, y, n) {
  // A single upright stroke holds a frame. Raise a short column of stone
  // from the target down to whatever it lands on — the only way to build
  // UP. Deliberately TWO cells, which is exactly the player's jump: you
  // gain height by pillaring repeatedly, as you would in Minecraft, not
  // by one free lift. A taller pillar would be unclimbable and the tool
  // would be useless, which is what the first build got wrong.
  const changes = [];
  const height = Math.max(1, Math.min(3, n || 2));
  for (let i = 0; i < height; i++) {
    const yy = y + i;
    if (yy >= w.rows) break;
    const cur = at(w, x, yy);
    if (isSolid(cur)) break;                 // it lands on what is already there
    changes.push({ x: x, y: yy, to: T.STONE, from: cur });
  }
  return changes.length
    ? { ok: true, changes: changes, why: 'the upright stroke stands: a pillar of ' + changes.length }
    : { ok: false, changes: [], why: 'there is already something standing here' };
}

function opRAISE(w, x, y, n) {
  // Dots above lift. The column of ground under the target rises n cells.
  const changes = [];
  const lift = Math.max(1, Math.min(4, n || 1));
  let top = y;
  while (top < w.rows && !isSolid(at(w, x, top))) top++;
  if (top >= w.rows) return { ok: false, changes: [], why: 'nothing beneath to lift' };
  for (let i = 1; i <= lift; i++) {
    const yy = top - i;
    if (yy < 0) break;
    const cur = at(w, x, yy);
    if (isSolid(cur)) continue;
    changes.push({ x: x, y: yy, to: at(w, x, top), from: cur });
  }
  return changes.length
    ? { ok: true, changes: changes, why: 'the dots above lift the ground ' + changes.length }
    : { ok: false, changes: [], why: 'the ground cannot rise further' };
}

function opLOWER(w, x, y, n) {
  // Dots below drop. Sink the ground: dig down, open a floor.
  const changes = [];
  const drop = Math.max(1, Math.min(4, n || 1));
  let top = y;
  while (top < w.rows && !isSolid(at(w, x, top))) top++;
  if (top >= w.rows) return { ok: false, changes: [], why: 'nothing beneath to sink' };
  for (let i = 0; i < drop; i++) {
    const yy = top + i;
    const cur = at(w, x, yy);
    if (cur === T.WARD) break;                  // warded stone does not sink
    if (!isSolid(cur)) break;
    changes.push({ x: x, y: yy, to: T.EMPTY, from: cur });
  }
  return changes.length
    ? { ok: true, changes: changes, why: 'the dots below sink the ground ' + changes.length }
    : { ok: false, changes: [], why: 'warded stone does not sink' };
}

function opBIND(w, x, y) {
  // A closed form joins what stands across the line into ONE body.
  // Bridge the gap between the two nearest solids on this row.
  let L = x, R = x;
  while (L >= 0 && !isSolid(at(w, L, y))) L--;
  while (R < w.cols && !isSolid(at(w, R, y))) R++;
  if (L < 0 || R >= w.cols) return { ok: false, changes: [], why: 'a bond needs something on both sides' };
  if (R - L < 2) return { ok: false, changes: [], why: 'there is no gap here to bind' };
  if (R - L > 10) return { ok: false, changes: [], why: 'too wide a gap for one bond' };
  const changes = [];
  for (let xx = L + 1; xx < R; xx++) changes.push({ x: xx, y: y, to: T.GLASS, from: at(w, xx, y) });
  return { ok: true, changes: changes, why: 'the closed loop binds ' + changes.length + ' cells into one body' };
}

function opPOUR(w, x, y) {
  // A descending tail lets what is above pass down through. The target
  // and what sits under it become a channel: passable, and things fall.
  const changes = [];
  for (let i = 0; i < 4; i++) {
    const yy = y + i;
    const cur = at(w, x, yy);
    if (cur === T.WARD) break;
    if (cur === T.EMPTY) { if (i === 0) continue; else break; }
    changes.push({ x: x, y: yy, to: T.FLOW, from: cur });
  }
  return changes.length
    ? { ok: true, changes: changes, why: 'the tail opens a channel ' + changes.length + ' deep' }
    : { ok: false, changes: [], why: 'nothing here to open — and a ward will not pour' };
}

function opSEVER(w, x, y) {
  // The six letters that never join what follows are where a word breaks.
  // SEVER is the ONLY thing that opens warded stone, so the boundary
  // letters are literally the ones that get you past a boundary.
  const cur = at(w, x, y);
  if (cur === T.EMPTY) return { ok: false, changes: [], why: 'nothing here to cut' };
  const changes = [{ x: x, y: y, to: T.EMPTY, from: cur }];
  // A cut runs a little along the grain, as a fracture does — but only
  // through a BODY. Fire has no grain, so a single cut through a field of
  // it opened the whole field, which let one letter do a word's work.
  if (cur === T.STONE || cur === T.GLASS) {
    for (const d of [-1, 1]) {
      const n = at(w, x + d, y);
      if (n === cur) changes.push({ x: x + d, y: y, to: T.EMPTY, from: n });
    }
  }
  return { ok: true, changes: changes,
           why: cur === T.WARD ? 'the ward breaks — only a severing letter does this'
                               : 'the body fractures here' };
}

function opASSIMILATE(w, x, y) {
  // A sun letter: the article's lam BECOMES it. What precedes takes the
  // target's value — so this is the clone tool.
  const cur = at(w, x, y);
  const src = at(w, x - 1, y);
  if (src === T.WARD) return { ok: false, changes: [], why: 'a ward will not be copied' };
  // A ward resists ALL change but the cut. Without this, cloning empty air
  // onto a ward quietly unmade it, and the whole point of the severing
  // letters went with it.
  if (cur === T.WARD) return { ok: false, changes: [], why: 'a ward does not take another’s nature — only a severing letter opens it' };
  if (src === cur) return { ok: false, changes: [], why: 'these are already the same' };
  const changes = [{ x: x, y: y, to: src, from: cur }];
  const below = at(w, x, y + 1);
  if (below !== T.WARD && below !== src) changes.push({ x: x, y: y + 1, to: src, from: below });
  return { ok: true, changes: changes,
           why: 'the sun letter assimilates: this becomes ' + TILE_NAME[src] };
}

function opDISTINGUISH(w, x, y) {
  // A moon letter: the article's lam STAYS ITSELF. The target keeps its
  // own nature — it is warded against further change, and what was
  // hidden beside it is shown.
  const cur = at(w, x, y);
  if (cur === T.EMPTY) return { ok: false, changes: [], why: 'nothing here to hold apart' };
  if (cur === T.WARD) return { ok: false, changes: [], why: 'already distinguished' };
  return { ok: true, changes: [{ x: x, y: y, to: T.WARD, from: cur }],
           why: 'the moon letter keeps its own: this is warded now, and only a severing letter will open it' };
}

const OPS = {
  AXIS: opAXIS, RAISE: opRAISE, LOWER: opLOWER, BIND: opBIND,
  POUR: opPOUR, SEVER: opSEVER, ASSIMILATE: opASSIMILATE, DISTINGUISH: opDISTINGUISH
};

const OP_INFO = {
  AXIS:        { verb: 'RAISE A PILLAR', hint: 'builds a column upward — the only way to gain height' },
  RAISE:       { verb: 'LIFT THE GROUND', hint: 'lifts the column under the cursor' },
  LOWER:       { verb: 'SINK THE GROUND', hint: 'digs down — opens a floor' },
  BIND:        { verb: 'BRIDGE THE GAP',  hint: 'joins the two sides of a chasm into one body' },
  POUR:        { verb: 'OPEN A CHANNEL',  hint: 'makes matter passable; things fall through it' },
  SEVER:       { verb: 'CUT',             hint: 'the ONLY thing that opens warded stone' },
  ASSIMILATE:  { verb: 'CLONE',           hint: 'the target becomes whatever is to its left' },
  DISTINGUISH: { verb: 'WARD',            hint: 'the target keeps its nature and resists all change' }
};

// ---------- run an op, or preview it ----------
function planEdit(world, letter, op, x, y) {
  const fn = OPS[op];
  if (!fn) return { ok: false, changes: [], why: 'no such operation' };
  // the count on a dotted letter is how many rungs it moves
  let n = 1;
  const d = (letter.primitive_detail || []).find(p => p.op === op);
  if (d && typeof d.n === 'number') n = d.n;
  if (op === 'AXIS') n = 2;      // two cells: exactly the player's jump
  const r = fn(world, x, y, n);
  r.op = op;
  r.letter = letter;
  return r;
}

function applyEdit(world, plan) {
  if (!plan.ok) return 0;
  for (const c of plan.changes) setAt(world, c.x, c.y, c.to);
  return plan.changes.length;
}

// A letter's abjad value is what it costs. Alif is 1 and cheap; the
// thousand-letters are ruinous. That is the tradition's own number,
// used as the game's economy.
function costOf(letter) {
  const a = letter.abjad;
  if (a <= 10) return a;
  if (a <= 100) return 10 + Math.round(a / 10);
  return 24 + Math.round(a / 100);
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    T, TILE_NAME, isSolid, makeWorld, at, setAt,
    OPS, OP_INFO, planEdit, applyEdit, costOf
  });
}

// ===================================================================
// WORDS — letters in sequence, as a compound instruction
//
// This is what makes the alphabet a programming language rather than
// eight separate tools. You compose two to four letters into a word;
// each letter's edit fires in turn, one cell further LEFT each time,
// because that is the direction Arabic is written.
//
// And the orthography is the control flow. Six letters — ا د ذ ر ز و —
// never join what follows, which is simply why a written Arabic word
// looks like several pieces on the page. Here a word BREAKS at such a
// letter: everything up to and including it executes, and the rest is
// lost. So a player who knows how a word is written knows in advance
// how much of it will run.
//
//   باب  bab, door     — breaks after the alif, as the written word does
//   درب  darb, path    — breaks after the dal, immediately
//   قمر  qamar, moon   — every letter joins: it runs whole
//   جبل  jabal, mount  — runs whole
//
// A word that runs whole is WELL-FORMED and costs a third less. That is
// the only reward for vocabulary, and it is a real one.
// ===================================================================

// Ordinary vocabulary, spelled from the twenty-eight basic letters.
// No magical claim is made for any of these; they are words, and the
// game shows what they mean so the alphabet stays legible.
const WORDS = {
  'باب': 'door, gate',
  'نور': 'light',
  'نار': 'fire',
  'بحر': 'sea',
  'جبل': 'mountain',
  'حجر': 'stone',
  'سور': 'wall',
  'درب': 'path',
  'برج': 'tower',
  'رمل': 'sand',
  'قمر': 'moon',
  'شمس': 'sun'
};

// Plan a whole word at a target. Returns the same shape as a single
// edit, plus `steps` so the preview can colour what runs and what is lost.
function planWord(world, letters, x, y) {
  if (!letters.length) return { ok: false, changes: [], steps: [], why: 'no letters composed' };

  const spelling = letters.map(L => L.glyph).join('');
  const meaning = WORDS[spelling] || null;

  // where does the writing break?
  let breakAt = -1;
  for (let i = 0; i < letters.length - 1; i++) {
    if (letters[i].facts.non_connecting) { breakAt = i; break; }
  }
  const runs = breakAt < 0 ? letters.length : breakAt + 1;
  const whole = breakAt < 0;

  // execute right to left, on a scratch copy so each step sees the last
  const scratch = { cols: world.cols, rows: world.rows, g: world.g.slice() };
  const changes = [], steps = [];
  for (let i = 0; i < letters.length; i++) {
    const L = letters[i];
    const tx = x - i;                       // Arabic is written right to left
    if (i >= runs) {
      steps.push({ letter: L, at: [tx, y], ran: false, why: 'lost — the word broke before this' });
      continue;
    }
    let done = null;
    for (const op of L.primitives) {
      const p = planEdit(scratch, L, op, tx, y);
      if (p.ok) { done = p; break; }
    }
    if (done) {
      for (const c of done.changes) { setAt(scratch, c.x, c.y, c.to); changes.push(c); }
      steps.push({ letter: L, at: [tx, y], ran: true, op: done.op, why: done.why });
    } else {
      steps.push({ letter: L, at: [tx, y], ran: false, why: 'nothing for it to act on here' });
    }
  }

  const raw = letters.reduce((a, L) => a + costOf(L), 0);
  const cost = whole ? Math.round(raw * 0.66) : raw;

  let why;
  const acted = steps.filter(s => s.ran).length;
  if (!changes.length) why = 'the word finds nothing to act on here';
  else if (whole) why = (meaning
      ? 'well-formed — “' + spelling + '”, ' + meaning + ' — every letter joins, so none of it is lost'
      : 'every letter joins, so none of the word is lost')
      + (acted < letters.length ? ' (' + acted + ' of ' + letters.length + ' found something to act on)' : '');
  else why = 'the word breaks at ' + letters[breakAt].glyph + ' — ' + (letters.length - runs) +
             ' of ' + letters.length + ' lost, because that letter never joins what follows';

  return { ok: changes.length > 0, changes: changes, steps: steps, why: why,
           spelling: spelling, meaning: meaning, whole: whole, breakAt: breakAt,
           cost: cost, rawCost: raw, op: 'WORD' };
}

if (typeof window !== 'undefined') {
  window.WORDS = WORDS;
  window.planWord = planWord;
}
