// ===================================================================
// NOVA HEAT - Fruit of Life
// A sacred-geometry invaders game. You build Metatron's Cube; the
// Nova Mob walks in from the margin to take it apart.
// ===================================================================
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ---------- palette (from the reference plate: cream paper, ink, 4 flats) ----------
const PAL = {
  paper:  '#f4f1e4',
  scorch: '#dd9a3a',
  char:   '#1b0a05',
  ink:    '#2f3437',
  inkHot: '#ffd79a',
  red:    '#e8402a',
  cyan:   '#29a8e0',
  yellow: '#f5c518',
  brown:  '#6b4423'
};
const SPHERE_COLORS = [PAL.red, PAL.cyan, PAL.yellow, PAL.brown];

// ---------- tuning ----------
const CFG = {
  breathPeriod:   7.0,    // seconds per full inhale/exhale
  peakWindow:     0.15,   // fraction of the cycle counting as the inhale peak
  pranaMax:       100,
  pranaBase:      5.5,    // prana/sec at empty lungs
  pranaBreath:    15.0,   // extra prana/sec, scaled by breath fullness
  placeCost:      16,
  placeCostPeak:  9,
  chargePeak:     1.35,
  decayBase:      0.060,  // charge lost per second
  decayPerBreath: 0.015,
  beamDPS:        30,
  beamWidth:      7,
  cutupCost:      40,
  cutupCooldown:  3.0,
  cutupDamage:    26,
  heatMax:        100,
  heatPerBurn:    4.2,
  heatDark:       1.8,    // heat/sec while zero circles are lit
  coolThreshold:  7,      // circles lit needed to cool the page
  coolRate:       0.85,
  severTime:      6.0
};

// ---------- geometry: the Fruit of Life ----------
// 13 tangent circles: centre, six at distance U, six at distance 2U.
// Metatron's Cube = a line between every pair of those centres = 78 lines.
const NODE_NAMES = [
  'THE SEED',
  'DAY I', 'DAY II', 'DAY III', 'DAY IV', 'DAY V', 'DAY VI',
  'FRUIT I', 'FRUIT II', 'FRUIT III', 'FRUIT IV', 'FRUIT V', 'FRUIT VI'
];

function buildNodes() {
  const list = [{ ux: 0, uy: 0, ring: 0 }];
  for (let ring = 1; ring <= 2; ring++) {
    for (let i = 0; i < 6; i++) {
      const a = (-90 + i * 60) * Math.PI / 180;
      list.push({ ux: Math.cos(a) * ring, uy: Math.sin(a) * ring, ring: ring });
    }
  }
  return list.map(function (n, i) {
    return {
      ux: n.ux, uy: n.uy, ring: n.ring, i: i,
      name: NODE_NAMES[i],
      color: i === 0 ? PAL.ink : SPHERE_COLORS[(i + n.ring) % 4],
      x: 0, y: 0, charge: 0, flash: 0
    };
  });
}

function buildEdges(list) {
  const e = [];
  for (let a = 0; a < list.length; a++) {
    for (let b = a + 1; b < list.length; b++) e.push({ a: a, b: b, sever: 0, heat: 0 });
  }
  return e;
}

const nodes = buildNodes();        // 13
const edges = buildEdges(nodes);   // 78

let cx = 0, cy = 0, U = 100, nodeR = 50;

let lastW = -1, lastH = -1;

function layout() {
  // A canvas in a hidden tab/pane reports 0x0; falling through to that would
  // collapse the whole board to a point (U = 0, nothing moves). Guard it.
  const w = canvas.clientWidth  || window.innerWidth  || 900;
  const h = canvas.clientHeight || window.innerHeight || 600;
  lastW = canvas.clientWidth;
  lastH = canvas.clientHeight;
  canvas.width  = Math.floor(w * devicePixelRatio);
  canvas.height = Math.floor(h * devicePixelRatio);
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  cx = w / 2;
  cy = h / 2 + h * 0.035;
  // the figure spans 5U across (2U to the outer ring, plus a nodeR each side),
  // so size it against that rather than a magic fraction
  U  = Math.min(w * 0.96, h * 0.80) / 5.2;
  nodeR = U * 0.5;
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].x = cx + nodes[i].ux * U;
    nodes[i].y = cy + nodes[i].uy * U;
  }
}

// ---------- the Nova Mob ----------
const SPRITES = {
  crab: [
    '..X.....X..',
    '...X...X...',
    '..XXXXXXX..',
    '.XX.XXX.XX.',
    'XXXXXXXXXXX',
    'X.XXXXXXX.X',
    'X.X.....X.X',
    '...XX.XX...'
  ],
  kid: [
    '...XX...',
    '..XXXX..',
    '.XXXXXX.',
    'XX.XX.XX',
    'XXXXXXXX',
    '..X..X..',
    '.X.XX.X.',
    'X.X..X.X'
  ],
  metal: [
    '....XXXX....',
    '.XXXXXXXXXX.',
    'XXXXXXXXXXXX',
    'XXX..XX..XXX',
    'XXXXXXXXXXXX',
    '..XXX..XXX..',
    '.XX.XXXX.XX.',
    'XX........XX'
  ],
  butcher: [
    '.X......X.',
    '..X....X..',
    '.XXXXXXXX.',
    'XX.XXXX.XX',
    'XXXXXXXXXX',
    'X.XXXXXX.X',
    'X.X....X.X',
    '..XX..XX..'
  ],
  boss: [
    '..XX........XX..',
    '...XX......XX...',
    '..XXXXXXXXXXXX..',
    '.XXX.XXXXXX.XXX.',
    'XXXXXXXXXXXXXXXX',
    'XXX.XXXXXXXX.XXX',
    'XXX.X......X.XXX',
    '.....XX..XX.....'
  ]
};

const MOB = {
  crab:    { name: 'Crab',                sprite: 'crab',    hp: 30,  speed: 0.40, drain: 0.55, color: PAL.red,    scale: 0.85, score: 40 },
  kid:     { name: 'The Subliminal Kid',  sprite: 'kid',     hp: 20,  speed: 0.62, drain: 0.95, color: PAL.cyan,   scale: 0.72, score: 70 },
  metal:   { name: 'The Heavy Metal Kid', sprite: 'metal',   hp: 105, speed: 0.20, drain: 0.45, color: PAL.brown,  scale: 1.05, score: 110 },
  butcher: { name: 'Sammy the Butcher',   sprite: 'butcher', hp: 46,  speed: 0.38, drain: 0.30, color: PAL.yellow, scale: 0.88, score: 90 },
  boss:    { name: 'Mr Bradly Mr Martin', sprite: 'boss',    hp: 480, speed: 0.16, drain: 1.10, color: PAL.ink,    scale: 1.50, score: 600 }
};

// ---------- codex ----------
const CODEX = {
  seed: { title: 'THE FIRST SPHERE', src: 'Geometry',
    body: 'A single circle. Draw a second whose edge passes through the first centre and the overlap is the <i>vesica piscis</i>, the almond: width to height, 1 to root 3. Every figure on this page grows out of one repeated act, putting the compass point on the rim and swinging again.' },
  line: { title: 'THE LIT LINE', src: 'Mechanic',
    body: 'Two charged circles light the line between them, and it burns at the strength of the <i>weaker</i> of the two. A hot circle paired with a guttering one gives you a flicker, not a beam. Feed pairs, not favourites.' },
  breath: { title: 'THE BREATH', src: 'Practice',
    body: 'Prana returns fastest at the top of the inhale. Place inside that window and the sphere costs nine instead of sixteen and arrives at 135 per cent. The meditative instruction and the arcade instruction turn out to be the same instruction: do it on the beat.' },
  seedOfLife: { title: 'THE SEED OF LIFE', src: 'Geometry',
    body: 'Seven circles, one centre and six around it, each passing through the others centres. The modern esoteric reading makes these the six days of creation with a seventh for rest, a Genesis gloss laid over a pattern that is simply what happens when you pack equal circles as tightly as they will go.' },
  fruit: { title: 'THE FRUIT OF LIFE', src: 'Geometry',
    body: 'Thirteen circles, mutually tangent, lifted out of the Flower of Life by keeping only certain centres. This board <i>is</i> the Fruit of Life: the centre, an inner ring of six, an outer ring of six.' },
  metatron: { title: 'METATRON&rsquo;S CUBE', src: 'Geometry',
    body: 'Join all thirteen centres to each other and you draw 13 x 12 / 2 = <b>78 lines</b>. That is the figure under your spheres, and the flat projections of all five Platonic solids can be traced inside it. The name attaches it to the archangel Metatron, but the drawing as we have it is a twentieth-century assembly, not a medieval one.' },
  merkaba: { title: 'MER-KA-BA', src: 'Drunvalo Melchizedek',
    body: 'Two interlocked tetrahedra counter-rotating about a shared centre. Melchizedek splits the word three ways, <i>Mer</i> light, <i>Ka</i> spirit, <i>Ba</i> body, and treats the spinning field as a vehicle. Here it is what the completed figure does when all thirteen circles are lit at once, and it is built <i>out of</i> the figure: the wheel clears the page, dumps the heat, and leaves every circle dark behind it. You buy the turn with the whole work.' },
  cutup: { title: 'THE CUT-UP', src: 'Burroughs',
    body: 'The Mob works by control, by keeping the tape running in order. The counter-move worked out across <i>Nova Express</i> and <i>The Ticket That Exploded</i> is to take scissors to the tape: cut it, shuffle it, play it back scrambled. Here it throws the Mob out of position and re-splices every line Sammy has cut.' },
  novaheat: { title: 'NOVA HEAT', src: 'Burroughs',
    body: 'Not damage. <i>Pressure.</i> Nova heat is what rises when the Mob operates unopposed, and on this page it is literal, because the page is paper. Cream, then scorch, then char. Hold seven circles and it cools. Hold none and it climbs.' },
  crab: { title: 'CRAB', src: 'Nova Mob',
    body: 'The rank and file, straight off the cabinet. Walks to a circle, drains it, walks on. Dies to any honest line.' },
  kid: { title: 'THE SUBLIMINAL KID', src: 'Nova Mob',
    body: 'Fast, and it <b>flickers</b>: while flickering, no beam touches it. Burroughs&rsquo; Kid worked by cutting images in below the threshold of notice. Thin defences never see it coming.' },
  metal: { title: 'THE HEAVY METAL KID', src: 'Nova Mob',
    body: 'Slow and enormously durable. Its job is not to reach the centre. Its job is to stand in your beam and soak it while everything behind it walks through.' },
  butcher: { title: 'SAMMY THE BUTCHER', src: 'Nova Mob',
    body: 'Ignores your spheres and goes for the <b>lines</b>. Each line it crosses is severed for six seconds and does it no harm. It dismantles the figure instead of draining it. Cut-Up puts the lines back.' },
  boss: { title: 'MR BRADLY MR MARTIN', src: 'Nova Mob',
    body: 'The doubled name is the mechanic: kill it once and it is still two. Enormous, slow, and it drains a circle almost instantly. Have the figure standing before it arrives.' }
};
const CODEX_ORDER = ['seed', 'line', 'breath', 'seedOfLife', 'fruit', 'metatron', 'merkaba',
                     'cutup', 'novaheat', 'crab', 'kid', 'metal', 'butcher', 'boss'];

// ---------- state ----------
const state = {
  running: false, paused: false, over: false,
  t: 0, score: 0, breath: 1,
  prana: CFG.pranaMax, heat: 0,
  breathT: 0,
  sel: 0,
  cutupCD: 0,
  merkabaAnim: 0, merkabaUsed: false, merkabaCount: 0,
  spawnQueue: [], spawnTimer: 0, betweenBreaths: 0,
  shake: 0, denied: 0,
  discovered: {}, banner: null
};

let invaders = [];
let particles = [];

// ---------- helpers ----------
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rand(a, b) { return a + Math.random() * (b - a); }

function hexToRgb(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function mixColor(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  t = clamp(t, 0, 1);
  return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' +
                  Math.round(A[1] + (B[1] - A[1]) * t) + ',' +
                  Math.round(A[2] + (B[2] - A[2]) * t) + ')';
}
function mixArr(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  t = clamp(t, 0, 1);
  return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
}
function toCss(c) {
  return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')';
}
function lumArr(c) { return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }

// As the page scorches, some sprite colours (brown, ink) land on top of the
// background luminance and vanish. Push those away from the page, keeping hue.
function legibleArr(hex, bgL) {
  const c = hexToRgb(hex);
  const d = Math.abs(lumArr(c) - bgL);
  if (d >= 0.20) return c;
  const t = (0.20 - d) / 0.20 * 0.8;
  return mixArr(hex, bgL > 0.5 ? '#140803' : '#fff3dd', t);
}
function legible(hex, bgL) { return toCss(legibleArr(hex, bgL)); }
function rgbaArr(c, a) {
  return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')';
}

function rgba(hex, a) {
  const c = hexToRgb(hex);
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
}

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = clamp(t, 0, 1);
  const qx = ax + dx * t, qy = ay + dy * t;
  return Math.hypot(px - qx, py - qy);
}

// ---------- breath ----------
function breathPhase() { return (state.breathT % CFG.breathPeriod) / CFG.breathPeriod; }
function breathFullness() { return 0.5 - 0.5 * Math.cos(breathPhase() * Math.PI * 2); }
function inPeak() {
  const p = breathPhase();
  return p > 0.5 - CFG.peakWindow / 2 && p < 0.5 + CFG.peakWindow / 2;
}

// ---------- codex plumbing ----------
function discover(key) {
  if (state.discovered[key] || !CODEX[key]) return;
  state.discovered[key] = true;
  document.getElementById('codexCount').textContent = Object.keys(state.discovered).length;
  banner('CODEX', CODEX[key].title, 2.4);
}
function banner(text, sub, dur) {
  state.banner = { text: text, sub: sub || '', t: dur || 2.0, max: dur || 2.0 };
}

// ---------- particles ----------
function burst(x, y, color, n, spread) {
  spread = spread || 1;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rand(40, 190) * spread;
    particles.push({
      x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      life: rand(0.3, 0.85), max: 0.85, color: color, size: rand(2, 5)
    });
  }
}

// ---------- placing spheres ----------
function litCount() {
  let n = 0;
  for (let i = 0; i < nodes.length; i++) if (nodes[i].charge > 0) n++;
  return n;
}

function placeSphere(i) {
  if (!state.running || state.paused || state.over) return;
  const n = nodes[i];
  const peak = inPeak();
  const cost = peak ? CFG.placeCostPeak : CFG.placeCost;
  if (state.prana < cost) { state.denied = 0.4; return; }
  state.prana -= cost;
  n.charge = Math.max(n.charge, peak ? CFG.chargePeak : 1);
  n.flash = 1;
  burst(n.x, n.y, n.color, peak ? 20 : 10, peak ? 1.3 : 1);
  discover('seed');
  if (peak) discover('breath');
  checkFigures();
}

function checkFigures() {
  const lit = litCount();
  if (lit >= 2) discover('line');
  if (lit >= 4) discover('metatron');
  if (lit >= 10) discover('fruit');
  if (seedOfLifeLit()) discover('seedOfLife');
  if (lit === 13 && !state.merkabaUsed) triggerMerkaba();
}

// centre + inner ring = the Seed of Life. Holding it cools the page extra.
function seedOfLifeLit() {
  for (let i = 0; i <= 6; i++) if (nodes[i].charge <= 0) return false;
  return true;
}

function triggerMerkaba() {
  state.merkabaUsed = true;
  state.merkabaAnim = 1.4;
  state.merkabaCount++;
  state.heat = Math.max(0, state.heat - 26);
  state.prana = Math.min(CFG.pranaMax, state.prana + 45);
  const bonus = 800 + 400 * state.breath;
  state.score += bonus;
  for (let i = 0; i < invaders.length; i++) {
    burst(invaders[i].x, invaders[i].y, invaders[i].def.color, 14);
    state.score += invaders[i].def.score;
  }
  invaders = [];
  for (let i = 0; i < edges.length; i++) edges[i].sever = 0;
  // The vehicle is built out of the figure: completing it SPENDS it.
  // Every circle goes dark, and you rebuild from nothing while the page reheats.
  for (let i = 0; i < nodes.length; i++) { nodes[i].charge = 0; nodes[i].flash = 1; }
  discover('merkaba');
  banner('MER-KA-BA', 'the figure is spent', 2.6);
}

// ---------- cut-up ----------
function cutUp() {
  if (!state.running || state.paused || state.over) return;
  if (state.cutupCD > 0 || state.prana < CFG.cutupCost) { state.denied = 0.4; return; }
  state.prana -= CFG.cutupCost;
  state.cutupCD = CFG.cutupCooldown;
  for (let i = 0; i < edges.length; i++) edges[i].sever = 0;
  const spots = invaders.map(function (v) { return { x: v.x, y: v.y }; });
  for (let i = spots.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = spots[i]; spots[i] = spots[j]; spots[j] = tmp;
  }
  for (let i = 0; i < invaders.length; i++) {
    const v = invaders[i];
    burst(v.x, v.y, v.def.color, 6);
    v.x = spots[i].x + rand(-30, 30);
    v.y = spots[i].y + rand(-30, 30);
    damage(v, CFG.cutupDamage);
  }
  discover('cutup');
  banner('CUT-UP', 'the tape is scrambled', 1.6);
}

// ---------- invaders ----------
function spriteMetrics(def) {
  const rows = SPRITES[def.sprite];
  const px = U * 0.040 * def.scale;
  return { rows: rows, px: px, w: rows[0].length * px, h: rows.length * px };
}

function spawnInvader(type, x, y, gen) {
  const def = MOB[type];
  if (x === undefined) {
    const a = Math.random() * Math.PI * 2;
    const d = 2.8 * U + rand(20, 70);
    x = cx + Math.cos(a) * d;
    y = cy + Math.sin(a) * d;
  }
  const m = spriteMetrics(def);
  const hp = def.hp * (gen ? 0.4 : 1);
  invaders.push({
    type: type, def: def, gen: gen || 0,
    x: x, y: y, hp: hp, maxHp: hp,
    target: pickTarget(x, y),
    r: m.w * 0.42 * (gen ? 0.75 : 1),
    scale: gen ? 0.75 : 1,
    t: Math.random() * 10, alpha: 0, flick: false,
    cuts: type === 'butcher' ? 2 : 0,
    hit: 0
  });
  discover(type);
}

function pickTarget(x, y) {
  const lit = [];
  for (let i = 0; i < nodes.length; i++) if (nodes[i].charge > 0) lit.push(nodes[i]);
  if (lit.length === 0) return 0;
  let best = lit[0], bd = Infinity;
  for (let i = 0; i < lit.length; i++) {
    const d = Math.hypot(lit[i].x - x, lit[i].y - y) * rand(0.75, 1.3);
    if (d < bd) { bd = d; best = lit[i]; }
  }
  return best.i;
}

function damage(inv, amount) {
  inv.hp -= amount;
  inv.hit = 0.12;
  if (inv.hp <= 0) killInvader(inv);
}

function killInvader(inv) {
  if (inv.dead) return;
  inv.dead = true;
  state.score += inv.def.score;
  burst(inv.x, inv.y, inv.def.color, 16, 1.2);
  if (inv.type === 'boss' && inv.gen === 0) {
    spawnInvader('boss', inv.x - 40, inv.y, 1);
    spawnInvader('boss', inv.x + 40, inv.y, 1);
    banner('MR BRADLY MR MARTIN', 'the name was always two', 2.2);
  }
}

function burnPage(inv) {
  inv.dead = true;
  state.heat = Math.min(CFG.heatMax, state.heat + CFG.heatPerBurn);
  state.shake = 0.35;
  burst(inv.x, inv.y, PAL.red, 26, 1.5);
  discover('novaheat');
}

// ---------- breaths (waves) ----------
function buildQueue(n) {
  const q = [];
  const total = 5 + Math.floor(n * 2.2);
  for (let i = 0; i < total; i++) {
    const r = Math.random();
    let t = 'crab';
    if (n >= 2 && r < 0.22) t = 'kid';
    else if (n >= 3 && r < 0.40) t = 'butcher';
    else if (n >= 4 && r < 0.55) t = 'metal';
    q.push(t);
  }
  if (n % 4 === 0) q.push('boss');
  return q;
}

function startBreath(n) {
  state.breath = n;
  state.merkabaUsed = false;
  state.spawnQueue = buildQueue(n);
  state.spawnTimer = 1.6;
  state.betweenBreaths = 0;
  banner('BREATH ' + n, n % 4 === 0 ? 'something doubled is coming' : '', 2.2);
}

// ---------- update ----------
function update(dt) {
  state.t += dt;
  state.breathT += dt;
  state.shake = Math.max(0, state.shake - dt * 1.6);
  state.denied = Math.max(0, state.denied - dt * 2);
  state.cutupCD = Math.max(0, state.cutupCD - dt);
  state.merkabaAnim = Math.max(0, state.merkabaAnim - dt);
  if (state.banner) { state.banner.t -= dt; if (state.banner.t <= 0) state.banner = null; }

  // prana on the breath
  state.prana = Math.min(CFG.pranaMax,
    state.prana + (CFG.pranaBase + CFG.pranaBreath * breathFullness()) * dt);

  // charge decay
  const decay = CFG.decayBase + CFG.decayPerBreath * (state.breath - 1);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.charge > 0) n.charge = Math.max(0, n.charge - decay * dt);
    n.flash = Math.max(0, n.flash - dt * 2.4);
  }

  // edges cool / un-sever
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    if (e.sever > 0) e.sever = Math.max(0, e.sever - dt);
    e.heat = Math.max(0, e.heat - dt * 3);
  }

  // spawning
  if (state.spawnQueue.length > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnInvader(state.spawnQueue.shift());
      state.spawnTimer = Math.max(0.45, 1.6 - state.breath * 0.09) * rand(0.7, 1.3);
    }
  } else if (invaders.length === 0) {
    state.betweenBreaths += dt;
    if (state.betweenBreaths > 2.2) {
      state.score += 200 * state.breath;
      startBreath(state.breath + 1);
    }
  }

  // invaders
  for (let i = 0; i < invaders.length; i++) {
    const v = invaders[i];
    v.t += dt;
    v.alpha = Math.min(1, v.alpha + dt * 1.6);
    v.hit = Math.max(0, v.hit - dt);
    v.flick = v.type === 'kid' && Math.sin(v.t * 9) > 0.15;

    const target = nodes[v.target];
    const dx = target.x - v.x, dy = target.y - v.y;
    const d = Math.hypot(dx, dy);
    const speed = v.def.speed * U * (v.gen ? 1.25 : 1) * (1 + 0.035 * (state.breath - 1));

    if (d > nodeR * 0.5) {
      v.x += (dx / d) * speed * dt;
      v.y += (dy / d) * speed * dt;
    } else {
      if (target.charge > 0) {
        target.charge = Math.max(0, target.charge - v.def.drain * dt);
        target.flash = Math.max(target.flash, 0.5);
        if (Math.random() < dt * 8) burst(v.x, v.y, target.color, 1, 0.4);
      } else if (target.i === 0) {
        burnPage(v);
      } else {
        v.target = pickTarget(v.x, v.y);
        if (nodes[v.target].charge <= 0) v.target = 0;
      }
    }
  }

  // lit lines burn
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    if (e.sever > 0) continue;
    const A = nodes[e.a], B = nodes[e.b];
    if (A.charge <= 0 || B.charge <= 0) continue;
    const s = Math.min(A.charge, B.charge);
    const w = CFG.beamWidth + 6 * s;
    for (let k = 0; k < invaders.length; k++) {
      const v = invaders[k];
      if (v.dead) continue;
      if (distToSeg(v.x, v.y, A.x, A.y, B.x, B.y) > w + v.r * 0.55) continue;
      if (v.flick) continue;
      if (v.type === 'butcher' && v.cuts > 0) {
        e.sever = CFG.severTime;
        v.cuts--;
        burst((A.x + B.x) / 2, (B.y + A.y) / 2, PAL.yellow, 8);
        break;
      }
      damage(v, CFG.beamDPS * s * dt);
      e.heat = 1;
    }
  }

  invaders = invaders.filter(function (v) { return !v.dead; });

  // nova heat
  const lit = litCount();
  if (lit === 0) state.heat += CFG.heatDark * dt;
  else if (lit >= CFG.coolThreshold) state.heat -= CFG.coolRate * dt;
  if (seedOfLifeLit()) state.heat -= 0.5 * dt;   // the seven held is its own cooling
  state.heat = clamp(state.heat, 0, CFG.heatMax);
  if (state.heat >= CFG.heatMax) endGame();

  checkFigures();

  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.94; p.vy *= 0.94;
  }
}

// ---------- drawing ----------
function drawSprite(rows, x, y, px, color, alpha) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const w = rows[0].length, h = rows.length;
  const ox = x - w * px / 2, oy = y - h * px / 2;
  const s = Math.ceil(px);
  for (let r = 0; r < h; r++) {
    const row = rows[r];
    for (let c = 0; c < w; c++) {
      if (row[c] === 'X') ctx.fillRect(Math.round(ox + c * px), Math.round(oy + r * px), s, s);
    }
  }
  ctx.globalAlpha = 1;
}

function drawTriangle(x, y, r, a) {
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const t = a + i * Math.PI * 2 / 3;
    const px = x + Math.cos(t) * r, py = y + Math.sin(t) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

// Flower of Life watermark: circles of radius R on a hex lattice of spacing R.
function drawWatermark(fg) {
  const R = U * 0.5, sp = R;
  const limit = U * 2.62;
  ctx.strokeStyle = rgba('#2f3437', 0.055);
  ctx.strokeStyle = fg === PAL.ink ? 'rgba(47,52,55,0.05)' : 'rgba(255,215,154,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const rows = Math.ceil(limit / (sp * Math.sqrt(3) / 2)) + 1;
  const cols = Math.ceil(limit / sp) + 1;
  for (let j = -rows; j <= rows; j++) {
    for (let i = -cols; i <= cols; i++) {
      const x = i * sp + (j % 2 ? sp / 2 : 0);
      const y = j * sp * Math.sqrt(3) / 2;
      if (Math.hypot(x, y) > limit) continue;
      ctx.moveTo(cx + x + R, cy + y);
      ctx.arc(cx + x, cy + y, R, 0, Math.PI * 2);
    }
  }
  ctx.stroke();
}

function draw() {
  const w = canvas.clientWidth  || window.innerWidth  || 900;
  const h = canvas.clientHeight || window.innerHeight || 600;
  const heat = state.heat / CFG.heatMax;
  const bgArr = heat < 0.55 ? mixArr(PAL.paper, PAL.scorch, heat / 0.55)
                            : mixArr(PAL.scorch, PAL.char, (heat - 0.55) / 0.45);
  const bg = toCss(bgArr);
  const bgL = lumArr(bgArr);
  const fgHex = heat < 0.6 ? PAL.ink : PAL.inkHot;
  const fg = heat < 0.6 ? PAL.ink : mixColor(PAL.ink, PAL.inkHot, (heat - 0.6) / 0.4);

  document.body.style.background = bg;
  document.body.style.color = fg;

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (state.shake > 0) {
    ctx.translate(rand(-1, 1) * state.shake * 9, rand(-1, 1) * state.shake * 9);
  }

  drawWatermark(fgHex);

  // --- Metatron's Cube: all 78 lines, in pencil ---
  ctx.lineWidth = 1;
  ctx.strokeStyle = heat < 0.6 ? 'rgba(47,52,55,0.22)' : 'rgba(255,215,154,0.24)';
  ctx.beginPath();
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    if (e.sever > 0) continue;
    ctx.moveTo(nodes[e.a].x, nodes[e.a].y);
    ctx.lineTo(nodes[e.b].x, nodes[e.b].y);
  }
  ctx.stroke();

  // severed lines
  ctx.save();
  ctx.setLineDash([4, 7]);
  ctx.strokeStyle = rgba(PAL.yellow, 0.5);
  ctx.beginPath();
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    if (e.sever <= 0) continue;
    ctx.moveTo(nodes[e.a].x, nodes[e.a].y);
    ctx.lineTo(nodes[e.b].x, nodes[e.b].y);
  }
  ctx.stroke();
  ctx.restore();

  // --- lit lines ---
  ctx.lineCap = 'round';
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    if (e.sever > 0) continue;
    const A = nodes[e.a], B = nodes[e.b];
    if (A.charge <= 0 || B.charge <= 0) continue;
    const s = Math.min(A.charge, B.charge);
    const grad = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
    grad.addColorStop(0, rgba(A.color, 0.25 + 0.6 * s));
    grad.addColorStop(1, rgba(B.color, 0.25 + 0.6 * s));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.4 + 3.4 * s + e.heat * 1.6;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';

  // --- circles ---
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = heat < 0.6 ? 'rgba(47,52,55,0.5)' : 'rgba(255,215,154,0.55)';
    ctx.beginPath();
    ctx.arc(n.x, n.y, nodeR, 0, Math.PI * 2);
    ctx.stroke();

    if (n.charge > 0) {
      const c = Math.min(1.35, n.charge);
      const sc = legibleArr(n.color, bgL);
      ctx.fillStyle = rgbaArr(sc, 0.10 + 0.13 * c);
      ctx.beginPath();
      ctx.arc(n.x, n.y, nodeR - 2, 0, Math.PI * 2);
      ctx.fill();

      const r = nodeR * (0.30 + 0.34 * Math.min(1, c)) * (1 + n.flash * 0.28);
      const g = ctx.createRadialGradient(n.x - r * 0.3, n.y - r * 0.35, r * 0.1, n.x, n.y, r);
      g.addColorStop(0, rgbaArr(sc, 0.95));
      g.addColorStop(1, rgbaArr(sc, 0.42 + 0.4 * Math.min(1, c)));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();

      if (c > 1.01) {
        ctx.strokeStyle = rgbaArr(sc, 0.85);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // --- selection ---
  const sel = nodes[state.sel];
  ctx.save();
  ctx.setLineDash([3, 5]);
  ctx.lineWidth = 1.6;
  const canAfford = state.prana >= (inPeak() ? CFG.placeCostPeak : CFG.placeCost);
  ctx.strokeStyle = state.denied > 0 ? rgba(PAL.red, 0.9)
                  : (inPeak() && canAfford ? rgba(PAL.cyan, 0.95) : (heat < 0.6 ? 'rgba(47,52,55,0.75)' : 'rgba(255,215,154,0.8)'));
  ctx.beginPath();
  ctx.arc(sel.x, sel.y, nodeR + 7 + (inPeak() ? 3 : 0), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.font = '10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = heat < 0.6 ? 'rgba(47,52,55,0.55)' : 'rgba(255,215,154,0.6)';
  ctx.fillText(sel.name, cx, cy + 2 * U + nodeR + 26);   // under the whole figure, never over it

  // --- invaders ---
  for (let i = 0; i < invaders.length; i++) {
    const v = invaders[i];
    const m = spriteMetrics(v.def);
    const px = m.px * v.scale;
    const bob = Math.sin(v.t * 4) * 2;
    let a = v.alpha * (0.5 + 0.5 * (v.hp / v.maxHp));
    if (v.flick) a *= 0.3;
    // flash toward whatever contrasts with the page: ink on cream, white on char
    const body = legible(v.def.color, bgL);
    const col = v.hit > 0 ? (bgL > 0.5 ? PAL.ink : '#ffffff') : body;
    drawSprite(m.rows, v.x, v.y + bob, px, col, a);
    if (v.maxHp > 60) {
      const bw = m.w * v.scale;
      ctx.fillStyle = bgL > 0.5 ? rgba(PAL.ink, 0.18) : 'rgba(255,243,221,0.22)';
      ctx.fillRect(v.x - bw / 2, v.y + m.h * v.scale / 2 + 6, bw, 3);
      ctx.fillStyle = body;
      ctx.fillRect(v.x - bw / 2, v.y + m.h * v.scale / 2 + 6, bw * (v.hp / v.maxHp), 3);
    }
  }

  // --- particles ---
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // --- mer-ka-ba ---
  if (state.merkabaAnim > 0) {
    const p = 1 - state.merkabaAnim / 1.4;
    const R = U * (0.5 + p * 2.3);
    const ang = p * Math.PI * 2.4;
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.95;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = PAL.cyan;
    drawTriangle(cx, cy, R, ang - Math.PI / 2);
    ctx.strokeStyle = PAL.red;
    drawTriangle(cx, cy, R, -ang + Math.PI / 2);
    ctx.restore();
  }

  // --- banner ---
  if (state.banner) {
    const b = state.banner;
    const a = clamp(b.t / 0.6, 0, 1) * clamp((b.max - b.t) / 0.25, 0, 1);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.fillStyle = fg;
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText(b.text, cx, cy - U * 2.55);
    if (b.sub) {
      ctx.font = '11px "Courier New", monospace';
      ctx.globalAlpha = a * 0.7;
      ctx.fillText(b.sub, cx, cy - U * 2.55 + 18);
    }
    ctx.globalAlpha = 1;
  }

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

// ---------- HUD ----------
function updateHUD() {
  document.getElementById('score').textContent = state.score;
  document.getElementById('breathNo').textContent = state.breath;
  document.getElementById('litCount').textContent = litCount() + '/13';
  document.getElementById('pranaFill').style.width = (state.prana / CFG.pranaMax * 100) + '%';
  document.getElementById('heatFill').style.width = (state.heat / CFG.heatMax * 100) + '%';
  document.getElementById('breathFill').style.width = (breathFullness() * 100) + '%';
  const cb = document.getElementById('cutupBtn');
  if (cb) cb.disabled = state.cutupCD > 0 || state.prana < CFG.cutupCost;
}

// ---------- loop ----------
let last = 0;
function frame(now) {
  // Clamped at both ends: a negative delta would run the breath, the heat
  // and every cooldown backwards.
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000 || 0));
  last = now;
  if (canvas.clientWidth !== lastW || canvas.clientHeight !== lastH) layout();
  if (state.running && !state.paused && !state.over) update(dt);
  draw();
  updateHUD();
  requestAnimationFrame(frame);
}

// ---------- lifecycle ----------
function resetGame() {
  for (let i = 0; i < nodes.length; i++) { nodes[i].charge = 0; nodes[i].flash = 0; }
  for (let i = 0; i < edges.length; i++) { edges[i].sever = 0; edges[i].heat = 0; }
  invaders = [];
  particles = [];
  state.score = 0;
  state.prana = CFG.pranaMax;
  state.heat = 0;
  state.breathT = 0;
  state.t = 0;
  state.sel = 0;
  state.cutupCD = 0;
  state.merkabaAnim = 0;
  state.merkabaCount = 0;
  state.over = false;
  state.paused = false;
  state.running = true;
  startBreath(1);
}

function endGame() {
  if (state.over) return;
  state.over = true;
  state.running = false;
  document.getElementById('fScore').textContent = state.score;
  document.getElementById('fBreath').textContent = state.breath;
  document.getElementById('fMerkaba').textContent = state.merkabaCount;
  document.getElementById('fCodex').textContent = Object.keys(state.discovered).length;
  show('overScreen');
}

// ---------- overlays ----------
function show(id) { document.getElementById(id).classList.add('show'); }
function hide(id) { document.getElementById(id).classList.remove('show'); }
function anyOverlayOpen() {
  return document.querySelectorAll('.overlay.show').length > 0;
}

function renderCodex() {
  const el = document.getElementById('codexBody');
  let html = '';
  let locked = 0;
  for (let i = 0; i < CODEX_ORDER.length; i++) {
    const k = CODEX_ORDER[i];
    if (!state.discovered[k]) { locked++; continue; }
    const e = CODEX[k];
    html += '<div class="entry"><h3>' + e.title + '</h3><p>' + e.body +
            '</p><div class="src">' + e.src + '</div></div>';
  }
  if (!html) html = '<p style="opacity:.6">Nothing yet. Place a sphere.</p>';
  if (locked > 0) html += '<div class="locked">' + locked + ' entries still unwritten</div>';
  el.innerHTML = html;
}

// ---------- input ----------
function nearestNode(mx, my, maxDist) {
  let best = -1, bd = Infinity;
  for (let i = 0; i < nodes.length; i++) {
    const d = Math.hypot(nodes[i].x - mx, nodes[i].y - my);
    if (d < bd) { bd = d; best = i; }
  }
  return bd <= maxDist ? best : -1;
}

canvas.addEventListener('mousemove', function (e) {
  const r = canvas.getBoundingClientRect();
  const i = nearestNode(e.clientX - r.left, e.clientY - r.top, nodeR * 1.45);
  if (i >= 0) state.sel = i;
});

canvas.addEventListener('mousedown', function (e) {
  if (anyOverlayOpen()) return;
  const r = canvas.getBoundingClientRect();
  const i = nearestNode(e.clientX - r.left, e.clientY - r.top, nodeR * 1.6);
  if (i >= 0) { state.sel = i; placeSphere(i); }
});

canvas.addEventListener('touchstart', function (e) {
  if (anyOverlayOpen()) return;
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const t = e.changedTouches[0];
  const i = nearestNode(t.clientX - r.left, t.clientY - r.top, nodeR * 1.8);
  if (i >= 0) { state.sel = i; placeSphere(i); }
}, { passive: false });

function moveSel(dx, dy) {
  const cur = nodes[state.sel];
  let best = -1, bestScore = Infinity;
  for (let i = 0; i < nodes.length; i++) {
    if (i === cur.i) continue;
    const vx = nodes[i].x - cur.x, vy = nodes[i].y - cur.y;
    const d = Math.hypot(vx, vy);
    const dot = (vx * dx + vy * dy) / d;
    if (dot < 0.4) continue;
    const sc = d / (dot * dot);
    if (sc < bestScore) { bestScore = sc; best = i; }
  }
  if (best >= 0) state.sel = best;
}

function isSpace(e) {
  // e.key is ' ' in modern browsers, 'Spacebar' in older ones; e.code is the safe check
  return e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
}

window.addEventListener('keydown', function (e) {
  const k = isSpace(e) ? ' ' : e.key.toLowerCase();
  const codexOpen = document.getElementById('codexScreen').classList.contains('show');
  const pauseOpen = document.getElementById('pauseScreen').classList.contains('show');
  if (k === 'escape') {
    if (codexOpen) { hide('codexScreen'); if (!pauseOpen) state.paused = false; }
    else if (pauseOpen) togglePause();
    return;
  }
  // P has to reach togglePause even though the pause overlay is up, or it is a
  // one-way trip into the pause screen.
  if (k === 'p' && pauseOpen && !codexOpen) { togglePause(); return; }
  if (anyOverlayOpen()) {
    if (k === 'enter' || k === ' ') {
      if (document.getElementById('startScreen').classList.contains('show')) { hide('startScreen'); resetGame(); }
      else if (document.getElementById('overScreen').classList.contains('show')) { hide('overScreen'); resetGame(); }
      e.preventDefault();
    }
    return;
  }
  if (k === ' ') { placeSphere(state.sel); e.preventDefault(); return; }
  if (k === 'c') { cutUp(); return; }
  if (k === 'p') { togglePause(); return; }
  if (k === 'arrowleft'  || k === 'left'  || k === 'a') { moveSel(-1, 0); e.preventDefault(); }
  if (k === 'arrowright' || k === 'right' || k === 'd') { moveSel(1, 0);  e.preventDefault(); }
  if (k === 'arrowup'    || k === 'up'    || k === 'w') { moveSel(0, -1); e.preventDefault(); }
  if (k === 'arrowdown'  || k === 'down'  || k === 's') { moveSel(0, 1);  e.preventDefault(); }
});

// A button that keeps focus after a click will swallow the next Space as its own
// activation - which would silently restart the run mid-game. Drop focus.
document.querySelectorAll('.btn').forEach(function (b) {
  b.addEventListener('click', function () { b.blur(); });
});

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  if (state.paused) show('pauseScreen'); else hide('pauseScreen');
}

// ---------- wiring ----------
document.getElementById('startBtn').addEventListener('click', function () {
  hide('startScreen');
  resetGame();
});
document.getElementById('againBtn').addEventListener('click', function () {
  hide('overScreen');
  resetGame();
});
document.getElementById('codexBtn').addEventListener('click', function () {
  renderCodex();
  show('codexScreen');
  if (state.running) state.paused = true;
});
document.getElementById('overCodexBtn').addEventListener('click', function () {
  renderCodex();
  show('codexScreen');
});
document.getElementById('codexClose').addEventListener('click', function () {
  hide('codexScreen');
  if (!document.getElementById('overScreen').classList.contains('show') &&
      !document.getElementById('pauseScreen').classList.contains('show')) state.paused = false;
});
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resumeBtn').addEventListener('click', togglePause);
const cutupBtn = document.getElementById('cutupBtn');
if (cutupBtn) cutupBtn.addEventListener('click', cutUp);

if ('ontouchstart' in window) document.body.classList.add('touch');
window.addEventListener('resize', layout);

layout();
requestAnimationFrame(function (t) { last = t; requestAnimationFrame(frame); });
