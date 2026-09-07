// ===================================================================
// SALAMANDRA - a flight through the burning body
//
// Life Force / Gradius in an athanor. Two systems carry the game:
//
//   1. THE REACTION MATRIX. Every structure is masonry of a particular
//      alchemical kind and answers to one kind of matter only. Wrong
//      matter is absorbed, hardens it, grows it, ignites it, or comes
//      straight back at you. The architecture is a lock-and-key
//      language, not scenery.
//   2. THE POWER BAR, taken straight from the cabinet: capsules advance
//      a cursor along a row of upgrades and you choose when to spend.
// ===================================================================
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ---------- palette: the charred interior, lit by the work ----------
const PAL = {
  bg:     '#16110d',
  soot:   '#241c15',
  stone:  '#4b4034',
  ink:    '#2f3437',
  cream:  '#f4e9d2',
  red:    '#e8402a',
  cyan:   '#29a8e0',
  yellow: '#f5c518',
  brown:  '#6b4423',
  green:  '#6f9a3a',
  silver: '#c9ccd2',
  gold:   '#e8b53a',
  lead:   '#6d6a74',
  violet: '#8a6bb5'
};

// ===================================================================
// MATTER - the shot types, grouped in three registers
// ===================================================================
const MATTER = {
  fire:    { glyph: '🜂', name: 'FIRE',    register: 'ELEMENTAL',    color: PAL.red,    speed: 15, dmg: 1,
             note: 'Melts vitriol and ignites sulphur. Hardens calx instead of breaking it.' },
  water:   { glyph: '🜄', name: 'WATER',   register: 'ELEMENTAL',    color: PAL.cyan,   speed: 13, dmg: 1,
             note: 'Slakes calx and dissolves salt. Vitriol throws it back at you.' },
  air:     { glyph: '🜁', name: 'AIR',     register: 'ELEMENTAL',    color: '#bcd8e8',  speed: 17, dmg: 1,
             note: 'Blows apart an airy lattice. Across a sulphur vent it drives a jet of flame down the lane.' },
  earth:   { glyph: '🜃', name: 'EARTH',   register: 'ELEMENTAL',    color: PAL.brown,  speed: 10, dmg: 2,
             note: 'Slow and heavy. Thickens a lattice rather than opening it.' },
  sulphur: { glyph: '🜍', name: 'SULPHUR', register: 'PRINCIPLE',    color: '#d98f2a',  speed: 12, dmg: 1,
             note: 'The combustible principle. Sets what it strikes burning: damage over time.' },
  salt:    { glyph: '🜔', name: 'SALT',    register: 'PRINCIPLE',    color: PAL.cream,  speed: 12, dmg: 1,
             note: 'The fixed principle. Makes a salt pillar GROW - useful only if that is what you want.' },
  mercury: { glyph: '☿', name: 'MERCURY', register: 'PRINCIPLE',    color: PAL.silver, speed: 19, dmg: 1,
             note: 'The volatile principle. The only matter a mercury valve will answer to.' },
  sol:     { glyph: '☉', name: 'SOL',     register: 'ASTROLOGICAL', color: PAL.gold,   speed: 14, dmg: 2,
             note: 'Gold. Tarnishes a lunar mirror and is the only key to a solar lock.' },
  luna:    { glyph: '☽', name: 'LUNA',    register: 'ASTROLOGICAL', color: '#dfe6f0',  speed: 14, dmg: 1,
             note: 'Silver. Passes through a lunar mirror unreflected, and slows what it hits.' },
  mars:    { glyph: '♂', name: 'MARS',    register: 'ASTROLOGICAL', color: '#c0392b',  speed: 16, dmg: 2,
             note: 'Iron. Cuts lead: the only thing a saturnine shutter yields to.' },
  saturn:  { glyph: '♄', name: 'SATURN',  register: 'ASTROLOGICAL', color: PAL.lead,   speed: 8,  dmg: 4,
             note: 'Lead. Ponderous and slow, but nothing carries more weight.' }
};

const MATTER_ORDER = ['fire', 'water', 'air', 'earth', 'sulphur', 'salt', 'mercury', 'sol', 'luna', 'mars', 'saturn'];
const REGISTER_START = { ELEMENTAL: 0, PRINCIPLE: 4, ASTROLOGICAL: 7 };

// ===================================================================
// MASONRY - the reaction matrix
//
//   yields  : the matter that breaks it
//   reacts  : matter with a special, usually unhelpful, response
//   fallback: what everything else does
// ===================================================================
const MASONRY = {
  C: { id: 'C', name: 'CALX WALL',     color: '#e6dcc4', hp: 3, yields: 'water',
       reacts: { fire: 'harden' }, fallback: 'absorb',
       gloss: 'Quicklime, burnt in the furnace. Water slakes it and it falls apart; more fire only bakes it harder.' },
  V: { id: 'V', name: 'VITRIOL GATE',  color: PAL.green, hp: 3, yields: 'fire',
       reacts: { water: 'reflect' }, fallback: 'absorb',
       gloss: 'Green glass of vitriol. Fire runs it to slag; water hits a cold pane and comes straight back.' },
  S: { id: 'S', name: 'SALT PILLAR',   color: '#efe6d0', hp: 2, yields: 'water',
       reacts: { salt: 'grow' }, fallback: 'absorb',
       gloss: 'The fixed body. Water takes it into solution; salt on salt only crystallises further.' },
  U: { id: 'U', name: 'SULPHUR VENT',  color: '#d98f2a', hp: 1, yields: 'fire',
       reacts: { air: 'jet' }, fallback: 'absorb', volatile: true,
       gloss: 'A throat of brimstone. Fire detonates it and the blast carries to whatever stands beside it; a draught of air turns it into a flamethrower pointing down the lane.' },
  M: { id: 'M', name: 'MERCURY VALVE', color: PAL.silver, hp: 2, yields: 'mercury',
       reacts: {}, fallback: 'pass',
       gloss: 'Quicksilver held under glass. Everything but mercury passes straight through without touching it - and so it stays shut.' },
  L: { id: 'L', name: 'LUNAR MIRROR',  color: '#dfe6f0', hp: 2, yields: 'sol',
       reacts: { luna: 'pass' }, fallback: 'reflect',
       gloss: 'Polished silver. Only the sun tarnishes it. Everything else it returns to the sender.' },
  P: { id: 'P', name: 'LEAD SHUTTER',  color: PAL.lead, hp: 4, yields: 'mars',
       reacts: {}, fallback: 'absorb',
       gloss: 'Saturn\'s metal, dull and heavy. Iron cuts it. Nothing else marks it at all.' },
  A: { id: 'A', name: 'AIRY LATTICE',  color: '#9fc4d6', hp: 2, yields: 'air',
       reacts: { earth: 'harden' }, fallback: 'absorb',
       gloss: 'An open filigree. A gust scatters it; earth packs its gaps and thickens it.' },
  O: { id: 'O', name: 'SOLAR LOCK',    color: PAL.gold, hp: 6, yields: 'sol',
       reacts: {}, fallback: 'absorb', goal: true,
       gloss: 'Gold. The way out of the furnace, and gold answers to nothing but itself.' },
  '#': { id: '#', name: 'FURNACE WALL', color: '#3a3128', hp: Infinity, yields: null,
       reacts: {}, fallback: 'absorb',
       gloss: 'The brickwork of the athanor. It does not yield to anything you are carrying.' }
};

// The single place the matrix is consulted. Everything else asks this.
function react(block, matter) {
  const m = MASONRY[block.kind];
  if (!m) return 'absorb';
  if (m.yields && m.yields === matter) return 'break';
  if (m.reacts && m.reacts[matter]) return m.reacts[matter];
  return m.fallback;
}

// ===================================================================
// POWER BAR - Gradius, with the operations of the work in the slots
// ===================================================================
const BAR = [
  { id: 'speed',   name: 'SPEED',   sub: '☿ volatility',  max: 4 },
  { id: 'missile', name: 'MISSILE', sub: '🜔 the fixed',   max: 1 },
  { id: 'spread',  name: 'SPREAD',  sub: '🜄 dissolution', max: 1 },
  { id: 'lance',   name: 'LANCE',   sub: '🜂 calcination', max: 1 },
  { id: 'alembic', name: 'ALEMBIC', sub: 'the multiples', max: 2 },
  { id: 'seal',    name: 'SEAL',    sub: 'hermetic',      max: 1 }
];

// ===================================================================
// LEVEL - assembled from hand-authored 20-column segments
// ===================================================================
const ROWS = 14;
const SEG_W = 20;

// Pads/validates so a miscounted row cannot silently corrupt the level.
function seg(rows) {
  const out = [];
  for (let r = 0; r < ROWS; r++) {
    let s = rows[r] === undefined ? '' : rows[r];
    if (s.length > SEG_W) s = s.slice(0, SEG_W);
    while (s.length < SEG_W) s += '.';
    out.push(s);
  }
  return out;
}

const SEGMENTS = {
  open: seg([
    '####################',
    '....................',
    '....................',
    '..........e.........',
    '....................',
    '....................',
    '....................',
    '....................',
    '.........e..........',
    '....................',
    '....................',
    '....................',
    '....................',
    '####################'
  ]),
  calx: seg([
    '####################',
    '###.................',
    '###.....CCC.........',
    '........CCC.........',
    '........CCC....e....',
    '....................',
    '..c.................',
    '....................',
    '..........VVV.......',
    '..........VVV.......',
    '###.......VVV.......',
    '###.................',
    '###.................',
    '####################'
  ]),
  brimstone: seg([
    '####################',
    '....................',
    '....SSS.............',
    '....SSS......UU.....',
    '....SSS......UU.....',
    '.............UU.....',
    '........e...........',
    '....................',
    '.......c............',
    '..UU................',
    '..UU.....SSS........',
    '..UU.....SSS........',
    '.........SSS........',
    '####################'
  ]),
  mirrors: seg([
    '####################',
    '#######MMMM#########',
    '.......MMMM.........',
    '....................',
    '......LL............',
    '......LL......w.....',
    '....................',
    '....................',
    '..............LL....',
    '..............LL....',
    '.......MMMM.........',
    '#######MMMM#########',
    '####################',
    '####################'
  ]),
  saturnine: seg([
    '####################',
    '....................',
    '...AAA..............',
    '...AAA......PPP.....',
    '...AAA......PPP.....',
    '............PPP.....',
    '....e...............',
    '.......c............',
    '............PPP.....',
    '...AAA......PPP.....',
    '...AAA......PPP.....',
    '...AAA..............',
    '....................',
    '####################'
  ]),
  gate: seg([
    '####################',
    '#########OOOO#######',
    '.........OOOO.......',
    '.........OOOO.......',
    '....w....OOOO.......',
    '.........OOOO.......',
    '..c......OOOO.......',
    '.........OOOO.......',
    '.........OOOO.......',
    '....e....OOOO.......',
    '.........OOOO.......',
    '.........OOOO.......',
    '#########OOOO#######',
    '####################'
  ])
};

const LEVEL_ORDER = ['open', 'calx', 'brimstone', 'open', 'mirrors', 'saturnine', 'gate'];

function buildLevel() {
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    let s = '';
    for (const key of LEVEL_ORDER) s += SEGMENTS[key][r];
    rows.push(s);
  }
  return rows;
}

// ===================================================================
// State
// ===================================================================
let CELL = 44;
const state = {
  running: false, paused: false, over: false, won: false,
  t: 0, score: 0, lives: 3,
  scrollX: 0, scrollSpeed: 60,
  matter: 'fire',
  bar: -1,                 // power-bar cursor; -1 = nothing banked
  owned: {},               // upgrade id -> stacks
  seal: 0,
  levelRows: [],
  levelCols: 0,
  invuln: 0,
  fireCooldown: 0,
  respawn: 0,
  endHold: -1,           // >=0 once the scroll has run out: the last stand
  gateEnd: -1            // x past which the ship is through the lock
};

let blocks = new Map();     // "col,row" -> block
let shots = [];
let hostiles = [];          // reflected/enemy shots
let enemies = [];
let capsules = [];
let particles = [];
let jets = [];
let options = [];           // ALEMBIC multiples, trailing the ship
let ship = null;
let trail = [];

const key = (c, r) => c + ',' + r;
const END_HOLD = 20;        // seconds of last stand at the lock: three sol hits a block, four blocks a lane

// ===================================================================
// Setup
// ===================================================================
function layout() {
  const w = canvas.clientWidth || window.innerWidth || 900;
  const h = canvas.clientHeight || window.innerHeight || 600;
  canvas.width = Math.floor(w * devicePixelRatio);
  canvas.height = Math.floor(h * devicePixelRatio);
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  CELL = h / ROWS;
}

function resetLevel() {
  state.levelRows = buildLevel();
  state.levelCols = state.levelRows[0].length;
  // The lock is the far edge of the last goal masonry. Passing it wins:
  // the title says THE LOCK IS OPEN, not THE LOCK IS DEMOLISHED.
  let gateCol = -1;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < state.levelCols; c++)
    if (MASONRY[state.levelRows[r][c]] && MASONRY[state.levelRows[r][c]].goal) gateCol = Math.max(gateCol, c);
  state.gateEnd = gateCol < 0 ? -1 : (gateCol + 1) * CELL;
  blocks = new Map();
  enemies = [];
  capsules = [];
  shots = [];
  hostiles = [];
  particles = [];
  jets = [];
  options = [];
  trail = [];

  for (let r = 0; r < ROWS; r++) {
    const row = state.levelRows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      if (MASONRY[ch]) {
        blocks.set(key(c, r), { c: c, r: r, kind: ch, hp: MASONRY[ch].hp, flash: 0, burn: 0 });
      } else if (ch === 'e') {
        enemies.push(makeEnemy('drifter', c, r));
      } else if (ch === 'w') {
        enemies.push(makeEnemy('weaver', c, r));
      } else if (ch === 'c') {
        capsules.push({ x: (c + 0.5) * CELL, y: (r + 0.5) * CELL, taken: false, t: 0 });
      }
    }
  }

  ship = {
    x: CELL * 2.5, y: CELL * ROWS / 2,
    vx: 0, vy: 0, r: CELL * 0.28, dead: false
  };
  state.scrollX = 0;
  state.fireCooldown = 0;
  state.endHold = -1;
  state.invuln = 1.5;
  state.respawn = 0;
}

function resetGame() {
  state.score = 0;
  state.lives = 3;
  state.matter = 'fire';
  state.bar = -1;
  state.owned = {};
  state.seal = 0;
  state.over = false;
  state.won = false;
  state.paused = false;
  state.running = true;
  resetLevel();
  syncUI();
}

function makeEnemy(kind, c, r) {
  const base = { kind: kind, x: (c + 0.5) * CELL, y: (r + 0.5) * CELL, hp: kind === 'weaver' ? 5 : 3,
                 t: Math.random() * 6, homeY: (r + 0.5) * CELL, burn: 0, slow: 0, fireT: rand(0.6, 2.2) };
  return base;
}

function rand(a, b) { return a + Math.random() * (b - a); }
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ===================================================================
// Firing
// ===================================================================
function fireFrom(x, y, matter, fromOption) {
  const m = MATTER[matter];
  const speed = m.speed * CELL * 0.42;
  const mk = (vy) => shots.push({
    x: x, y: y, vx: speed, vy: vy, matter: matter, dmg: m.dmg,
    pierce: !!state.owned.lance, life: 3.2, r: CELL * 0.10
  });
  mk(0);
  if (state.owned.spread && !fromOption) {
    mk(-speed * 0.36);
    mk(speed * 0.36);
  }
  if (state.owned.missile && !fromOption) {
    shots.push({ x: x, y: y, vx: speed * 0.55, vy: speed * 0.5, matter: matter, dmg: m.dmg,
                 missile: true, life: 3.2, r: CELL * 0.12 });
  }
}

function playerFire() {
  if (state.fireCooldown > 0) return;
  state.fireCooldown = state.owned.lance ? 0.16 : 0.13;
  fireFrom(ship.x + ship.r, ship.y, state.matter, false);
  for (const o of options) fireFrom(o.x, o.y, state.matter, true);
}

// ===================================================================
// The reaction matrix, applied
// ===================================================================
function hitBlock(block, shot) {
  const outcome = react(block, shot.matter);
  const m = MASONRY[block.kind];
  showReaction(m, shot.matter, outcome);

  switch (outcome) {
    case 'break':
      block.hp -= shot.dmg;
      block.flash = 0.18;
      burst(shot.x, shot.y, m.color, 6);
      if (block.hp <= 0) destroyBlock(block, m);
      return true;                      // shot consumed unless piercing

    case 'harden':
      block.hp += 1;
      block.flash = 0.25;
      burst(shot.x, shot.y, PAL.yellow, 5);
      return true;

    case 'grow':
      block.flash = 0.25;
      growBlock(block);
      return true;

    case 'reflect':
      hostiles.push({ x: shot.x, y: shot.y, vx: -Math.abs(shot.vx) * 0.9, vy: -shot.vy,
                      matter: shot.matter, life: 3, r: shot.r });
      block.flash = 0.2;
      burst(shot.x, shot.y, MASONRY[block.kind].color, 5);
      return true;

    case 'jet':
      block.flash = 0.3;
      jets.push({ r: block.r, x: block.c * CELL, life: 0.85, max: 0.85 });
      return true;

    case 'pass':
      return false;                     // straight through, untouched

    default:                            // absorb
      block.flash = 0.12;
      burst(shot.x, shot.y, '#8a7a63', 3);
      return true;
  }
}

function destroyBlock(block, m) {
  blocks.delete(key(block.c, block.r));
  state.score += 60;
  burst((block.c + 0.5) * CELL, (block.r + 0.5) * CELL, m.color, 14);
  // A sulphur vent takes its neighbours with it.
  if (m.volatile) igniteAround(block.c, block.r, 1);
  if (m.goal) checkGoal();
}

function igniteAround(c, r, radius) {
  burst((c + 0.5) * CELL, (r + 0.5) * CELL, PAL.red, 26);
  state.score += 40;
  for (let dc = -radius; dc <= radius; dc++) {
    for (let dr = -radius; dr <= radius; dr++) {
      if (dc === 0 && dr === 0) continue;
      const b = blocks.get(key(c + dc, r + dr));
      if (!b) continue;
      const mm = MASONRY[b.kind];
      if (!isFinite(mm.hp)) continue;         // the furnace wall does not blow
      b.hp -= 2;
      b.flash = 0.2;
      if (b.hp <= 0) destroyBlock(b, mm);
    }
  }
  const cx = (c + 0.5) * CELL, cy = (r + 0.5) * CELL;
  for (const e of enemies) {
    if (Math.hypot(e.x - cx, e.y - cy) < CELL * 2.2) { e.hp -= 3; e.burn = 1.2; }
  }
}

function growBlock(block) {
  // salt crystallises upward and downward into free space
  const dirs = [-1, 1];
  for (const d of dirs) {
    const nr = block.r + d;
    if (nr < 1 || nr >= ROWS - 1) continue;
    if (blocks.has(key(block.c, nr))) continue;
    blocks.set(key(block.c, nr), { c: block.c, r: nr, kind: 'S', hp: MASONRY.S.hp, flash: 0.3, burn: 0 });
    state.score += 5;
    break;
  }
}

function checkGoal() {
  let remaining = 0;
  for (const b of blocks.values()) if (MASONRY[b.kind].goal) remaining++;
  if (remaining === 0) finish(true);
}

// ===================================================================
// Update
// ===================================================================
const keys = {};

function update(dt) {
  state.t += dt;
  state.fireCooldown = Math.max(0, state.fireCooldown - dt);
  state.invuln = Math.max(0, state.invuln - dt);

  if (state.respawn > 0) {
    state.respawn -= dt;
    if (state.respawn <= 0) {
      ship.dead = false;
      ship.x = state.scrollX + CELL * 2.5;
      ship.y = CELL * ROWS / 2;
      state.invuln = 2.0;
    }
    return;
  }

  // scroll
  state.scrollX += state.scrollSpeed * dt * (CELL / 44);
  const maxScroll = state.levelCols * CELL - canvas.clientWidth;
  if (state.scrollX > maxScroll) state.scrollX = maxScroll;

  // ship
  const spd = (state.owned.speed ? 1 + 0.28 * state.owned.speed : 1) * CELL * 6.4;
  let mx = 0, my = 0;
  if (keys.a || keys.arrowleft) mx -= 1;
  if (keys.d || keys.arrowright) mx += 1;
  if (keys.w || keys.arrowup) my -= 1;
  if (keys.s || keys.arrowdown) my += 1;
  const l = Math.hypot(mx, my) || 1;
  ship.x += (mx / l) * spd * dt + state.scrollSpeed * dt * (CELL / 44);
  ship.y += (my / l) * spd * dt;
  ship.x = clamp(ship.x, state.scrollX + ship.r, state.scrollX + canvas.clientWidth - ship.r);
  ship.y = clamp(ship.y, ship.r, ROWS * CELL - ship.r);

  trail.push({ x: ship.x, y: ship.y, t: 0.35 });
  if (trail.length > 60) trail.shift();
  for (let i = trail.length - 1; i >= 0; i--) { trail[i].t -= dt; if (trail[i].t <= 0) trail.splice(i, 1); }

  // ALEMBIC options follow the trail
  for (let i = 0; i < options.length; i++) {
    const idx = trail.length - 1 - (i + 1) * 14;
    const p = trail[Math.max(0, idx)];
    if (p) { options[i].x = p.x; options[i].y = p.y; }
  }

  if (keys[' ']) playerFire();

  // shots
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.life -= dt;
    if (s.missile) s.vy += CELL * 22 * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    if (s.life <= 0 || s.x > state.scrollX + canvas.clientWidth + CELL || s.y < 0 || s.y > ROWS * CELL) {
      shots.splice(i, 1); continue;
    }
    let consumed = false;
    const b = blockAt(s.x, s.y);
    if (b) {
      const stop = hitBlock(b, s);
      if (stop) {
        if (s.missile) { consumed = true; }
        else if (!s.pierce) consumed = true;
        else if (MASONRY[b.kind].fallback === 'reflect' || react(b, s.matter) === 'reflect') consumed = true;
      }
      if (s.missile && stop) { s.vy = -Math.abs(s.vy) * 0.1; s.vx = Math.abs(s.vx); }
    }
    if (!consumed) {
      for (const e of enemies) {
        if (e.hp <= 0) continue;
        if (Math.hypot(e.x - s.x, e.y - s.y) < CELL * 0.42) {
          e.hp -= s.dmg;
          e.flash = 0.15;
          if (s.matter === 'sulphur') e.burn = 2.2;
          if (s.matter === 'luna') e.slow = 2.5;
          burst(s.x, s.y, MATTER[s.matter].color, 5);
          if (!s.pierce) consumed = true;
          if (e.hp <= 0) killEnemy(e);
          break;
        }
      }
    }
    if (consumed) shots.splice(i, 1);
  }

  // reflected shots come back at you
  for (let i = hostiles.length - 1; i >= 0; i--) {
    const h = hostiles[i];
    h.life -= dt;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    if (h.life <= 0 || h.x < state.scrollX - CELL) { hostiles.splice(i, 1); continue; }
    if (!ship.dead && state.invuln <= 0 && Math.hypot(h.x - ship.x, h.y - ship.y) < ship.r + h.r) {
      hostiles.splice(i, 1);
      damageShip();
    }
  }

  // sulphur jets sweep the lane
  for (let i = jets.length - 1; i >= 0; i--) {
    const j = jets[i];
    j.life -= dt;
    if (j.life <= 0) { jets.splice(i, 1); continue; }
    const y = (j.r + 0.5) * CELL;
    for (const e of enemies) {
      if (e.hp > 0 && Math.abs(e.y - y) < CELL * 0.6 && e.x > j.x) { e.hp -= 8 * dt; if (e.hp <= 0) killEnemy(e); }
    }
    if (!ship.dead && state.invuln <= 0 && Math.abs(ship.y - y) < CELL * 0.5 && ship.x > j.x) damageShip();
  }

  // enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.hp <= 0) { enemies.splice(i, 1); continue; }
    e.t += dt;
    e.flash = Math.max(0, (e.flash || 0) - dt);
    if (e.burn > 0) { e.burn -= dt; e.hp -= 2.2 * dt; if (e.hp <= 0) { killEnemy(e); continue; } }
    const slowK = e.slow > 0 ? 0.4 : 1;
    if (e.slow > 0) e.slow -= dt;

    if (e.kind === 'drifter') {
      e.x -= CELL * 1.9 * dt * slowK;
      e.y = e.homeY + Math.sin(e.t * 1.6) * CELL * 0.9;
    } else {
      e.x -= CELL * 1.2 * dt * slowK;
      e.y = e.homeY + Math.sin(e.t * 2.6) * CELL * 2.2;
      e.fireT -= dt * slowK;
      if (e.fireT <= 0 && e.x > state.scrollX && e.x < state.scrollX + canvas.clientWidth) {
        e.fireT = rand(1.4, 2.8);
        const dx = ship.x - e.x, dy = ship.y - e.y, d = Math.hypot(dx, dy) || 1;
        hostiles.push({ x: e.x, y: e.y, vx: (dx / d) * CELL * 5.5, vy: (dy / d) * CELL * 5.5,
                        matter: 'sulphur', life: 4, r: CELL * 0.1 });
      }
    }
    if (e.x < state.scrollX - CELL * 2) { enemies.splice(i, 1); continue; }
    if (!ship.dead && state.invuln <= 0 && Math.hypot(e.x - ship.x, e.y - ship.y) < ship.r + CELL * 0.34) {
      damageShip();
    }
  }

  // capsules
  for (const cap of capsules) {
    if (cap.taken) continue;
    cap.t += dt;
    if (!ship.dead && Math.hypot(cap.x - ship.x, cap.y - ship.y) < ship.r + CELL * 0.3) {
      cap.taken = true;
      state.bar = (state.bar + 1) % BAR.length;
      state.score += 25;
      burst(cap.x, cap.y, PAL.yellow, 10);
      syncUI();
    }
  }

  // ship vs masonry
  if (!ship.dead && state.invuln <= 0) {
    const b = blockAt(ship.x, ship.y);
    if (b) damageShip();
  }

  // blocks tick
  for (const b of blocks.values()) if (b.flash > 0) b.flash -= dt;

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.94; p.vy *= 0.94;
  }

  // Through the lock. Opening one lane and flying it is the win; demolishing
  // every block of the gate (checkGoal) still counts, but nobody has to.
  if (state.gateEnd > 0 && !ship.dead && ship.x - ship.r > state.gateEnd) {
    finish(true, 'Score ' + state.score + '. You opened the lock and flew through it.');
    return;
  }

  // The end of the athanor. The scroll is clamped here, so anything still
  // standing further back is now behind the player and can never be reached:
  // without a bound on this the run neither wins nor loses and the player is
  // held at 100% for ever. So the end of the level is a last stand. Any lock
  // still on the final screen can be opened; when the hold runs out the work
  // is judged as it stands.
  if (state.scrollX >= state.levelCols * CELL - canvas.clientWidth - 1) {
    let goal = 0;
    for (const b of blocks.values()) if (MASONRY[b.kind].goal) goal++;
    if (goal === 0) { finish(true); return; }
    if (state.endHold < 0) state.endHold = END_HOLD;
    state.endHold -= dt;
    if (state.endHold <= 0) {
      finish(false, 'Score ' + state.score + '. The vessel closed with ' + goal +
                    ' lock' + (goal === 1 ? '' : 's') + ' still sealed.');
    }
  }
}

function blockAt(x, y) {
  const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
  return blocks.get(key(c, r)) || null;
}

function killEnemy(e) {
  e.hp = 0;
  state.score += 120;
  burst(e.x, e.y, PAL.red, 12);
  if (Math.random() < 0.34) capsules.push({ x: e.x, y: e.y, taken: false, t: 0 });
}

function damageShip() {
  if (state.seal > 0) {
    state.seal--;
    state.invuln = 0.9;
    burst(ship.x, ship.y, PAL.cyan, 14);
    syncUI();
    return;
  }
  ship.dead = true;
  burst(ship.x, ship.y, PAL.yellow, 30);
  state.lives--;
  options = [];
  syncUI();
  if (state.lives <= 0) finish(false);
  else state.respawn = 1.2;
}

function spendBar() {
  if (state.bar < 0) return;
  const slot = BAR[state.bar];
  const have = state.owned[slot.id] || 0;
  if (have >= slot.max) return;
  state.owned[slot.id] = have + 1;
  if (slot.id === 'seal') state.seal = 3;
  if (slot.id === 'alembic') options.push({ x: ship.x, y: ship.y });
  state.bar = -1;
  burst(ship.x, ship.y, PAL.yellow, 16);
  syncUI();
}

function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rand(30, 200);
    particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                     life: rand(0.25, 0.7), max: 0.7, color: color, size: rand(2, 5) });
  }
}

function finish(won, reason) {
  if (state.over) return;
  state.over = true;
  state.running = false;
  state.won = won;
  const sealed = !won && reason;   // ran out of furnace rather than out of vessels
  document.getElementById('overTitle').textContent =
    won ? 'THE LOCK IS OPEN' : (sealed ? 'THE WORK IS UNFINISHED' : 'THE FIRE TOOK YOU');
  document.getElementById('overSub').textContent = won
    ? 'gold answers to nothing but itself'
    : (sealed ? 'you came out the far side with the gold still shut'
              : 'the vessel cracked in the heat');
  document.getElementById('overLine').textContent = reason ||
    ('Score ' + state.score + '. ' +
     (won ? 'You read the masonry correctly.' : 'The furnace keeps what it takes.'));
  document.getElementById('overScreen').classList.add('show');
}

// ===================================================================
// Draw
// ===================================================================
function draw() {
  const w = canvas.clientWidth || window.innerWidth || 900;
  const h = canvas.clientHeight || window.innerHeight || 600;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, w, h);

  // ember haze in the background
  ctx.save();
  for (let i = 0; i < 26; i++) {
    const px = ((i * 271 + state.t * 22 * (1 + (i % 3) * 0.4)) % (w + 80)) - 40;
    const py = ((i * 137) % (h - 20)) + 10 + Math.sin(state.t * 0.7 + i) * 8;
    ctx.globalAlpha = 0.10 + (i % 4) * 0.03;
    ctx.fillStyle = i % 3 === 0 ? PAL.red : PAL.yellow;
    ctx.fillRect(w - px, py, 2, 2);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-state.scrollX, 0);

  const c0 = Math.floor(state.scrollX / CELL) - 1;
  const c1 = Math.ceil((state.scrollX + w) / CELL) + 1;

  // masonry
  for (let c = c0; c <= c1; c++) {
    for (let r = 0; r < ROWS; r++) {
      const b = blocks.get(key(c, r));
      if (!b) continue;
      drawBlock(b);
    }
  }

  // jets
  for (const j of jets) {
    const a = j.life / j.max;
    ctx.globalAlpha = a * 0.8;
    const grd = ctx.createLinearGradient(j.x, 0, j.x + w, 0);
    grd.addColorStop(0, PAL.yellow);
    grd.addColorStop(1, 'rgba(232,64,42,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(j.x, (j.r + 0.5) * CELL - CELL * 0.3 * a, w, CELL * 0.6 * a);
    ctx.globalAlpha = 1;
  }

  // capsules
  for (const cap of capsules) {
    if (cap.taken) continue;
    const s = CELL * 0.3 + Math.sin(cap.t * 4) * CELL * 0.03;
    ctx.strokeStyle = PAL.yellow;
    ctx.lineWidth = 2;
    ctx.strokeRect(cap.x - s / 2, cap.y - s / 2, s, s);
    ctx.fillStyle = 'rgba(245,197,24,.28)';
    ctx.fillRect(cap.x - s / 2, cap.y - s / 2, s, s);
    ctx.fillStyle = PAL.yellow;
    ctx.font = Math.round(CELL * 0.26) + 'px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◆', cap.x, cap.y);
  }

  // enemies
  for (const e of enemies) drawEnemy(e);

  // shots
  for (const s of shots) {
    const m = MATTER[s.matter];
    ctx.fillStyle = s.flash ? '#fff' : m.color;
    if (state.owned.lance && !s.missile) {
      ctx.fillRect(s.x - CELL * 0.5, s.y - CELL * 0.045, CELL * 0.6, CELL * 0.09);
    } else {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const hs of hostiles) {
    ctx.fillStyle = PAL.violet;
    ctx.beginPath();
    ctx.arc(hs.x, hs.y, hs.r * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  // options
  for (const o of options) {
    ctx.strokeStyle = PAL.cyan;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(o.x, o.y, CELL * 0.16, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ship
  if (!ship.dead && (state.invuln <= 0 || Math.floor(state.t * 18) % 2 === 0)) drawShip();

  // particles
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawBlock(b) {
  const m = MASONRY[b.kind];
  const x = b.c * CELL, y = b.r * CELL;
  const pad = 1;

  ctx.fillStyle = b.flash > 0 ? '#ffffff' : m.color;
  ctx.fillRect(x + pad, y + pad, CELL - pad * 2, CELL - pad * 2);

  // inner mark, so the kind is readable without the legend
  ctx.strokeStyle = 'rgba(22,17,13,.55)';
  ctx.lineWidth = Math.max(1, CELL * 0.045);
  const cx = x + CELL / 2, cy = y + CELL / 2, q = CELL * 0.22;
  ctx.beginPath();
  switch (b.kind) {
    case 'C': ctx.moveTo(x + 4, cy); ctx.lineTo(x + CELL - 4, cy); break;
    case 'V': ctx.moveTo(x + 5, y + 5); ctx.lineTo(x + CELL - 5, y + CELL - 5);
              ctx.moveTo(x + CELL - 5, y + 5); ctx.lineTo(x + 5, y + CELL - 5); break;
    case 'S': ctx.rect(cx - q, cy - q, q * 2, q * 2); break;
    case 'U': ctx.moveTo(cx, cy - q); ctx.lineTo(cx + q, cy + q); ctx.lineTo(cx - q, cy + q); ctx.closePath(); break;
    case 'M': ctx.arc(cx, cy, q, 0, Math.PI * 2); break;
    case 'L': ctx.arc(cx, cy, q, Math.PI * 0.5, Math.PI * 1.5); break;
    case 'P': ctx.moveTo(x + 5, cy - q * 0.5); ctx.lineTo(x + CELL - 5, cy - q * 0.5);
              ctx.moveTo(x + 5, cy + q * 0.5); ctx.lineTo(x + CELL - 5, cy + q * 0.5); break;
    case 'A': ctx.moveTo(cx, cy - q); ctx.lineTo(cx + q, cy); ctx.lineTo(cx, cy + q);
              ctx.lineTo(cx - q, cy); ctx.closePath(); break;
    case 'O': ctx.arc(cx, cy, q, 0, Math.PI * 2); ctx.moveTo(cx + q * 1.6, cy); ctx.arc(cx, cy, q * 1.6, 0, Math.PI * 2); break;
    default:  ctx.moveTo(x + 3, y + CELL * 0.5); ctx.lineTo(x + CELL - 3, y + CELL * 0.5);
  }
  ctx.stroke();
}

function drawEnemy(e) {
  const s = CELL * 0.34;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.flash > 0 ? '#fff' : (e.kind === 'weaver' ? PAL.violet : PAL.red);
  if (e.burn > 0 && Math.floor(state.t * 14) % 2 === 0) ctx.fillStyle = PAL.yellow;
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.7);
  ctx.lineTo(s * 0.9, 0);
  ctx.lineTo(-s, s * 0.7);
  ctx.lineTo(-s * 0.4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawShip() {
  const s = CELL * 0.42;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  // exhaust
  ctx.fillStyle = 'rgba(232,64,42,.75)';
  ctx.beginPath();
  ctx.moveTo(-s * 0.9, -s * 0.22);
  ctx.lineTo(-s * (1.5 + Math.random() * 0.5), 0);
  ctx.lineTo(-s * 0.9, s * 0.22);
  ctx.closePath();
  ctx.fill();
  // the alembic body
  ctx.fillStyle = PAL.cream;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.2, -s * 0.62);
  ctx.lineTo(-s * 0.9, -s * 0.34);
  ctx.lineTo(-s * 0.9, s * 0.34);
  ctx.lineTo(-s * 0.2, s * 0.62);
  ctx.closePath();
  ctx.fill();
  // the alchemist inside
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(-s * 0.25, -s * 0.24, s * 0.5, s * 0.48);
  ctx.fillStyle = MATTER[state.matter].color;
  ctx.fillRect(-s * 0.1, -s * 0.12, s * 0.24, s * 0.24);
  // seal
  if (state.seal > 0) {
    ctx.strokeStyle = 'rgba(41,168,224,' + (0.4 + 0.2 * Math.sin(state.t * 8)) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ===================================================================
// UI
// ===================================================================
const $ = id => document.getElementById(id);
let rxTimer = 0;

function showReaction(masonry, matter, outcome) {
  const words = {
    break: 'IT YIELDS', harden: 'IT HARDENS AGAINST YOU', grow: 'IT GROWS',
    reflect: 'REFLECTED BACK AT YOU', jet: 'THE VENT JETS FLAME DOWN THE LANE',
    pass: 'PASSES STRAIGHT THROUGH — NO EFFECT', absorb: 'ABSORBED — WRONG MATTER'
  };
  $('rxTitle').textContent = MATTER[matter].glyph + ' ' + MATTER[matter].name + ' → ' + masonry.name;
  $('rxBody').textContent = masonry.gloss;
  $('rxOut').textContent = words[outcome] || outcome.toUpperCase();
  $('reaction').classList.add('show');
  rxTimer = 2.6;
}

function syncUI() {
  $('score').textContent = state.score;
  $('lives').textContent = state.lives;
  $('seal').textContent = state.seal > 0 ? ('SEAL ' + state.seal) : 'NO SEAL';
  const pct = Math.round(clamp(state.scrollX / Math.max(1, state.levelCols * CELL - canvas.clientWidth), 0, 1) * 100);
  $('progress').textContent = state.endHold >= 0
    ? ('THE VESSEL CLOSES — ' + Math.ceil(state.endHold) + 's')
    : (pct + '% THROUGH THE BODY');

  const m = MATTER[state.matter];
  $('wRegister').textContent = m.register;
  $('wGlyph').textContent = m.glyph;
  $('wName').innerHTML = '<span id="wGlyph">' + m.glyph + '</span>' + m.name;
  $('wNote').textContent = m.note;

  const ring = $('ring');
  if (ring.childElementCount === 0) {
    MATTER_ORDER.forEach(function (k) {
      const i = document.createElement('i');
      i.textContent = MATTER[k].glyph;
      i.title = MATTER[k].name;
      i.addEventListener('click', function () { state.matter = k; syncUI(); });
      ring.appendChild(i);
    });
  }
  MATTER_ORDER.forEach(function (k, i) {
    ring.children[i].classList.toggle('on', k === state.matter);
  });

  const bar = $('bar');
  if (bar.childElementCount === 0) {
    BAR.forEach(function (slot) {
      const d = document.createElement('div');
      d.className = 'slot';
      d.innerHTML = slot.name + '<small>' + slot.sub + '</small>';
      bar.appendChild(d);
    });
  }
  BAR.forEach(function (slot, i) {
    const el = bar.children[i];
    el.classList.toggle('on', i === state.bar);
    el.classList.toggle('owned', (state.owned[slot.id] || 0) > 0);
  });
}

// ===================================================================
// Input
// ===================================================================
function cycleMatter(dir) {
  const i = MATTER_ORDER.indexOf(state.matter);
  state.matter = MATTER_ORDER[(i + dir + MATTER_ORDER.length) % MATTER_ORDER.length];
  syncUI();
}

window.addEventListener('keydown', function (e) {
  const isSpace = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
  const k = isSpace ? ' ' : e.key.toLowerCase();

  if ($('startScreen').classList.contains('show')) {
    if (isSpace || k === 'enter') { start(); e.preventDefault(); }
    return;
  }
  if ($('overScreen').classList.contains('show')) {
    if (isSpace || k === 'enter') { $('overScreen').classList.remove('show'); resetGame(); e.preventDefault(); }
    return;
  }

  keys[k] = true;
  if (isSpace) e.preventDefault();
  if (k === 'c') cycleMatter(1);
  if (k === 'v') cycleMatter(-1);
  if (k === 'shift') spendBar();
  if (k === 'p') state.paused = !state.paused;
  if (k === '1') { state.matter = MATTER_ORDER[REGISTER_START.ELEMENTAL]; syncUI(); }
  if (k === '2') { state.matter = MATTER_ORDER[REGISTER_START.PRINCIPLE]; syncUI(); }
  if (k === '3') { state.matter = MATTER_ORDER[REGISTER_START.ASTROLOGICAL]; syncUI(); }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) e.preventDefault();
});

window.addEventListener('keyup', function (e) {
  const isSpace = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
  keys[isSpace ? ' ' : e.key.toLowerCase()] = false;
});

function start() {
  $('startScreen').classList.remove('show');
  resetGame();
}

// ===================================================================
// Loop
// ===================================================================
let last = 0;
function frame(now) {
  // Clamped at BOTH ends. The upper bound stops a long stall from teleporting
  // everything through a wall; the lower bound matters because a negative delta
  // runs the world backwards - the scroll reverses and `cooldown - dt` becomes
  // an increment, which silently disables the gun.
  const dt = Math.max(0, Math.min(0.045, (now - last) / 1000 || 0));
  last = now;

  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w !== canvas._lw || h !== canvas._lh) { canvas._lw = w; canvas._lh = h; layout(); }

  if (state.running && !state.paused && !state.over) {
    update(dt);
    if (rxTimer > 0) { rxTimer -= dt; if (rxTimer <= 0) $('reaction').classList.remove('show'); }
    syncUI();
  }
  draw();
  requestAnimationFrame(frame);
}

layout();
resetLevel();
syncUI();

$('startBtn').addEventListener('click', function () { start(); this.blur(); });
$('againBtn').addEventListener('click', function () {
  $('overScreen').classList.remove('show');
  resetGame();
  this.blur();
});
window.addEventListener('resize', layout);

// exposed for headless verification
// Exposed for headless verification. These MUST be getters: resetLevel()
// reassigns the collections rather than emptying them, so a captured reference
// goes stale on the first restart and quietly reports the previous world.
window.SAL = {
  get state(){ return state; },   get blocks(){ return blocks; },
  get enemies(){ return enemies; }, get shots(){ return shots; },
  get hostiles(){ return hostiles; }, get capsules(){ return capsules; },
  get keys(){ return keys; },     get ship(){ return ship; },
  MASONRY, MATTER, BAR,
  react, update, frame, resetGame, resetLevel, spendBar, hitBlock, blockAt, key
};

requestAnimationFrame(function (t) { last = t; requestAnimationFrame(frame); });
