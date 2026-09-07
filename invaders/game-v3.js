// ===================================================================
// ALCHEMY BLOCK INVADERS — v3
//
// Twenty-six glyph blocks, each behaving as its symbolism dictates;
// seven kinds of matter to load; three spells; a Gradius power bar; and
// a cascade engine that lets one shot set off a chain across the board.
//
// Two modes:
//   CABINET — an exhibition. Every block laid out in a labelled bay,
//             nothing descends, nothing can kill you, azoth is free and
//             the power bar is handed to you. Made for experimenting.
//   WAVES   — the actual game.
//
// Loop discipline carried over from the v2 audit, and it is not
// optional: ONE animation loop guarded by a flag, dt clamped at BOTH
// ends, every block resolved exactly once per frame, difficulty capped.
// ===================================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);

const PAL = {
  bg: '#0e0c0a', ink: '#f0e6d2', dim: '#8d7a55', gold: '#f5c518',
  red: '#d64933', cyan: '#6fd3c7'
};

let CELL = 46, ORIGIN_X = 0, COLS = 14;
const cfg = { cell: 46, cols: 14, originX: 0, graveyard: [], maxBlocks: 150 };

const state = {
  mode: 'cabinet', running: false, paused: false, over: false,
  score: 0, lives: 3, wave: 0, best: 0,
  ammo: 'fire', t: 0, shake: 0, spawnTimer: 0
};

let blocks = [], shots = [], hostiles = [], capsules = [], sparks = [];
let ars = makeArsenal();
let ship = { x: 0, y: 0, r: 15, speed: 380, cool: 0, invuln: 0 };
const keys = {};

// ===================================================================
// Layout
// ===================================================================
function layout() {
  const w = canvas.clientWidth || window.innerWidth || 900;
  const h = canvas.clientHeight || window.innerHeight || 600;
  canvas.width = Math.floor(w * devicePixelRatio);
  canvas.height = Math.floor(h * devicePixelRatio);
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  COLS = Math.max(9, Math.min(16, Math.floor(w / 78)));
  CELL = Math.min(64, Math.floor(w / (COLS + 1)));
  ORIGIN_X = Math.round((w - COLS * CELL) / 2);
  cfg.cell = CELL; cfg.cols = COLS; cfg.originX = ORIGIN_X;
  ship.y = h - 54;
  if (!ship.x) ship.x = w / 2;
}

function viewW() { return canvas.clientWidth || window.innerWidth || 900; }
function viewH() { return canvas.clientHeight || window.innerHeight || 600; }

// ===================================================================
// Blocks
// ===================================================================
function makeBlock(glyphKey, gx, gy, opts) {
  const def = GLYPHS[glyphKey];
  if (!def) return null;
  const b = {
    glyphKey: glyphKey, def: def, gx: gx, gy: gy,
    x: ORIGIN_X + gx * CELL + CELL / 2,
    y: (opts && opts.y !== undefined) ? opts.y : (gy * CELL + CELL / 2 + 60),
    hp: def.hp, maxHp: def.hp, alive: true,
    armour: 0, burning: 0, frozen: 0, infected: 0, slow: 1, slowFor: 0,
    swell: 0, scale: 1, flash: 0, label: (opts && opts.label) || null,
    twinned: (opts && opts.twinned) || false
  };
  blocks.push(b);
  return b;
}

function spawnBlock(glyphKey, gx, gy) {
  return makeBlock(glyphKey, gx, Math.max(0, gy), { y: Math.max(70, gy * CELL + CELL / 2 + 60) });
}

// ===================================================================
// THE CABINET — the exhibition level
//
// All twenty-six in reading order, each in its own bay with its name and
// its behaviour written beneath it. Nothing moves. Blocks come back a
// few seconds after you break them so you can try the same one again
// with different matter, which is the entire point of the room.
// ===================================================================
const cabinetSeats = [];

function buildCabinet() {
  blocks = []; shots = []; hostiles = []; capsules = []; cabinetSeats.length = 0;
  // Five to a row with a deep gutter: each bay carries a name and, when it is
  // the one you are standing under, a full description. Cramped rows made those
  // captions collide into mush.
  const perRow = Math.max(4, Math.min(5, Math.floor(COLS / 2)));
  const nRows = Math.ceil(TUTORIAL_ORDER.length / perRow);
  // Fit every row between the readout panel and the vessel. A fixed gutter put
  // the last row underneath the ship and off the bottom of the screen.
  const top = 178;
  const bottom = viewH() - 168;         // clears the narrator line as well as the vessel
  const rowGap = nRows > 1 ? Math.max(58, (bottom - top) / (nRows - 1)) : 0;
  TUTORIAL_ORDER.forEach((key, i) => {
    const gx = (i % perRow) * 2 + Math.floor((COLS - perRow * 2) / 2);
    const gy = Math.floor(i / perRow);
    const b = makeBlock(key, gx, gy, { y: top + gy * rowGap, label: true });
    if (b) cabinetSeats.push({ key: key, gx: gx, gy: gy, y: b.y, respawn: 0 });
  });
  // every power-up, free, so the bar can be tried immediately
  ars = makeArsenal();
  ars.azoth = AZOTH_MAX;
  ars.cursor = 0;
  state.lives = 3; state.wave = 0;
}

function cabinetTick(dt) {
  for (const s of cabinetSeats) {
    const live = blocks.some(b => b.alive && b.gx === s.gx && b.gy === s.gy);
    if (!live) {
      s.respawn -= dt;
      if (s.respawn <= 0) {
        makeBlock(s.key, s.gx, s.gy, { y: s.y, label: true });
        s.respawn = 0;
      } else if (s.respawn === 0) s.respawn = 3.5;
    } else s.respawn = 3.5;
  }
  // in the cabinet the pool is bottomless and the bar always has one banked
  ars.azoth = AZOTH_MAX;
  if (ars.cursor < 0) ars.cursor = 0;
}

// ===================================================================
// WAVES
// ===================================================================
function buildWave(n) {
  blocks = []; shots = []; hostiles = []; capsules = [];
  const rows = Math.min(5, 2 + Math.floor(n / 2));
  const pool = poolForWave(n);
  for (let r = 0; r < rows; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (Math.random() < 0.22) continue;
      const key = pool[Math.floor(Math.random() * pool.length)];
      makeBlock(key, c, r, { y: 90 + r * (CELL + 6) });
    }
  }
  state.spawnTimer = 0;
}

// the registers arrive in the order the art teaches them
function poolForWave(n) {
  const el = ['fire', 'water', 'air', 'earth'];
  const pr = ['sulphur', 'salt', 'mercury'];
  const pl = ['venus', 'mars', 'jupiter', 'saturn', 'luna', 'mercurius', 'sol'];
  const op = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
              'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  if (n <= 1) return el;
  if (n === 2) return el.concat(pr);
  if (n <= 4) return el.concat(pr, pl.slice(0, 4));
  if (n <= 6) return el.concat(pr, pl);
  return el.concat(pr, pl, op);
}

// ===================================================================
// Firing and the cascade
// ===================================================================
function fire() {
  if (ship.cool > 0) return;
  ship.cool = ars.owned.twin ? 0.16 : 0.14;
  const mk = (dx, vx) => shots.push({
    x: ship.x + dx, y: ship.y - 16, vx: vx || 0, vy: -620,
    glyph: state.ammo, power: 2, r: 5, pierce: !!ars.owned.pierce, life: 3
  });
  mk(0, 0);
  if (ars.owned.twin) { mk(-11, 0); mk(11, 0); }
  if (ars.owned.wide) { mk(0, -190); mk(0, 190); }
}

function blockAtPoint(x, y) {
  for (const b of blocks) {
    if (!b.alive) continue;
    const half = CELL * 0.42 * (b.scale || 1);
    if (Math.abs(b.x - x) < half && Math.abs(b.y - y) < half) return b;
  }
  return null;
}

function strike(b, shot) {
  const report = resolveCascade([], {
    blocks: blocks, cfg: cfg, shot: shot, seedBlock: b,
    spawn: spawnBlock,
    reflect: (blk, s) => hostiles.push({ x: blk.x, y: blk.y, vx: 0, vy: 520, r: 5, life: 4 }),
    onKill: (killed) => {
      if (state.mode === 'waves' && Math.random() < 0.3) {
        capsules.push({ x: killed.x, y: killed.y, taken: false });
      }
      for (let i = 0; i < 7; i++) burst(killed.x, killed.y, killed.def.color);
    }
  });

  state.score += report.scored;
  if (report.depth > state.best) state.best = report.depth;

  // the readout: what this block is and why it did that
  showReadout(b, report);

  if (report.depth >= 4) {
    $('chain').classList.add('show');
    $('chainN').textContent = report.depth;
    chainHold = 2.2;
    state.shake = Math.min(16, 3 + report.depth * 0.5);
  }
  return report;
}

let chainHold = 0, readoutHold = 0, focusBlock = null;

function showReadout(b, report) {
  const d = b.def;
  $('roName').innerHTML = d.glyph + ' &nbsp;' + d.name +
    ' <span style="opacity:.5;font-size:10px;letter-spacing:.14em">' +
    REGISTERS[d.register].name + '</span>';
  $('roDoct').textContent = d.doctrine;
  $('roBehav').textContent = d.behaviour;
  $('roTeach').textContent = d.teach;
  $('readout').classList.add('show');
  readoutHold = 6.5;
  for (const line of report.lines) HELP.say(line, 3.4);
  if (report.depth >= 8) {
    HELP.say('<b>A CHAIN OF ' + report.depth + '.</b> One shot did all of that — ' +
             'that is what the glyphs are for.', 4.2);
  }
}

function burst(x, y, color) {
  const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * 190;
  sparks.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                life: 0.25 + Math.random() * 0.5, max: 0.75, color: color });
}

// ===================================================================
// Update
// ===================================================================
function update(dt) {
  state.t += dt;
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 26);
  regenAzoth(ars, dt);
  if (ars.castFlash > 0) ars.castFlash -= dt;

  // ---- ship ----
  const sp = ship.speed * (1 + 0.28 * (ars.owned.speed || 0));
  if (keys['arrowleft'] || keys['a']) ship.x -= sp * dt;
  if (keys['arrowright'] || keys['d']) ship.x += sp * dt;
  ship.x = Math.max(20, Math.min(viewW() - 20, ship.x));
  if (ship.cool > 0) ship.cool -= dt;
  if (ship.invuln > 0) ship.invuln -= dt;
  if (keys[' ']) fire();

  // ---- shots ----
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life <= 0 || s.y < -20 || s.x < -20 || s.x > viewW() + 20) { shots.splice(i, 1); continue; }
    const hit = blockAtPoint(s.x, s.y);
    if (hit) {
      strike(hit, s);
      if (!s.pierce) shots.splice(i, 1);
    }
  }

  // ---- reflected shots come back down at you ----
  for (let i = hostiles.length - 1; i >= 0; i--) {
    const h = hostiles[i];
    h.x += h.vx * dt; h.y += h.vy * dt; h.life -= dt;
    if (h.life <= 0 || h.y > viewH() + 20) { hostiles.splice(i, 1); continue; }
    if (state.mode === 'waves' && ship.invuln <= 0 &&
        Math.hypot(h.x - ship.x, h.y - ship.y) < ship.r + h.r) {
      hostiles.splice(i, 1); hurt('☽ your own shot, returned by the silver');
    }
  }

  // ---- per-block conditions ----
  for (const b of blocks) {
    if (!b.alive) continue;
    if (b.flash > 0) b.flash -= dt;
    if (b.frozen > 0) b.frozen -= dt;
    if (b.slowFor > 0) { b.slowFor -= dt; if (b.slowFor <= 0) b.slow = 1; }
    if (b.burning > 0) {
      b.burning -= dt;
      b.hp -= dt * 2.2;
      if (b.hp <= 0) { b.alive = false; for (let i = 0; i < 6; i++) burst(b.x, b.y, PAL.red); }
    }
    if (b.infected > 0) {
      b.infected -= dt;
      if (b.infected <= 0) {
        b.alive = false;
        for (let i = 0; i < 8; i++) burst(b.x, b.y, '#6b4a7a');
        // putrefaction spreads on its own
        const w = makeWorld(blocks, cfg);
        for (const n of w.neighbours(b, 1)) if (!n.infected) n.infected = 2.2;
      }
    }
  }

  // ---- descent (waves only) ----
  if (state.mode === 'waves') {
    const fall = (26 + state.wave * 5) * dt;
    for (const b of blocks) {
      if (!b.alive || b.frozen > 0) continue;
      b.y += fall * (b.slow || 1);
    }
    // resolve each block exactly once: past the floor, or at the ship
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      if (!b.alive) continue;
      if (b.y - CELL / 2 > viewH()) {
        b.alive = false;
        hurt('a block reached the floor');
        continue;
      }
      if (ship.invuln <= 0 && Math.abs(b.y - ship.y) < CELL * 0.5 && Math.abs(b.x - ship.x) < CELL * 0.5) {
        b.alive = false;
        hurt('a block struck the vessel');
      }
    }
    blocks = blocks.filter(b => b.alive || b.flash > 0);

    if (!blocks.some(b => b.alive) && !state.over) {
      state.wave++;
      state.score += 150;
      HELP.say('<b>WAVE ' + state.wave + '.</b> ' + waveBlurb(state.wave), 4.5);
      buildWave(state.wave);
    }
  } else {
    cabinetTick(dt);
    // the bay nearest the vessel gets the full caption
    let best = null, bd = 1e9;
    for (const b of blocks) {
      if (!b.alive || !b.label) continue;
      const d2 = Math.abs(b.x - ship.x) + Math.abs(b.y - ship.y) * 0.28;
      if (d2 < bd) { bd = d2; best = b; }
    }
    focusBlock = (bd < CELL * 3.2) ? best : null;
  }

  // ---- capsules ----
  for (let i = capsules.length - 1; i >= 0; i--) {
    const c = capsules[i];
    c.y += 70 * dt;
    if (c.y > viewH() + 20) { capsules.splice(i, 1); continue; }
    if (Math.hypot(c.x - ship.x, c.y - ship.y) < 26) {
      capsules.splice(i, 1);
      takeCapsule(ars);
      HELP.say('capsule taken — the bar advanced. Press <b>Shift</b> to spend it on the lit slot.', 3.4);
    }
  }

  // ---- sparks ----
  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i];
    p.life -= dt;
    if (p.life <= 0) { sparks.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
  }

  if (chainHold > 0) { chainHold -= dt; if (chainHold <= 0) $('chain').classList.remove('show'); }
  if (readoutHold > 0) { readoutHold -= dt; if (readoutHold <= 0) $('readout').classList.remove('show'); }
}

function waveBlurb(n) {
  if (n === 2) return 'The three principles join in: sulphur, salt and mercury.';
  if (n === 3) return 'The planets arrive. Copper rings, iron detonates, tin swells.';
  if (n === 5) return 'All seven metals now. Gold answers to nothing but gold.';
  if (n === 7) return 'The twelve operations. This is the whole art at once.';
  return 'They come faster.';
}

function hurt(why) {
  if (state.mode === 'cabinet') return;          // the cabinet cannot kill you
  if (ship.invuln > 0) return;
  state.lives--;
  ship.invuln = 1.6;
  state.shake = 12;
  HELP.say('<b>A vessel is lost</b> — ' + why + '. ' + state.lives + ' left.', 3);
  if (state.lives <= 0) finish();
}

function finish() {
  if (state.over) return;
  state.over = true; state.running = false;
  $('overTitle').textContent = 'THE VESSEL IS BROKEN';
  $('overSub').textContent = 'the work is interrupted, and the furnace keeps what it takes';
  $('overLine').textContent =
    'You reached wave ' + state.wave + ' with ' + state.score +
    ' points, and your longest single chain was ' + state.best + ' blocks.';
  $('overScreen').classList.add('show');
}

// ===================================================================
// Draw
// ===================================================================
function draw() {
  const w = viewW(), h = viewH();
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }

  // faint rule where the cabinet bays sit
  if (state.mode === 'cabinet') {
    ctx.strokeStyle = 'rgba(141,122,85,.16)';
    ctx.lineWidth = 1;
    for (const s of cabinetSeats) {
      ctx.strokeRect(ORIGIN_X + s.gx * CELL + 3, s.y - CELL / 2 - 3, CELL - 6, CELL + 6);
    }
  }

  // blocks
  for (const b of blocks) {
    if (!b.alive && b.flash <= 0) continue;
    const sc = b.scale || 1;
    const size = CELL * 0.82 * sc;
    const d = b.def;
    ctx.save();
    ctx.translate(b.x, b.y);

    const frozen = b.frozen > 0, burning = b.burning > 0, rotting = b.infected > 0;
    ctx.globalAlpha = b.alive ? 1 : Math.max(0, b.flash);

    ctx.fillStyle = d.color;
    ctx.globalAlpha *= burning ? 0.55 + Math.sin(state.t * 22) * 0.25 : (b.flash > 0 ? 0.95 : 0.8);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.globalAlpha = b.alive ? 1 : Math.max(0, b.flash);

    ctx.strokeStyle = frozen ? '#a8d8e8' : (rotting ? '#6b4a7a' : (b.armour ? PAL.gold : 'rgba(0,0,0,.55)'));
    ctx.lineWidth = b.armour ? 3 : 1.5;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    // the glyph itself, large and legible — the point of the game
    ctx.fillStyle = '#12100c';
    ctx.font = Math.round(size * 0.56) + 'px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(d.glyph, 0, 1);

    // damage pips
    if (b.maxHp > 1 && b.alive) {
      const frac = Math.max(0, b.hp) / b.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(-size / 2, size / 2 - 4, size, 4);
      ctx.fillStyle = frac > 0.5 ? '#8fd39a' : '#d97a2a';
      ctx.fillRect(-size / 2, size / 2 - 4, size * frac, 4);
    }
    ctx.restore();

    // Bay captions. The name is always there; the full description belongs only
    // to the bay the vessel is standing under, or every caption overlaps its
    // neighbours and the room becomes unreadable.
    if (b.label && b.alive) {
      const focused = (b === focusBlock);
      ctx.fillStyle = focused ? PAL.gold : 'rgba(240,230,210,.72)';
      ctx.font = (focused ? 'bold ' : '') + '9.5px "Courier New", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      // Only the short name fits a bay. "SAGITTARIUS · INCINERATIO" run at full
      // length collided with both its neighbours, so the long form is shown for
      // the focused bay alone, where there is room to spill.
      const shortName = d.name.split(' · ')[0];
      ctx.fillText(focused ? d.name : shortName, b.x, b.y + CELL * 0.5 + 5);
      if (focused) {
        ctx.fillStyle = 'rgba(245,197,24,.82)';
        wrapText(d.behaviour, b.x, b.y + CELL * 0.5 + 18, CELL * 2.6, 9, 3);
      }
    }
  }

  // capsules
  for (const c of capsules) {
    ctx.fillStyle = PAL.gold;
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(c.x, c.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#12100c';
    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('◆', c.x, c.y);
  }

  // shots
  for (const s of shots) {
    const g = GLYPHS[s.glyph];
    ctx.fillStyle = g ? g.color : PAL.ink;
    ctx.fillRect(s.x - 2.5, s.y - 9, 5, 14);
  }
  for (const h of hostiles) {
    ctx.fillStyle = '#d5dbe0';
    ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
  }

  // sparks
  for (const p of sparks) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;

  // the vessel
  ctx.save();
  ctx.translate(ship.x, ship.y);
  if (ship.invuln > 0 && Math.floor(state.t * 14) % 2) ctx.globalAlpha = 0.35;
  const am = GLYPHS[state.ammo];
  ctx.fillStyle = am ? am.color : PAL.cyan;
  ctx.beginPath();
  ctx.moveTo(0, -17); ctx.lineTo(14, 13); ctx.lineTo(0, 6); ctx.lineTo(-14, 13);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#12100c';
  ctx.font = '13px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(am ? am.glyph : '✦', 0, 2);
  ctx.restore();

  ctx.restore();
}

function wrapText(text, cx, y, maxW, size, maxLines) {
  ctx.font = size + 'px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const words = text.split(' ');
  let line = '', lines = [];
  for (const wd of words) {
    const t = line ? line + ' ' + wd : wd;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = wd; }
    else line = t;
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * (size + 1)));
}

// ===================================================================
// HUD
// ===================================================================
function buildAmmoBar() {
  const host = $('ammo');
  host.innerHTML = '';
  AMMUNITION.forEach((k, i) => {
    const g = GLYPHS[k];
    const d = document.createElement('div');
    d.className = 'a' + (k === state.ammo ? ' on' : '');
    d.innerHTML = '<div class="g" style="color:' + g.color + '">' + g.glyph + '</div>' +
                  '<div class="k">' + (i + 1) + ' · ' + g.name.split(' ')[0] + '</div>';
    d.addEventListener('click', () => setAmmo(k));
    host.appendChild(d);
  });
}
function setAmmo(k) {
  state.ammo = k;
  buildAmmoBar();
  const g = GLYPHS[k];
  HELP.say('loaded <b>' + g.glyph + ' ' + g.name + '</b> — ' + shotNote(k), 3.4);
}
function shotNote(k) {
  if (k === 'sol') return 'gold: the only thing that opens a Sun block.';
  if (k === 'luna') return 'silver: passes through a Moon block instead of being reflected.';
  if (k === 'water') return 'water: the only thing that unmakes a salt pillar.';
  if (k === 'mercurius') return 'quicksilver: splits what it strikes.';
  return 'it will react according to what it hits.';
}

function buildSpellBar() {
  const host = $('spells');
  host.innerHTML = '';
  for (const id of SPELL_ORDER) {
    const sp = SPELLS[id];
    const d = document.createElement('div');
    d.className = 's';
    d.id = 'spell-' + id;
    d.innerHTML = '<div class="g" style="color:' + sp.color + '">' + sp.glyph + '</div>' +
                  '<div class="n">' + sp.name + '</div>' +
                  '<div class="c">' + sp.key + ' · ' + sp.cost + '</div>';
    d.addEventListener('click', () => doCast(id));
    host.appendChild(d);
  }
}

function buildPowerBar() {
  const host = $('bar');
  host.innerHTML = '';
  POWER_SLOTS.forEach((s, i) => {
    const d = document.createElement('div');
    const owned = ars.owned[s.id] || 0;
    d.className = 'slot' + (i === ars.cursor ? ' lit' : '') + (owned ? ' owned' : '');
    d.innerHTML = '<span class="g">' + s.glyph + '</span>' + s.name +
                  (owned ? '<small>×' + owned + '</small>' : '<small>&nbsp;</small>');
    host.appendChild(d);
  });
  const hint = document.createElement('div');
  hint.className = 'hint';
  hint.innerHTML = ars.cursor >= 0
    ? '<b style="color:#f5c518">Shift</b> takes ' + POWER_SLOTS[ars.cursor].name
    : 'break blocks for capsules ◆';
  host.appendChild(hint);
}

function syncHUD() {
  $('score').textContent = state.score;
  $('lives').textContent = state.mode === 'cabinet' ? '∞' : state.lives;
  $('wave').textContent = state.mode === 'cabinet' ? '—' : state.wave;
  $('waveLbl').textContent = state.mode === 'cabinet' ? 'THE CABINET' : 'WAVE';
  $('best').textContent = state.best;
  $('azoth').querySelector('i').style.width = (ars.azoth / AZOTH_MAX * 100) + '%';
  $('azothN').textContent = Math.floor(ars.azoth);
  for (const id of SPELL_ORDER) {
    const e = $('spell-' + id);
    if (!e) continue;
    const ok = ars.azoth >= SPELLS[id].cost;
    e.classList.toggle('ready', ok);
    e.classList.toggle('poor', !ok);
  }
  buildPowerBar();
}

function doCast(id) {
  const r = castSpell(ars, id, { blocks: blocks });
  HELP.say(r.ok ? '<b>' + r.text + '</b>' : r.text, 4);
  if (r.ok && r.shake) state.shake = r.shake;
  syncHUD();
}

// ===================================================================
// The glyph cabinet reference sheet
// ===================================================================
function buildCabinetSheet() {
  const host = $('cabinetBody');
  let html = '';
  for (const reg of ['element', 'principle', 'planet', 'operation']) {
    html += '<h3>' + REGISTERS[reg].name + ' — ' + REGISTERS[reg].blurb + '</h3><div class="glyphgrid">';
    for (const k of TUTORIAL_ORDER) {
      const g = GLYPHS[k];
      if (g.register !== reg) continue;
      html += '<div class="gcard"><div class="g" style="color:' + g.color + '">' + g.glyph +
              '</div><div class="n">' + g.name + '</div><div class="p">' + g.behaviour +
              '</div><div class="p" style="opacity:.55">' + g.doctrine + '</div></div>';
    }
    html += '</div>';
  }
  host.innerHTML = html;
}

// ===================================================================
// Input
// ===================================================================
window.addEventListener('keydown', function (e) {
  const isSpace = e.code === 'Space' || e.key === ' ';
  const k = isSpace ? ' ' : (e.key || '').toLowerCase();

  if ($('startScreen').classList.contains('show')) {
    if (isSpace || k === 'enter') { startCabinet(); e.preventDefault(); }
    return;
  }
  if ($('overScreen').classList.contains('show')) {
    if (isSpace || k === 'enter') { startWaves(); e.preventDefault(); }
    return;
  }
  if (k === 'tab') {
    e.preventDefault();
    $('cabinetScreen').classList.toggle('show');
    return;
  }
  if (k === 'escape') { $('cabinetScreen').classList.remove('show'); return; }
  if (HELP.isManualOpen && HELP.isManualOpen()) return;

  keys[k] = true;
  if (isSpace) e.preventDefault();

  const n = parseInt(k, 10);
  if (n >= 1 && n <= AMMUNITION.length) { setAmmo(AMMUNITION[n - 1]); return; }
  if (k === 'q' || k === 'e') {
    const i = AMMUNITION.indexOf(state.ammo);
    setAmmo(AMMUNITION[(i + (k === 'e' ? 1 : AMMUNITION.length - 1)) % AMMUNITION.length]);
    return;
  }
  if (k === 'z') { doCast('solve'); return; }
  if (k === 'x') { doCast('coagula'); return; }
  if (k === 'c') { doCast('projectio'); return; }
  if (k === 'shift') {
    const r = spendBar(ars);
    HELP.say(r.ok ? '<b>' + r.text + '</b>' : r.text, 4.2);
    syncHUD();
    return;
  }
  if (k === 'p') { state.paused = !state.paused; HELP.say(state.paused ? 'paused' : 'resumed', 1.6); }
  if (['arrowleft','arrowright','arrowup','arrowdown'].indexOf(k) >= 0) e.preventDefault();
});

window.addEventListener('keyup', function (e) {
  const isSpace = e.code === 'Space' || e.key === ' ';
  keys[isSpace ? ' ' : (e.key || '').toLowerCase()] = false;
});

canvas.addEventListener('touchmove', (e) => {
  const t = e.touches[0];
  ship.x = t.clientX;
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchstart', (e) => { keys[' '] = true; e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchend', () => { keys[' '] = false; });

// ===================================================================
// Lifecycle
// ===================================================================
function startCabinet() {
  $('startScreen').classList.remove('show');
  $('overScreen').classList.remove('show');
  state.mode = 'cabinet'; state.over = false; state.running = true;
  state.score = 0; state.best = 0; state.wave = 0;
  buildCabinet(); buildAmmoBar(); syncHUD();
  HELP.say('<b>THE CABINET.</b> Nothing here can hurt you. Shoot anything — the panel above ' +
           'tells you what it is and why it did that. Change matter with <b>1–7</b>; that is ' +
           'what decides the reaction.', 8);
}

function startWaves() {
  $('startScreen').classList.remove('show');
  $('overScreen').classList.remove('show');
  state.mode = 'waves'; state.over = false; state.running = true;
  state.score = 0; state.lives = 3; state.wave = 1; state.best = 0;
  ars = makeArsenal();
  ship.x = viewW() / 2; ship.invuln = 1.5;
  buildWave(1); buildAmmoBar(); syncHUD();
  HELP.say('<b>WAVE 1.</b> The four elements. Break blocks for capsules ◆, then press ' +
           '<b>Shift</b> to spend the bar.', 6);
}

$('startCabinet').addEventListener('click', function () { startCabinet(); this.blur(); });
$('startWaves').addEventListener('click', function () { startWaves(); this.blur(); });
$('againBtn').addEventListener('click', function () { startWaves(); this.blur(); });
$('backCabinet').addEventListener('click', function () { startCabinet(); this.blur(); });
$('cabinetClose').addEventListener('click', function () { $('cabinetScreen').classList.remove('show'); this.blur(); });

// ===================================================================
// Loop — one of them, dt clamped at both ends
// ===================================================================
let last = 0, loopRunning = false;
function frame(now) {
  const dt = Math.max(0, Math.min(0.045, (now - last) / 1000 || 0));
  last = now;

  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w !== canvas._lw || h !== canvas._lh) { canvas._lw = w; canvas._lh = h; layout(); }

  if (state.running && !state.paused && !state.over && !(HELP.isManualOpen && HELP.isManualOpen())) {
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
buildAmmoBar();
buildSpellBar();
buildCabinetSheet();
syncHUD();
window.addEventListener('resize', layout);

HELP.install({
  id: 'invaders',
  title: 'ALCHEMY BLOCK INVADERS',
  subtitle: 'twenty-six glyphs, and every one of them does something different',
  premise: 'Every block is one of the twenty-six glyphs of the art. None of them is a reskin: ' +
    'each behaves the way its own symbolism says it should. Tin is the metal of Jupiter and Jupiter ' +
    'is the principle of expansion, so the Jupiter block SWELLS when shot and shoves its neighbours ' +
    'aside. Gold is incorruptible, so nothing marks a Sun block but gold. Quicksilver is the volatile ' +
    'spirit, so Mercury flees rather than dying — you must freeze it with COAGULA first.',
  goal: 'Survive the waves, and build chains. Shots set off blocks and blocks set off each other, so ' +
    'the real scoring is not in what you shoot but in what that shot starts. A copper bell rings ' +
    'everything within three cells; each of those does its own thing; theirs do too. Chains of forty ' +
    'are ordinary once you can read the board.',
  controls: [
    ['← →', 'move'],
    ['Space', 'fire'],
    ['1 – 7', 'load matter'],
    ['Q  E', 'cycle matter'],
    ['Z', 'SOLVE'],
    ['X', 'COAGULA'],
    ['C', 'PROJECTIO'],
    ['Shift', 'TAKE POWER-UP'],
    ['Tab', 'glyph cabinet'],
    ['P', 'pause']
  ],
  stripNote: '<b>Power-ups:</b> break blocks → collect ◆ capsules → the bar at the bottom advances → ' +
             'press <b>Shift</b> to spend it on the lit slot. That is the whole system.',
  opening: 'Press <b>H</b> at any time for the full manual. <b>J</b> hides this panel.',
  systems: [
    { title: 'THE SHOT DECIDES THE REACTION',
      body: '<p>You carry seven kinds of matter and the one you have loaded decides what happens. ' +
            'The same block gives a different result to each. Three cases matter most:</p>' +
            '<div class="note"><b>Gold (☉ SOL, key 5)</b> is the only thing that opens a Sun block — ' +
            'everything else is absorbed.<br><b>Silver (☽ LUNA, key 6)</b> passes through a Moon block; ' +
            'anything else is reflected straight back at you.<br><b>Water (🜄, key 2)</b> is the only ' +
            'thing that unmakes a salt pillar — shooting salt with anything else makes MORE salt.</div>' },
    { title: 'HOW TO FIRE OFF A POWER-UP',
      body: '<p>This is the Gradius system and it catches everyone, so plainly:</p>' +
            '<div class="note"><b>1.</b> Break blocks. Some drop a gold ◆ capsule.<br>' +
            '<b>2.</b> Fly into the capsule. The bar along the bottom advances one slot — ' +
            'the lit slot is what you would get.<br>' +
            '<b>3.</b> Press <b>Shift</b> to actually take it. Nothing happens until you do.<br>' +
            '<b>4.</b> Collect another capsule to move further along the bar for a better power.</div>' +
            '<p>The same gesture works in Salamandra, deliberately.</p>' },
    { title: 'THE THREE OPERATIONS',
      body: '<p>Spells cost azoth, which refills on its own. The bar and the three buttons are at the ' +
            'bottom left.</p>',
      table: { head: ['key', 'operation', 'what it does', 'when'],
        rows: [
          ['Z', '🜄 SOLVE', 'dissolves all armour; unmakes every salt pillar', 'the board has crystallised and nothing is breaking'],
          ['X', '🜔 COAGULA', 'freezes every block for six seconds', 'you need to kill a Mercury, which otherwise teleports away'],
          ['C', '☉ PROJECTIO', 'turns the lowest row to gold', 'you have SOL loaded — otherwise you have built a wall']
        ] } },
    { title: 'THE TWENTY-SIX BLOCKS',
      body: '<p>Press <b>Tab</b> at any time in game for the full cabinet. The short version: ' +
            'elements are the simple behaviours, principles are sulphur/salt/mercury (spread, grow, ' +
            'flee), planets are the metals (copper rings, iron detonates, tin swells, lead deadens, ' +
            'silver reflects, quicksilver splits, gold refuses), and the twelve zodiacal operations ' +
            'are each a verb of the Great Work.</p>' }
  ]
});

requestAnimationFrame(function (t) { last = t; requestAnimationFrame(frame); });

// exposed for headless verification — getters, because these are reassigned
window.ABI = {
  get state(){ return state; }, get blocks(){ return blocks; }, get shots(){ return shots; },
  get ars(){ return ars; }, get ship(){ return ship; }, get keys(){ return keys; },
  GLYPHS: GLYPHS, strike: strike, frame: frame, startCabinet: startCabinet,
  startWaves: startWaves, doCast: doCast, makeBlock: makeBlock, setAmmo: setAmmo,
  get cfg(){ return cfg; }
};
