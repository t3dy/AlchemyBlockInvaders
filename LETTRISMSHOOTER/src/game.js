// ===================================================================
// LETTRISM SHOOTER — the developer mode of reality
//
// A side-scrolling shooter in which the world is editable and the
// alphabet is the editor. You collect tiles bearing the Arabic letters;
// each grants the world-edit its own written form dictates; you use
// them to build, cut, bridge and pour your way through chambers that
// cannot be shot through.
//
// Loop discipline carried from the sibling games and not optional: ONE
// animation loop guarded by a flag, dt clamped at BOTH ends, every
// entity resolved once per frame, no unreachable states.
// ===================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);

const PAL = {
  bg: '#0d0f12', ink: '#e8e2d4', dim: '#6f7b86', gold: '#c9a227',
  stone: '#4a5058', ward: '#7d5a3c', flow: '#2f6f8f', glass: '#5f8f9f',
  hazard: '#b5342a', gate: '#c9a227', player: '#e8e2d4'
};

let CELL = 34;
const state = {
  running: false, paused: false, over: false, won: false,
  chamber: 0, t: 0, shake: 0,
  breath: 100,            // the charge that edits are paid from
  held: [],               // letters carried
  sel: 0,                 // which held letter is selected
  cursor: { x: 0, y: 0 },
  lastPlan: null,
  word: [],               // the letters composed into a word
  composing: false,
  editsMade: 0, shotsFired: 0, deaths: 0, kills: 0,
  hp: 3, maxHp: 3, spawnT: 0, undone: 0,
  recent: []              // the edits you have made, so the eraser can hunt them
};

let LETTERS = [], BY_GLYPH = {};
let world = null, player = null, tiles = [], foes = [], shots = [], sparks = [];
let camX = 0;
const keys = {};

// ===================================================================
// The chambers. Each is a puzzle whose solution is a letter, and each
// teaches exactly one primitive before combining it with the last.
// `letters` are the tiles lying about in the room.
// ===================================================================
const CHAMBERS = [
  {
    name: 'THE UPRIGHT',
    teaches: 'AXIS',
    foes: ['haris'],
    brief: 'Something is already in here with you. The gate sits on a ledge you cannot jump to. Alif is a single upright stroke, and an upright stroke stands: it raises a pillar two cells high — exactly your jump. Place one, climb it, place another.',
    letters: ['ا'],
    map: [
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..................G.......',
      '.................#####....',
      '..........................',
      '..........................',
      '@.........................',
      '##########################',
      '##########################'
    ]
  },
  {
    name: 'THE CHASM',
    teaches: 'BIND',
    foes: ['haris', 'haris', 'katib'],
    brief: 'A gap in the floor. A closed loop binds what stands on either side into one body — aim into the gap, level with the two edges, and it becomes a bridge.',
    letters: ['م'],
    map: [
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '@....................G....',
      '######.........###########',
      '######.........###########',
      '######.........###########'
    ]
  },
  {
    name: 'THE WARD',
    teaches: 'SEVER',
    foes: ['haris', 'mahi'],
    brief: 'Warded stone, and nothing you can shoot will open it. And a MĀḤĪ is loose: it hunts what you write and unmakes it, so cut fast or kill it first. Six letters never join what follows — which is why an Arabic word looks like several pieces on the page — and those, and only those, cut a ward.',
    letters: ['ر'],
    map: [
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '............==............',
      '............==............',
      '@...........==.......G....',
      '############==############',
      '############==############',
      '##########################'
    ]
  },
  {
    name: 'THE FLOOR',
    teaches: 'POUR',
    foes: ['katib', 'haris'],
    brief: 'The way on is beneath you. A descending tail lets what is above pass down through: it opens a channel in solid matter, and you fall through it.',
    letters: ['ج'],
    map: [
      '..........................',
      '@.........................',
      '##########################',
      '..........................',
      '..........................',
      '..........................',
      '.....................G....',
      '..................########',
      '..........................',
      '..........................',
      '##########################'
    ]
  },
  {
    name: 'THE TERRACE',
    teaches: 'RAISE',
    foes: ['mahi', 'haris'],
    brief: 'The gate stands above a floor you cannot climb. Nūn carries a dot above, and a dot above lifts: it raises the ground itself rather than building on it. Aim at the floor, not at the air.',
    letters: ['ن'],
    map: [
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..................G.......',
      '..........................',
      '..........................',
      '@.........................',
      '#####.....................',
      '#####...........##########',
      '##########################'
    ]
  },
  {
    name: 'THE WRITTEN WORD',
    teaches: 'words',
    foes: ['haris', 'katib', 'mahi'],
    brief: 'Three cells of fire across the only path, and one letter clears one cell. A word runs several letters at once, each one cell further LEFT, as Arabic is written — so compose three that can pour. But a word BREAKS at any letter that never joins what follows: put alif anywhere but last and you will lose the rest of it.',
    letters: ['ج', 'ن', 'م', 'ا'],
    map: [
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '@........^^^^^......G.....',
      '##########################',
      '##########################',
      '##########################'
    ]
  },
  {
    name: 'THE WHOLE ART',
    teaches: 'all of them',
    foes: ['haris', 'mahi', 'katib', 'haris'],
    brief: 'No instruction this time. A ward, a chasm and a ledge, and every letter you have been taught. Work out the order.',
    letters: ['ا', 'م', 'ر', 'ج', 'ب'],
    map: [
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '.....................G....',
      '..........==......########',
      '..........==..............',
      '@.........==..............',
      '#######...==..............',
      '#######...==....##########',
      '##########################'
    ]
  }
];

// ===================================================================
// THE THREE THAT COME FOR YOU
//
// This is an action game before it is a puzzle, and an editor is only
// interesting under pressure. So the world fights back, and two of the
// three fight the EDITOR rather than the player — which is the point:
// you are in an argument with something else that can also rewrite the
// world, and you have to out-write it.
//
//   HARIS   the guard  — runs you down. Straightforward, and shootable.
//   MAHI    the eraser — hunts your most recent edit and UNMAKES it.
//                        Ignores you entirely. Kill it or lose your work.
//   KATIB   the scribe — keeps its distance and writes walls in your way.
//
// Named for what they do: haris a guard, mahi an effacer, katib a writer.
// ===================================================================
const FOE_KINDS = {
  haris: { name: 'ḤĀRIS', gloss: 'the guard', glyph: 'ح', hp: 2, speed: 74,
           color: '#b5342a', harms: true,
           teach: 'runs you down. Shoot it.' },
  mahi:  { name: 'MĀḤĪ',  gloss: 'the eraser', glyph: 'م', hp: 3, speed: 62,
           color: '#8f6fd9', harms: false,
           teach: 'hunts what you have written and unmakes it. It will not touch you — it does not have to.' },
  katib: { name: 'KĀTIB', gloss: 'the scribe', glyph: 'ك', hp: 2, speed: 46,
           color: '#c9a227', harms: true,
           teach: 'keeps its distance and writes walls across your path.' }
};

function spawnFoe(kind, x, y) {
  const k = FOE_KINDS[kind];
  if (!k) return null;
  const f = { kind: kind, def: k, x: x, y: y, vx: 0, vy: 0,
              hp: k.hp, maxHp: k.hp, r: CELL * 0.3, t: Math.random() * 3,
              cool: 1 + Math.random(), flash: 0, target: null };
  foes.push(f);
  return f;
}

function updateFoes(dt) {
  for (let i = foes.length - 1; i >= 0; i--) {
    const f = foes[i];
    f.t += dt; f.cool -= dt;
    if (f.flash > 0) f.flash -= dt;
    if (f.hp <= 0) {
      for (let k = 0; k < 10; k++) burst(f.x, f.y, f.def.color);
      foes.splice(i, 1); state.kills++;
      continue;
    }

    if (f.kind === 'haris') {
      // straight at you, over the ground
      const dx = Math.sign(player.x - f.x);
      f.x += dx * f.def.speed * dt;
      f.vy += 900 * dt;
      const ny = f.y + f.vy * dt;
      if (isSolid(at(world, Math.floor(f.x / CELL), Math.floor((ny + f.r) / CELL)))) {
        f.y = Math.floor((ny + f.r) / CELL) * CELL - f.r - 0.01; f.vy = 0;
        // hop a step
        if (isSolid(at(world, Math.floor((f.x + dx * f.r * 1.4) / CELL), Math.floor(f.y / CELL)))) f.vy = -330;
      } else f.y = ny;

    } else if (f.kind === 'mahi') {
      // drift to the newest edit and undo it. It floats; walls do not stop it.
      if (!f.target || !state.recent.length ||
          state.recent.indexOf(f.target) < 0) f.target = state.recent[state.recent.length - 1] || null;
      const t = f.target;
      if (t) {
        const tx = t.x * CELL + CELL / 2, ty = t.y * CELL + CELL / 2;
        const d = Math.hypot(tx - f.x, ty - f.y);
        if (d < 8) {
          setAt(world, t.x, t.y, t.from);
          state.recent.splice(state.recent.indexOf(t), 1);
          state.undone++;
          f.target = null; f.cool = 0.5;
          for (let k = 0; k < 8; k++) burst(tx, ty, '#8f6fd9');
          HELP.say('<b>MĀḤĪ</b> unmade what you wrote — kill it or it will take the rest', 3);
        } else {
          f.x += (tx - f.x) / d * f.def.speed * dt;
          f.y += (ty - f.y) / d * f.def.speed * dt;
        }
      } else {
        // nothing to erase: circle the player, waiting
        f.x += Math.cos(f.t * 0.8) * 40 * dt;
        f.y += Math.sin(f.t * 0.8) * 26 * dt;
      }

    } else if (f.kind === 'katib') {
      // hold off at range and write a wall in front of the player
      const want = player.x - Math.sign(player.x - f.x) * CELL * 5;
      f.x += Math.sign(want - f.x) * f.def.speed * dt;
      f.y += Math.sin(f.t * 1.1) * 30 * dt;
      if (f.cool <= 0) {
        f.cool = 3.2;
        const cx = Math.floor(player.x / CELL) + (player.face > 0 ? 2 : -2);
        const cy = Math.floor(player.y / CELL);
        if (!isSolid(at(world, cx, cy))) {
          setAt(world, cx, cy, T.STONE);
          for (let k = 0; k < 5; k++) burst(cx * CELL + CELL / 2, cy * CELL + CELL / 2, '#c9a227');
        }
      }
    }

    // it reaches you
    if (f.def.harms && player.invuln <= 0 &&
        Math.hypot(f.x - player.x, f.y - player.y) < f.r + player.r) {
      hurt(f.def.name + ' struck you');
    }
  }

  // pressure: a chamber keeps sending them
  state.spawnT -= dt;
  if (state.spawnT <= 0 && foes.length < 3) {
    state.spawnT = 9;
    const ch = CHAMBERS[state.chamber];
    const kinds = ch.foes || ['haris'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const side = Math.random() < 0.5 ? -1 : 1;
    spawnFoe(kind, player.x + side * viewW() * 0.55, CELL * 2);
  }
}

function hurt(why) {
  if (player.invuln > 0 || state.over) return;
  state.hp--;
  player.invuln = 1.9;
  state.shake = 11;
  for (let k = 0; k < 12; k++) burst(player.x, player.y, '#b5342a');
  if (state.hp <= 0) { die(why); state.hp = state.maxHp; }
  else HELP.say('<b>' + why + '</b> — ' + state.hp + ' left', 2.4);
}

// ===================================================================
// Loading a chamber
// ===================================================================
function loadChamber(i) {
  const ch = CHAMBERS[Math.max(0, Math.min(CHAMBERS.length - 1, i))];
  state.chamber = i;
  const rows = ch.map.length, cols = ch.map[0].length;
  world = makeWorld(cols, rows);
  tiles = []; foes = []; shots = []; sparks = [];
  player = { x: 2 * CELL, y: 2 * CELL, vx: 0, vy: 0, r: CELL * 0.34,
             onGround: false, cool: 0, invuln: 1.2, face: 1 };

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = ch.map[y][x];
      let t = T.EMPTY;
      if (c === '#') t = T.STONE;
      else if (c === '=') t = T.WARD;
      else if (c === '^') t = T.HAZARD;
      else if (c === 'G') t = T.GATE;
      else if (c === '@') { player.x = x * CELL + CELL / 2; player.y = y * CELL + CELL / 2; }
      setAt(world, x, y, t);
    }
  }
  // scatter the chamber's letter tiles on the floor
  ch.letters.forEach((g, k) => {
    const L = BY_GLYPH[g];
    if (!L) return;
    let tx = 4 + k * 3, ty = 1;
    for (let y = 1; y < rows - 1; y++) if (!isSolid(at(world, tx, y)) && isSolid(at(world, tx, y + 1))) ty = y;
    tiles.push({ letter: L, x: tx * CELL + CELL / 2, y: ty * CELL + CELL / 2, taken: false, t: 0 });
  });

  state.held = []; state.sel = 0; state.breath = 100;
  state.word = []; state.composing = false;
  state.hp = state.maxHp; state.recent = []; state.spawnT = 3.5; state.undone = 0;
  foes = [];
  // the room starts with one already in it, so the pressure is immediate
  if ((ch.foes || []).length) spawnFoe(ch.foes[0], viewW() * 0.8, CELL * 2);
  state.over = false; state.won = false; state.running = true;
  camX = 0;
  syncHeld();
  $('chName').textContent = ch.name;
  $('chBrief').textContent = ch.brief;
  $('chamberCard').classList.add('show');
  HELP.say('<b>' + ch.name + '</b> — ' + ch.brief, 9);
}

// ===================================================================
// Input and the edit cursor
// ===================================================================
function cursorCell() {
  return { x: Math.floor(state.cursor.x / CELL), y: Math.floor(state.cursor.y / CELL) };
}

function currentLetter() { return state.held[state.sel] || null; }

// A letter may carry several primitives. The one it uses is the first
// that actually applies at the cursor, so a letter is not one tool but
// a small set, and which one fires is a fact about where you point it.
function planAt(cx, cy) {
  if (!world) return null;
  // a composed word is planned as a whole; it overrides the single letter
  if (state.composing && state.word.length) return planWord(world, state.word, cx, cy);
  const L = currentLetter();
  if (!L) return null;
  for (const op of L.primitives) {
    const p = planEdit(world, L, op, cx, cy);
    if (p.ok) return p;
  }
  // nothing applied: report the first, so the player is told why
  return planEdit(world, L, L.primitives[0], cx, cy);
}

// the eraser hunts these, newest first
function remember(ch) {
  state.recent.push({ x: ch.x, y: ch.y, from: ch.from, to: ch.to });
  if (state.recent.length > 40) state.recent.shift();
}

function commitEdit() {
  const c = cursorCell();

  // ---- a composed word ----
  if (state.composing && state.word.length) {
    const plan = planWord(world, state.word, c.x, c.y);
    if (!plan.ok) { HELP.say(plan.why, 3); return; }
    if (state.breath < plan.cost) {
      HELP.say('not enough breath — “' + plan.spelling + '” costs ' + plan.cost +
               ' (the sum of its letters), you have ' + Math.floor(state.breath), 3.6);
      return;
    }
    state.breath -= plan.cost;
    for (const ch of plan.changes) { setAt(world, ch.x, ch.y, ch.to); remember(ch); burst(ch.x*CELL+CELL/2, ch.y*CELL+CELL/2, PAL.gold); }
    state.editsMade++;
    state.shake = 7;
    HELP.say('<b>' + plan.spelling + '</b> — ' + plan.why, 5);
    if (plan.whole && plan.meaning) {
      state.wordsWhole = (state.wordsWhole || 0) + 1;
      HELP.say('a well-formed word costs a third less. <b>' + plan.spelling + '</b>: ' + plan.meaning, 4.5);
    }
    state.word = []; state.composing = false;
    syncHeld();
    return;
  }

  const L = currentLetter();
  if (!L) { HELP.say('you are carrying no letters', 2); return; }
  const plan = planAt(c.x, c.y);
  if (!plan || !plan.ok) {
    HELP.say('<b>' + L.glyph + '</b> ' + (plan ? plan.why : 'nothing here'), 3);
    return;
  }
  const cost = costOf(L);
  if (state.breath < cost) {
    HELP.say('not enough breath — <b>' + L.glyph + ' ' + L.translit + '</b> costs ' + cost +
             ' (its abjad value), you have ' + Math.floor(state.breath), 3.4);
    return;
  }
  state.breath -= cost;
  for (const ch of plan.changes) remember(ch);
  const n = applyEdit(world, plan);
  state.editsMade++;
  state.shake = 5;
  for (const ch of plan.changes) burst(ch.x * CELL + CELL / 2, ch.y * CELL + CELL / 2, PAL.gold);
  HELP.say('<b>' + L.glyph + ' ' + plan.op + '</b> — ' + plan.why, 3.4);
  // a non-connecting letter fractures what it touches: the word breaks here
  if (L.facts.non_connecting && plan.op !== 'SEVER') {
    const ch = plan.changes[plan.changes.length - 1];
    if (ch && Math.random() < 0.6) {
      setAt(world, ch.x, ch.y, T.EMPTY);
      HELP.say('…but <b>' + L.glyph + '</b> never joins what follows, so the work breaks at its end', 4);
    }
  }
  syncHeld();
}

window.addEventListener('keydown', function (e) {
  const isSpace = e.code === 'Space' || e.key === ' ';
  const k = isSpace ? ' ' : (e.key || '').toLowerCase();
  if ($('startScreen').classList.contains('show')) {
    if (isSpace || k === 'enter') { start(); e.preventDefault(); }
    return;
  }
  if ($('overScreen').classList.contains('show')) {
    if (isSpace || k === 'enter') { loadChamber(state.won ? state.chamber + 1 : state.chamber);
      $('overScreen').classList.remove('show'); e.preventDefault(); }
    return;
  }
  if (k === 'tab') { e.preventDefault(); $('codexScreen').classList.toggle('show'); return; }
  if (k === 'escape') { ['codexScreen', 'chamberCard'].forEach(id => $(id).classList.remove('show')); return; }
  if (HELP.isManualOpen && HELP.isManualOpen()) return;

  keys[k] = true;
  if (isSpace) e.preventDefault();
  const n = parseInt(k, 10);
  if (n >= 1 && n <= 9 && state.held[n - 1]) { state.sel = n - 1; syncHeld(); return; }
  if (k === 'q') { state.sel = (state.sel + state.held.length - 1) % Math.max(1, state.held.length); syncHeld(); }
  if (k === 'e') { state.sel = (state.sel + 1) % Math.max(1, state.held.length); syncHeld(); }
  if (k === 'f' || k === 'enter') { commitEdit(); }
  if (k === 'c') {                       // compose: add the selected letter
    const L = currentLetter();
    if (!L) { HELP.say('nothing to compose with', 2); }
    else if (state.word.length >= 4) { HELP.say('four letters is as long as a word may be here', 2.4); }
    else {
      state.composing = true;
      state.word.push(L);
      const sp = state.word.map(x => x.glyph).join('');
      HELP.say('composing <b>' + sp + '</b>' + (WORDS[sp] ? ' — ' + WORDS[sp] : '') +
               ' · <b>Enter</b> to write it, <b>Backspace</b> to unmake', 4);
      syncHeld();
    }
  }
  if (k === 'backspace') {
    if (state.word.length) { state.word.pop(); if (!state.word.length) state.composing = false; syncHeld(); }
    e.preventDefault();
  }
  if (k === 'r') { loadChamber(state.chamber); }
  if (k === 'p') { state.paused = !state.paused; }
  if (['arrowleft','arrowright','arrowup','arrowdown'].indexOf(k) >= 0) e.preventDefault();
});
window.addEventListener('keyup', function (e) {
  const isSpace = e.code === 'Space' || e.key === ' ';
  keys[isSpace ? ' ' : (e.key || '').toLowerCase()] = false;
});

canvas.addEventListener('mousemove', function (e) {
  const r = canvas.getBoundingClientRect();
  state.cursor.x = e.clientX - r.left + camX;
  state.cursor.y = e.clientY - r.top;
});
canvas.addEventListener('mousedown', function (e) {
  if (e.button === 0) commitEdit();
  e.preventDefault();
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ===================================================================
// Update
// ===================================================================
function solidAtPx(px, py) { return isSolid(at(world, Math.floor(px / CELL), Math.floor(py / CELL))); }

function update(dt) {
  state.t += dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 24);
  state.breath = Math.min(100, state.breath + 5.5 * dt);

  // ---- player ----
  const sp = 210;
  player.vx = 0;
  if (keys['a'] || keys['arrowleft']) { player.vx = -sp; player.face = -1; }
  if (keys['d'] || keys['arrowright']) { player.vx = sp; player.face = 1; }
  player.vy += 900 * dt;
  if ((keys['w'] || keys['arrowup']) && player.onGround) { player.vy = -400; player.onGround = false; }

  // horizontal, then vertical, so a corner does not trap you
  let nx = player.x + player.vx * dt;
  if (!solidAtPx(nx + Math.sign(player.vx) * player.r, player.y)) player.x = nx;
  let ny = player.y + player.vy * dt;
  player.onGround = false;
  if (solidAtPx(player.x, ny + player.r)) {
    if (player.vy > 0) { player.y = Math.floor((ny + player.r) / CELL) * CELL - player.r - 0.01; player.vy = 0; player.onGround = true; }
  } else if (solidAtPx(player.x, ny - player.r)) {
    if (player.vy < 0) { player.vy = 0; }
    player.y = ny;
  } else player.y = ny;

  player.x = Math.max(player.r, Math.min(world.cols * CELL - player.r, player.x));
  if (player.cool > 0) player.cool -= dt;
  if (player.invuln > 0) player.invuln -= dt;

  // hazards and the void
  const under = at(world, Math.floor(player.x / CELL), Math.floor(player.y / CELL));
  if (under === T.HAZARD) hurt('the fire took you');
  if (player.y > world.rows * CELL + 60) { state.hp = 1; hurt('you fell out of the world'); }

  // the gate
  if (under === T.GATE) win();

  // ---- shooting ----
  if (keys[' '] && player.cool <= 0) {
    player.cool = 0.16;
    state.shotsFired++;
    shots.push({ x: player.x + player.face * 12, y: player.y, vx: player.face * 460, vy: 0, life: 1.6 });
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx * dt; s.life -= dt;
    if (s.life <= 0) { shots.splice(i, 1); continue; }
    // a shot hits a foe before it hits the wall behind it
    let hitFoe = false;
    for (const f of foes) {
      if (Math.hypot(f.x - s.x, f.y - s.y) < f.r + 5) {
        f.hp--; f.flash = 0.2;
        burst(s.x, s.y, f.def.color);
        shots.splice(i, 1); hitFoe = true; break;
      }
    }
    if (hitFoe) continue;

    const tx = Math.floor(s.x / CELL), ty = Math.floor(s.y / CELL);
    const t = at(world, tx, ty);
    if (t === T.STONE || t === T.GLASS) {
      setAt(world, tx, ty, T.EMPTY);          // ordinary matter yields to a shot
      burst(s.x, s.y, PAL.stone);
      shots.splice(i, 1); continue;
    }
    if (t === T.WARD || t === T.GATE) {
      burst(s.x, s.y, PAL.ward);
      HELP.say('a ward does not yield to shooting — only a severing letter opens it', 2.6);
      shots.splice(i, 1); continue;
    }
  }

  // ---- the enemies ----
  updateFoes(dt);

  // ---- letter tiles ----
  for (const tl of tiles) {
    if (tl.taken) continue;
    tl.t += dt;
    if (Math.hypot(tl.x - player.x, tl.y - player.y) < CELL * 0.8) {
      tl.taken = true;
      state.held.push(tl.letter);
      state.sel = state.held.length - 1;
      syncHeld();
      // NOT showLetter() — that opens a card and freezes the world, which is
      // the wrong thing to do to somebody who is being chased. The narrator
      // says it instead, and the card is a click away on the tile.
      HELP.say('took <b>' + tl.letter.glyph + ' ' + tl.letter.name + '</b> — ' +
               tl.letter.primitives.map(p => OP_INFO[p].verb).join(', ') +
               ' &nbsp;<span style="opacity:.7">(click the tile to read it)</span>', 5);
    }
  }

  // ---- sparks ----
  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i];
    p.life -= dt;
    if (p.life <= 0) { sparks.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.vx *= 0.96;
  }

  // camera
  const target = Math.max(0, Math.min(world.cols * CELL - viewW(), player.x - viewW() * 0.45));
  camX += (target - camX) * Math.min(1, dt * 6);

  // live preview of the edit under the cursor
  const c = cursorCell();
  state.lastPlan = planAt(c.x, c.y);
}

function die(why) {
  if (state.over) return;
  state.deaths++;
  player.invuln = 1.4;
  HELP.say('<b>' + why + '</b> — the chamber resets around you', 3);
  const ch = CHAMBERS[state.chamber];
  // put the player back without undoing their edits: the world they made stands
  for (let y = 0; y < ch.map.length; y++) for (let x = 0; x < ch.map[0].length; x++)
    if (ch.map[y][x] === '@') { player.x = x * CELL + CELL / 2; player.y = y * CELL + CELL / 2; }
  player.vx = player.vy = 0;
}

function win() {
  if (state.over) return;
  state.over = true; state.won = true; state.running = false;
  const last = state.chamber >= CHAMBERS.length - 1;
  $('overTitle').textContent = last ? 'THE ART IS WHOLE' : 'THE GATE OPENS';
  $('overSub').textContent = last
    ? 'you have used every letter you were given'
    : 'the chamber is passed';
  $('overLine').textContent =
    'Chamber ' + (state.chamber + 1) + ' of ' + CHAMBERS.length +
    ' · ' + state.editsMade + ' edits · ' + state.shotsFired + ' shots' +
    (state.deaths ? ' · ' + state.deaths + ' deaths' : '');
  $('againBtn').textContent = last ? 'BEGIN AGAIN' : 'THE NEXT CHAMBER';
  $('overScreen').classList.add('show');
}

function burst(x, y, color) {
  for (let i = 0; i < 6; i++) {
    const a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 130;
    sparks.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                  life: 0.2 + Math.random() * 0.4, max: 0.6, color: color });
  }
}

function viewW() { return canvas.clientWidth || window.innerWidth || 900; }
function viewH() { return canvas.clientHeight || window.innerHeight || 600; }

// ===================================================================
// Draw
// ===================================================================
const TILE_COLOR = {
  1: PAL.stone, 2: PAL.ward, 3: PAL.flow, 4: PAL.glass, 5: PAL.hazard, 6: PAL.gate
};

function draw() {
  const w = viewW(), h = viewH();
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, w, h);
  if (!world) return;

  ctx.save();
  if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  ctx.translate(-camX, 0);

  // the grid, faintly — this is a level editor and it should look like one
  ctx.strokeStyle = 'rgba(120,132,148,.09)';
  ctx.lineWidth = 1;
  const x0 = Math.floor(camX / CELL), x1 = Math.ceil((camX + w) / CELL);
  for (let x = x0; x <= x1; x++) {
    ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, world.rows * CELL); ctx.stroke();
  }
  for (let y = 0; y <= world.rows; y++) {
    ctx.beginPath(); ctx.moveTo(x0 * CELL, y * CELL); ctx.lineTo(x1 * CELL, y * CELL); ctx.stroke();
  }

  // the world
  for (let y = 0; y < world.rows; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = at(world, x, y);
      if (t === T.EMPTY) continue;
      const px = x * CELL, py = y * CELL;
      ctx.fillStyle = TILE_COLOR[t] || PAL.stone;
      if (t === T.FLOW) {
        ctx.globalAlpha = 0.4;
        ctx.fillRect(px, py, CELL, CELL);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = PAL.flow;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const yy = py + 6 + i * 9 + Math.sin(state.t * 3 + x + i) * 2;
          ctx.moveTo(px + 4, yy); ctx.lineTo(px + CELL - 4, yy);
        }
        ctx.stroke();
      } else {
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        if (t === T.WARD) {
          ctx.strokeStyle = 'rgba(232,226,212,.5)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(px + 4.5, py + 4.5, CELL - 9, CELL - 9);
        }
        if (t === T.GATE) {
          ctx.fillStyle = '#0d0f12';
          ctx.font = Math.round(CELL * 0.6) + 'px "Courier New", monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('◈', px + CELL / 2, py + CELL / 2);
        }
      }
    }
  }

  // ---- THE LANDING PREVIEW ----
  // the same call that would edit the world, drawn as a ghost instead
  const plan = state.lastPlan;
  const cc = cursorCell();
  if (plan) {
    ctx.save();
    // a word shows where it breaks: what runs, and what is lost
    if (plan.steps) {
      for (const st of plan.steps) {
        const [sx2, sy2] = st.at;
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = st.ran ? PAL.gold : '#b5342a';
        ctx.setLineDash(st.ran ? [] : [3, 3]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx2 * CELL + 2.5, sy2 * CELL + 2.5, CELL - 5, CELL - 5);
        ctx.setLineDash([]);
        ctx.fillStyle = st.ran ? PAL.gold : '#b5342a';
        ctx.font = Math.round(CELL * 0.42) + 'px "Times New Roman", serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(st.letter.glyph, sx2 * CELL + CELL / 2, sy2 * CELL + CELL / 2);
        ctx.globalAlpha = 1;
      }
    }
    if (plan.ok) {
      ctx.globalAlpha = 0.42 + Math.sin(state.t * 6) * 0.12;
      for (const ch of plan.changes) {
        ctx.fillStyle = ch.to === T.EMPTY ? '#b5342a' : (TILE_COLOR[ch.to] || PAL.gold);
        ctx.fillRect(ch.x * CELL + 2, ch.y * CELL + 2, CELL - 4, CELL - 4);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = PAL.gold;
      ctx.lineWidth = 1.5;
      for (const ch of plan.changes) ctx.strokeRect(ch.x * CELL + 1.5, ch.y * CELL + 1.5, CELL - 3, CELL - 3);
    } else {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#b5342a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cc.x * CELL + 1.5, cc.y * CELL + 1.5, CELL - 3, CELL - 3);
      ctx.beginPath();
      ctx.moveTo(cc.x * CELL + 5, cc.y * CELL + 5);
      ctx.lineTo(cc.x * CELL + CELL - 5, cc.y * CELL + CELL - 5);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // letter tiles lying about
  for (const tl of tiles) {
    if (tl.taken) continue;
    const bob = Math.sin(tl.t * 2.4) * 3;
    ctx.save();
    ctx.translate(tl.x, tl.y + bob);
    ctx.fillStyle = '#1a1f26';
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 1.5;
    ctx.fillRect(-CELL * 0.4, -CELL * 0.4, CELL * 0.8, CELL * 0.8);
    ctx.strokeRect(-CELL * 0.4, -CELL * 0.4, CELL * 0.8, CELL * 0.8);
    ctx.fillStyle = PAL.gold;
    ctx.font = Math.round(CELL * 0.52) + 'px "Times New Roman", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(tl.letter.glyph, 0, 1);
    ctx.restore();
  }

  // shots
  ctx.fillStyle = PAL.ink;
  for (const s of shots) ctx.fillRect(s.x - 5, s.y - 1.5, 10, 3);

  // sparks
  for (const p of sparks) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;

  // the enemies
  for (const f of foes) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.fillStyle = f.flash > 0 ? '#ffffff' : f.def.color;
    ctx.globalAlpha = 0.92;
    ctx.beginPath(); ctx.arc(0, 0, f.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#0d0f12';
    ctx.font = Math.round(f.r * 1.15) + 'px "Times New Roman", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(f.def.glyph, 0, 1);
    if (f.maxHp > 1) {
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(-f.r, -f.r - 6, f.r * 2, 3);
      ctx.fillStyle = f.def.color;
      ctx.fillRect(-f.r, -f.r - 6, f.r * 2 * Math.max(0, f.hp) / f.maxHp, 3);
    }
    ctx.restore();
    // the eraser draws a line to what it is coming for
    if (f.kind === 'mahi' && f.target) {
      ctx.strokeStyle = 'rgba(143,111,217,.55)';
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.target.x * CELL + CELL / 2, f.target.y * CELL + CELL / 2);
      ctx.stroke(); ctx.setLineDash([]);
    }
  }

  // the player
  ctx.save();
  ctx.translate(player.x, player.y);
  if (player.invuln > 0 && Math.floor(state.t * 14) % 2) ctx.globalAlpha = 0.4;
  ctx.fillStyle = PAL.player;
  ctx.fillRect(-player.r, -player.r, player.r * 2, player.r * 2);
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(player.face > 0 ? 2 : -player.r, -3, player.r - 2, 3);
  ctx.restore();

  ctx.restore();

  // the cursor, in screen space
  ctx.strokeStyle = 'rgba(201,162,39,.8)';
  ctx.lineWidth = 1;
  const sx = cc.x * CELL - camX, sy = cc.y * CELL;
  ctx.strokeRect(sx + 0.5, sy + 0.5, CELL - 1, CELL - 1);
}

// ===================================================================
// HUD
// ===================================================================
function syncHeld() {
  const host = $('held');
  host.innerHTML = '';
  if (!state.held.length) {
    host.innerHTML = '<div class="none">no letters yet — walk over a tile</div>';
  }
  state.held.forEach((L, i) => {
    const d = document.createElement('div');
    d.className = 'tile' + (i === state.sel ? ' on' : '');
    d.innerHTML = '<div class="g">' + L.glyph + '</div>' +
                  '<div class="k">' + (i + 1) + ' · ' + L.translit + '</div>' +
                  '<div class="c">' + costOf(L) + '</div>';
    d.addEventListener('click', () => { state.sel = i; syncHeld(); showLetter(L); });
    host.appendChild(d);
  });
  const L = currentLetter();
  if (L) {
    $('curGlyph').textContent = L.glyph;
    $('curName').textContent = L.name + ' · abjad ' + L.abjad;
    $('curOps').innerHTML = L.primitives.map(p =>
      '<b>' + OP_INFO[p].verb + '</b> <span class="d">' + OP_INFO[p].hint + '</span>').join('<br>');
  } else {
    $('curGlyph').textContent = '—';
    $('curName').textContent = 'nothing held';
    $('curOps').textContent = '';
  }
}

function syncHUD() {
  const hp = $('hearts');
  if (hp) {
    let h = '';
    for (let i = 0; i < state.maxHp; i++) h += '<i class="' + (i < state.hp ? 'on' : '') + '"></i>';
    hp.innerHTML = h;
  }
  const fc = $('foeCount');
  if (fc) fc.textContent = foes.length ? foes.length + ' hunting' : '—';

  // the word being composed
  const wb = $('wordBar');
  if (state.composing && state.word.length) {
    const sp = state.word.map(x => x.glyph).join('');
    const plan = world ? planWord(world, state.word, cursorCell().x, cursorCell().y) : null;
    wb.classList.add('show');
    wb.classList.toggle('whole', !!(plan && plan.whole));
    $('wbWord').textContent = sp;
    $('wbMean').textContent = WORDS[sp] ? '“' + WORDS[sp] + '”' : 'not a word — but it will still run';
    $('wbCost').textContent = plan ? (plan.cost + ' breath' + (plan.whole ? '  (a third off: well-formed)' : '')) : '';
    $('wbBreak').innerHTML = plan
      ? (plan.whole ? 'every letter joins — it runs whole'
                    : 'breaks at <b>' + state.word[plan.breakAt].glyph + '</b>, which never joins what follows')
      : '';
  } else wb.classList.remove('show');

  $('breathFill').style.width = state.breath + '%';
  $('breathN').textContent = Math.floor(state.breath);
  $('chamberN').textContent = (state.chamber + 1) + '/' + CHAMBERS.length;
  const p = state.lastPlan;
  const box = $('preview');
  if (p && currentLetter()) {
    box.classList.add('show');
    box.className = 'show ' + (p.ok ? 'ok' : 'no');
    $('pvOp').textContent = p.ok ? (OP_INFO[p.op] ? OP_INFO[p.op].verb : p.op) : 'NO EFFECT HERE';
    $('pvWhy').textContent = p.why;
    $('pvCost').textContent = p.ok ? ('costs ' + costOf(currentLetter()) + ' breath') : '';
  } else box.classList.remove('show');
}

// the frame explaining the letter, which Ted asked for by name
function showLetter(L) {
  const f = L.facts;
  const rows = [
    ['ABJAD', L.abjad + '  (its numerical value, and what an edit costs)'],
    ['CLASS', L.class === 'nurani' ? 'nūrānī — one of the fourteen luminous letters' : 'ẓulmānī — one of the fourteen dark letters'],
    ['SUN / MOON', f.sun ? 'sun letter — the article’s lām assimilates to it' : 'moon letter — the article’s lām stays itself'],
    ['JOINS FORWARD', f.non_connecting ? 'NO — a word breaks here' : 'yes'],
    ['DOTS', (f.dots_above ? f.dots_above + ' above' : '') + (f.dots_below ? f.dots_below + ' below' : '') || 'none'],
    ['FORM', [L.form.closed ? 'closed' : null, L.form.tail ? 'a descending tail' : null,
              L.form.orientation === 'vertical' ? 'an upright stroke' : null].filter(Boolean).join(', ') || L.form.orientation],
    ['ARTICULATION', L.grammar.articulation]
  ];
  $('liGlyph').textContent = L.glyph;
  $('liName').innerHTML = L.name + ' <span class="tr">' + L.translit + '</span>';
  $('liFacts').innerHTML = rows.map(r => '<div class="lf"><b>' + r[0] + '</b>' + r[1] + '</div>').join('');
  $('liOps').innerHTML = L.primitive_detail.map(p =>
    '<div class="lo"><b>' + p.op + ' — ' + OP_INFO[p.op].verb + '</b>' +
    '<div class="from">granted by: ' + p.from + '</div>' +
    '<div class="hint">' + OP_INFO[p.op].hint + '</div></div>').join('');
  $('liNote').textContent = L.note || '';
  $('letterCard').classList.add('show');
}

function buildCodex() {
  const host = $('codexBody');
  host.innerHTML = LETTERS.map(L =>
    '<div class="crow" data-g="' + L.glyph + '">' +
      '<span class="cg">' + L.glyph + '</span>' +
      '<span class="cn">' + L.name + '</span>' +
      '<span class="ca">' + L.abjad + '</span>' +
      '<span class="cp">' + L.primitives.map(p => OP_INFO[p].verb).join(' · ') + '</span>' +
    '</div>').join('');
  host.querySelectorAll('.crow').forEach(r => r.addEventListener('click', () => {
    const L = BY_GLYPH[r.getAttribute('data-g')];
    if (L) { $('codexScreen').classList.remove('show'); showLetter(L); }
  }));
}

// ===================================================================
// Lifecycle and loop
// ===================================================================
function start() {
  $('startScreen').classList.remove('show');
  loadChamber(0);
}
$('startBtn').addEventListener('click', function () { start(); this.blur(); });
$('againBtn').addEventListener('click', function () {
  $('overScreen').classList.remove('show');
  loadChamber(state.won ? Math.min(CHAMBERS.length - 1, state.chamber + 1) : state.chamber);
  this.blur();
});
$('letterClose').addEventListener('click', function () { $('letterCard').classList.remove('show'); this.blur(); });
$('chamberClose').addEventListener('click', function () { $('chamberCard').classList.remove('show'); this.blur(); });
$('codexClose').addEventListener('click', function () { $('codexScreen').classList.remove('show'); this.blur(); });

function layout() {
  const w = canvas.clientWidth || window.innerWidth || 900;
  const h = canvas.clientHeight || window.innerHeight || 600;
  canvas.width = Math.floor(w * devicePixelRatio);
  canvas.height = Math.floor(h * devicePixelRatio);
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  CELL = Math.max(24, Math.min(40, Math.floor(h / 13)));
}

let last = 0;
function frame(now) {
  const dt = Math.max(0, Math.min(0.045, (now - last) / 1000 || 0));
  last = now;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w !== canvas._lw || h !== canvas._lh) { canvas._lw = w; canvas._lh = h; layout(); }
  const reading = $('letterCard').classList.contains('show') ||
                  $('codexScreen').classList.contains('show');
  if (state.running && !state.paused && !state.over && !reading &&
      !(HELP.isManualOpen && HELP.isManualOpen())) {
    update(dt);
    syncHUD();
  }
  HELP.tick(dt);
  draw();
  requestAnimationFrame(frame);
}

// ===================================================================
// Boot
// ===================================================================
layout();
fetch('src/letters.json?v=1')
  .then(r => r.json())
  .then(doc => {
    LETTERS = doc.letters;
    for (const L of LETTERS) BY_GLYPH[L.glyph] = L;
    buildCodex();
    syncHeld();
  })
  .catch(() => HELP.say('the alphabet did not load', 6));

HELP.install({
  id: 'lettrism',
  title: 'LETTRISM SHOOTER',
  subtitle: 'the developer mode of reality',
  premise: 'Al-Būnī calls the twenty-eight Arabic letters the "corporeal letters", the building ' +
    'blocks of manifest reality, and Ibn Turka treats the alphabet as the cosmos’s source code. ' +
    'So here the alphabet is not the theme, it is the LEVEL EDITOR. You collect tiles bearing the ' +
    'letters and each grants the world-edit that its own written form dictates.',
  goal: 'Reach the gate ◈ in each chamber. You cannot shoot your way there: ordinary stone yields to ' +
    'a shot, but warded stone does not, chasms cannot be shot across, and ledges cannot be shot up to. ' +
    'You have to edit the world instead.',
  controls: [
    ['A  D', 'walk'],
    ['W', 'jump'],
    ['Space', 'shoot'],
    ['mouse', 'aim the edit cursor'],
    ['click / F', 'COMMIT THE EDIT'],
    ['1 – 9', 'choose a letter'],
    ['C', 'ADD TO A WORD'],
    ['Enter', 'write the word'],
    ['Backspace', 'unmake it'],
    ['Q  E', 'cycle letters'],
    ['Tab', 'the codex of all 28'],
    ['R', 'restart the chamber'],
    ['P', 'pause']
  ],
  stripNote: '<b>The ghost under your cursor is a landing preview</b> — it is the same calculation ' +
             'that would edit the world, drawn instead of applied. Gold means it will work; a red ' +
             'cross means that letter does nothing there.',
  opening: 'Press <b>H</b> for the manual. Move the mouse to aim, and watch the ghost.',
  systems: [
    { title: 'WHY EACH LETTER DOES WHAT IT DOES',
      body: '<p>Nothing here was assigned by taste. A letter’s power is derived from a fact about ' +
            'its written form or its grammar that anyone can check against a page — which is the rule ' +
            'this engine takes from its sibling project, TurkaGame.</p>',
      table: { head: ['the fact', 'the power', 'how many letters'],
        rows: [
          ['a single upright stroke', '<b>AXIS</b> — raise a pillar', '2'],
          ['n dots above', '<b>RAISE</b> — lift the ground n cells', '12'],
          ['n dots below', '<b>LOWER</b> — sink the ground n cells', '3'],
          ['a closed form', '<b>BIND</b> — bridge a gap into one body', '9'],
          ['a descending tail', '<b>POUR</b> — open a channel through matter', '17'],
          ['never joins what follows', '<b>SEVER</b> — cut; the only thing that opens a ward', '6'],
          ['a sun letter', '<b>ASSIMILATE</b> — the target becomes what is beside it', '14'],
          ['a moon letter', '<b>DISTINGUISH</b> — ward it against all further change', '14']
        ] } },
    { title: 'WORDS — LETTERS IN SEQUENCE',
      body: '<p>A single letter is one tool. <b>A word is a program.</b> Press <b>C</b> to add the ' +
            'letter you are holding to a word, up to four, then <b>Enter</b> to write it. Each letter ' +
            'fires in turn, one cell further LEFT each time, because that is the direction Arabic is ' +
            'written.</p>' +
            '<div class="note"><b>And the orthography is the control flow.</b> Six letters — ' +
            '<b>ا د ذ ر ز و</b> — never join what follows. A word BREAKS at such a letter: everything ' +
            'up to and including it runs, and the rest is lost. This is not invented; it is why a ' +
            'written Arabic word looks like several pieces on the page.<br><br>' +
            '<b>باب</b> <i>bāb</i>, door — breaks after the alif, exactly as the written word does.<br>' +
            '<b>درب</b> <i>darb</i>, path — breaks after the dāl, immediately.<br>' +
            '<b>قمر</b> <i>qamar</i>, moon — every letter joins. It runs whole.<br>' +
            '<b>جبل</b> <i>jabal</i>, mountain — runs whole.</div>' +
            '<p>A word that runs whole is <b>well-formed</b> and costs a third less. That is the only ' +
            'reward for vocabulary, and it is a real one: a player who knows how a word is written ' +
            'knows before writing it how much of it will run.</p>' },
    { title: 'THE ABJAD IS THE PRICE',
      body: '<p>Every letter has a numerical value in the abjad reckoning, and that value is what its ' +
            'edit costs from your breath. Alif is 1 and nearly free. The thousand-letter is ruinous. ' +
            'The economy is the tradition’s own arithmetic, not a balance number someone picked.</p>' },
    { title: 'A WORD BREAKS AT A NON-JOINING LETTER',
      body: '<div class="note">Six letters — <b>ا د ذ ر ز و</b> — never join what follows them. That is ' +
            'simply why an Arabic word looks like several pieces on the page. Here it has a ' +
            'consequence: build with one of those and the work tends to <b>fracture at its end</b>. ' +
            'They are also the only letters that cut a ward. The letters that break things are the ' +
            'letters that get you through boundaries.</div>' },
    { title: 'WHAT THE PIECES ARE',
      body: '<p><b>stone</b> — ordinary matter; a shot opens it.<br>' +
            '<b>warded stone</b> — shooting does nothing; only SEVER.<br>' +
            '<b>channel</b> — passable, and things fall through.<br>' +
            '<b>bound matter</b> — what BIND leaves behind: solid, and it remembers it was two things.<br>' +
            '<b>hazard</b> — kills; can be severed or poured away.<br>' +
            '<b>◈ the gate</b> — the way out.</p>' }
  ]
});

requestAnimationFrame(function (t) { last = t; requestAnimationFrame(frame); });

// exposed for headless verification — getters, because these are reassigned
window.LS = {
  get state(){ return state; }, get world(){ return world; }, get player(){ return player; },
  get tiles(){ return tiles; }, get LETTERS(){ return LETTERS; }, get keys(){ return keys; },
  get foes(){ return foes; }, spawnFoe: spawnFoe, FOE_KINDS: FOE_KINDS,
  loadChamber: loadChamber, planAt: planAt, commitEdit: commitEdit, frame: frame,
  compose: (gl) => { const L = BY_GLYPH[gl]; if (L) { state.composing = true; state.word.push(L); } },
  start: start, CHAMBERS: CHAMBERS, showLetter: showLetter,
  get BY_GLYPH(){ return BY_GLYPH; }
};
