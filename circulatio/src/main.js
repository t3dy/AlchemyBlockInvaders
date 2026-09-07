// ===================================================================
// CIRCULATIO / game layer
// Shot state machine, entities, powers, inscription, UI wiring.
// ===================================================================

import * as THREE from 'three';
import * as P from './physics.js';
import { V } from './physics.js';
import { RULESETS, RULESET_ORDER, LETTERS, LETTER_ORDER, POWERS, applyPowers } from './rules.js';
import { COURSES, buildWorld, spawnPoint, surfaceY, courseBounds, TILE } from './course.js';
import * as R from './render.js';

const canvas = document.getElementById('view');
const view = R.createRenderer(canvas);
view.aspect = 1;

const DT = 1 / 120;                 // physics is always stepped at this rate
const BALL_R = 0.32;
const MIN_SPEED = 4.5, MAX_SPEED = 17.5;
const LIVE_DAMP = 9.0, LIVE_MAX = 13.0;   // seconds before a shot is damped / forced to settle

const G = {
  courseIndex: 0,
  course: null,
  world: null,
  meshes: null,
  balls: [],
  ballMeshes: [],
  enemies: [],
  powers: [],
  cup: null,
  ruleset: 'aristotelian',
  phase: 'aim',           // aim | meter | live | done
  yaw: 0,
  loft: 38,
  spin: 0,
  air: false,
  meter: 0, meterDir: 1,
  stroke: 0,
  held: null,             // power waiting to be spent
  shotFlags: {},
  quarter: 0,
  lettering: false,
  letter: 'alif',
  previewDirty: true,
  lastRest: null,
  accum: 0,
  liveTime: 0,
  liftArmed: false,
  hoverLeft: 0,
  running: false
};

let preview = null, aimArrow = null, cursorMesh = null;

// ---------------------------------------------------------------
// Course setup
// ---------------------------------------------------------------
function loadCourse(i) {
  if (G.meshes) { view.scene.remove(G.meshes); disposeGroup(G.meshes); }
  for (const m of G.ballMeshes) view.scene.remove(m);
  for (const e of G.enemies) view.scene.remove(e.mesh);
  for (const p of G.powers) view.scene.remove(p.mesh);
  if (G.cup) view.scene.remove(G.cup.mesh);

  G.courseIndex = ((i % COURSES.length) + COURSES.length) % COURSES.length;
  G.course = COURSES[G.courseIndex];
  G.world = buildWorld(G.course);
  G.meshes = R.buildCourseMeshes(view.scene, G.course);

  G.enemies = (G.course.enemies || []).map(function (e) {
    const mesh = R.makeEnemy(e.kind);
    const y = surfaceY(G.course, e.x, e.z) + 0.45;
    mesh.position.set(e.x, y, e.z);
    view.scene.add(mesh);
    return { pos: { x: e.x, y: y, z: e.z }, kind: e.kind, mesh: mesh, alive: true };
  });

  G.powers = (G.course.powers || []).map(function (p) {
    const def = POWERS[p.id];
    const mesh = R.makePower(parseInt((def.color || '#2f3437').slice(1), 16));
    const y = surfaceY(G.course, p.x, p.z) + 0.45;
    mesh.position.set(p.x, y, p.z);
    view.scene.add(mesh);
    return { pos: { x: p.x, y: y, z: p.z }, id: p.id, mesh: mesh, taken: false };
  });

  G.cup = null;
  G.stroke = 0;
  G.held = null;
  G.spin = 0;
  G.phase = 'aim';
  G.lastRest = null;      // a new course starts at ITS spawn, not where the last run ended
  maybeMakeCup();         // a course authored with a single body opens its cup immediately
  resetBall(false);
  R.placeCamera(view, G.course, G.quarter, 1);
  G.previewDirty = true;
  syncUI();
}

function disposeGroup(g) {
  g.traverse(function (o) {
    if (o.geometry) o.geometry.dispose();
    if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose(); }
  });
}

function resetBall(penalise) {
  for (const m of G.ballMeshes) view.scene.remove(m);
  G.ballMeshes = [];
  const at = G.lastRest || spawnPoint(G.course, BALL_R);
  const b = P.createBall(at, BALL_R);
  G.balls = [b];
  const mesh = R.makeBall(BALL_R);
  view.scene.add(mesh);
  G.ballMeshes = [mesh];
  G.lastRest = V.clone(at);
  if (penalise) G.stroke++;
  G.phase = 'aim';
  G.previewDirty = true;
}

// ---------------------------------------------------------------
// Shot
// ---------------------------------------------------------------
function shotVelocity(power) {
  const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * power;
  const dir = { x: Math.sin(G.yaw), y: 0, z: Math.cos(G.yaw) };
  if (!G.air) return V.mul(dir, speed);
  const a = G.loft * Math.PI / 180;
  return { x: dir.x * Math.cos(a) * speed, y: Math.sin(a) * speed, z: dir.z * Math.cos(a) * speed };
}

function activeRules() {
  return applyPowers(RULESETS[G.ruleset], G.shotFlags);
}

function fire() {
  const power = G.meter;
  const flags = {};
  if (G.held) POWERS[G.held].apply(flags);
  G.shotFlags = flags;

  const base = shotVelocity(power);
  const primary = G.balls[0];
  primary.vel = V.clone(base);
  primary.spin = G.spin;

  // VESICA: two mirrored balls, both real, either may take the cup
  if (flags.split) {
    const a = flags.split * Math.PI / 180;
    primary.vel = rotateY(base, a);
    const twin = P.createBall(primary.pos, BALL_R);
    twin.vel = rotateY(base, -a);
    twin.spin = -G.spin;
    G.balls.push(twin);
    const mesh = R.makeBall(BALL_R);
    view.scene.add(mesh);
    G.ballMeshes.push(mesh);
  }

  G.liveTime = 0;
  G.liftArmed = !!flags.lift;
  G.hoverLeft = flags.hover || 0;
  G.held = null;
  G.stroke++;
  G.phase = 'live';
  syncUI();
}

function rotateY(v, a) {
  return { x: v.x * Math.cos(a) - v.z * Math.sin(a), y: v.y, z: v.x * Math.sin(a) + v.z * Math.cos(a) };
}

// ---------------------------------------------------------------
// Simulation tick for the live phase
// ---------------------------------------------------------------
function tickLive(dt) {
  const rules = activeRules();

  // A shot has to end. Between a bumper and a wall a ball can trade energy
  // for a very long time, so damp it after LIVE_DAMP and force a settle at
  // LIVE_MAX rather than leaving the player unable to act.
  G.liveTime += dt;
  if (G.liveTime > LIVE_DAMP) {
    const k = Math.pow(0.35, dt);
    for (const b of G.balls) b.vel = V.mul(b.vel, k);
  }
  if (G.liveTime > LIVE_MAX) { settle(); return; }

  const hoverRules = G.hoverLeft > 0 ? Object.assign({}, rules, { gravity: 0 }) : rules;
  if (G.hoverLeft > 0) G.hoverLeft -= dt;

  let allRest = true;
  for (let i = 0; i < G.balls.length; i++) {
    const b = G.balls[i];
    if (b.done) continue;
    const events = [];
    const rest = P.step(b, G.world, hoverRules, dt, events);

    if (G.shotFlags.burn) burnTiles(b);
    hitEnemies(b);
    takePowers(b);

    if (b.pos.y < -6) { b.done = true; b.fell = true; continue; }
    if (checkCup(b)) { finish(true); return; }
    if (!rest) allRest = false;
  }

  if (allRest || G.balls.every(b => b.done)) settle();
}

function settle() {
  // With more than one ball in play, keep the one best placed for the next
  // shot: nearest to a surviving body. The other is reabsorbed.
  const live = G.balls.filter(b => !b.fell);
  if (live.length === 0) { resetBall(true); return; }

  let best = live[0], bd = Infinity;
  const targets = G.cup ? [G.cup] : G.enemies.filter(e => e.alive);
  for (const b of live) {
    let d = 0;
    if (targets.length) {
      d = Math.min.apply(null, targets.map(t => Math.hypot(t.pos.x - b.pos.x, t.pos.z - b.pos.z)));
    }
    if (d < bd) { bd = d; best = b; }
  }
  for (let i = G.ballMeshes.length - 1; i >= 1; i--) {
    view.scene.remove(G.ballMeshes[i]);
    G.ballMeshes.splice(i, 1);
  }
  best.vel = V.zero();
  best.spin = 0;
  best.done = false;
  best.restTimer = 0;
  G.balls = [best];
  G.lastRest = V.clone(best.pos);
  G.spin = 0;
  G.shotFlags = {};
  G.phase = 'aim';
  G.previewDirty = true;
  syncUI();
}

// CALCINATIO: fire dries pitch. The tile stops being a trap, permanently.
function burnTiles(b) {
  const near = G.world.query(b.pos, b.r + 0.2);
  for (const c of near) {
    if (c.mat === 'pitch' && Math.abs(b.pos.y - (c.top || 0)) < b.r + 0.25) {
      c.mat = 'stone';
      c.burned = true;
    }
  }
}

function hitEnemies(b) {
  const speed = V.len(b.vel);
  if (speed < 1.2) return;
  for (const e of G.enemies) {
    if (!e.alive) continue;
    const d = Math.hypot(e.pos.x - b.pos.x, e.pos.y - b.pos.y, e.pos.z - b.pos.z);
    if (d > 0.55 + b.r) continue;
    e.alive = false;
    view.scene.remove(e.mesh);
    // a light deflection, so a chain of bodies still reads as a chain
    const n = V.norm({ x: b.pos.x - e.pos.x, y: 0.25, z: b.pos.z - e.pos.z });
    b.vel = V.add(V.mul(b.vel, 0.82), V.mul(n, 2.2));
    maybeMakeCup();
    syncUI();
  }
}

// The rule this whole genre turns on: when one body is left, it is the cup.
function maybeMakeCup() {
  const alive = G.enemies.filter(e => e.alive);
  if (alive.length !== 1 || G.cup) return;
  const last = alive[0];
  view.scene.remove(last.mesh);
  last.alive = false;
  const mesh = R.makeCup();
  const y = surfaceY(G.course, last.pos.x, last.pos.z) + 0.02;
  mesh.position.set(last.pos.x, y, last.pos.z);
  view.scene.add(mesh);
  G.cup = { pos: { x: last.pos.x, y: y, z: last.pos.z }, mesh: mesh };
}

function checkCup(b) {
  if (!G.cup) return false;
  const dxz = Math.hypot(G.cup.pos.x - b.pos.x, G.cup.pos.z - b.pos.z);
  const dy = Math.abs(b.pos.y - G.cup.pos.y - b.r);
  return dxz < 0.5 && dy < 0.45 && V.len(b.vel) < 9;
}

function takePowers(b) {
  for (const p of G.powers) {
    if (p.taken) continue;
    const d = Math.hypot(p.pos.x - b.pos.x, p.pos.y - b.pos.y, p.pos.z - b.pos.z);
    if (d > 0.55 + b.r) continue;
    p.taken = true;
    view.scene.remove(p.mesh);
    G.held = p.id;
    syncUI();
  }
}

function finish(won) {
  G.phase = 'done';
  const par = G.course.par;
  const d = G.stroke - par;
  document.getElementById('doneTitle').textContent = won ? 'FIXED' : 'DISPERSED';
  document.getElementById('doneSub').textContent = won
    ? 'the matter has entered the flask'
    : 'the work is lost';
  document.getElementById('doneLine').textContent =
    'Course completed in ' + G.stroke + ' strokes against a par of ' + par + '. ' +
    (d < 0 ? (-d) + ' under.' : d === 0 ? 'Level par.' : d + ' over.') +
    '  Metaphysics: ' + RULESETS[G.ruleset].name + '.';
  document.getElementById('doneScreen').classList.add('show');
}

// ---------------------------------------------------------------
// Preview - the real simulation, run forward on a copy
// ---------------------------------------------------------------
function refreshPreview() {
  if (!preview || G.phase === 'live' || G.phase === 'done') return;
  const flags = {};
  if (G.held) POWERS[G.held].apply(flags);
  const rules = applyPowers(RULESETS[G.ruleset], flags);
  const power = G.phase === 'meter' ? G.meter : 0.62;
  const result = P.predictPath(G.balls[0], G.world, rules, shotVelocity(power), {
    maxTime: 3.2, dt: 1 / 120, spin: G.spin, voidY: -6
  });
  R.updatePreview(preview, result);
}

// ---------------------------------------------------------------
// Inscription (lettrist ruleset)
// ---------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function inscribeAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, view.camera);
  const tiles = G.meshes.userData.tiles;
  const hits = raycaster.intersectObject(tiles, false);
  if (!hits.length) return;
  const cell = G.meshes.userData.cells[hits[0].instanceId];
  if (!cell) return;
  const collider = G.world.tileCollider(cell.x, cell.z);
  if (!collider) return;
  const def = LETTERS[G.letter];
  collider.letterMat = def.mat;
  collider.letter = G.letter;
  markInscription(cell, def);
  G.previewDirty = true;
}

const inscriptions = new THREE.Group();
function markInscription(cell, def) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(0,0,0,0)';
  c.fillRect(0, 0, 128, 128);
  c.fillStyle = '#2f3437';
  c.font = '86px serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(def.glyph, 64, 70);
  const tex = new THREE.CanvasTexture(cv);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE * 0.8, TILE * 0.8),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(cell.x * TILE + TILE / 2, cell.h + 0.012, cell.z * TILE + TILE / 2);
  inscriptions.add(plane);
}

// ---------------------------------------------------------------
// UI
// ---------------------------------------------------------------
const $ = id => document.getElementById(id);

function syncUI() {
  $('courseName').textContent = G.course.name;
  $('courseSub').textContent = G.course.subtitle;
  $('stroke').textContent = G.stroke;
  $('par').textContent = G.course.par;
  $('remaining').textContent = G.cup ? 'CUP OPEN' : G.enemies.filter(e => e.alive).length;
  $('phase').textContent = G.phase.toUpperCase();

  const rs = RULESETS[G.ruleset];
  $('rsName').textContent = rs.name;
  $('rsSub').textContent = rs.subtitle;
  $('rsProv').textContent = rs.provenance;
  $('rsNote').textContent = rs.note;
  $('rsSrc').textContent = rs.source;
  $('rsConsts').textContent =
    'gravity ' + rs.gravity.toFixed(0) +
    ' · rebound ×' + rs.restitution.toFixed(2) +
    ' · grip ×' + rs.friction.toFixed(2) +
    (rs.quantize ? ' · rebound quantised to consonant ratios' : '');

  if (G.held) {
    const p = POWERS[G.held];
    $('pwName').textContent = p.name;
    $('pwSub').textContent = p.family === 'operation' ? 'alchemical operation' : 'figure';
    $('pwProv').style.display = 'inline-block';
    $('pwProv').textContent = p.provenance;
    $('pwGloss').textContent = p.gloss;
    $('pwEffect').textContent = p.effect;
  } else {
    $('pwName').textContent = 'NO POWER HELD';
    $('pwSub').textContent = 'roll over a sigil to take one up';
    $('pwProv').style.display = 'none';
    $('pwGloss').textContent = '';
    $('pwEffect').textContent = '';
  }

  $('shotMode').textContent = G.air ? 'AIR' : 'GROUND';
  $('shotInfo').textContent =
    (G.air ? 'loft ' + G.loft.toFixed(0) + '° · ' : '') +
    'english ' + (G.spin === 0 ? 'none' : (G.spin > 0 ? '+' : '') + G.spin.toFixed(1));

  syncLetterUI();
}

function syncLetterUI() {
  const row = $('glyphRow');
  if (row.childElementCount === 0) {
    LETTER_ORDER.forEach(function (k) {
      const s = document.createElement('span');
      s.textContent = LETTERS[k].glyph;
      s.title = LETTERS[k].name;
      s.addEventListener('click', function () { G.letter = k; syncLetterUI(); });
      row.appendChild(s);
    });
  }
  LETTER_ORDER.forEach(function (k, i) {
    row.children[i].classList.toggle('on', k === G.letter);
  });
  const d = LETTERS[G.letter];
  $('ltProv').textContent = d.provenance + ' · operation: ' + d.opProvenance;
  $('ltGloss').textContent = d.glyph + '  ' + d.name + ' — abjad ' + d.abjad + ', ' + d.element + ' (' + d.temperament + '). ' + d.gloss;
  $('ltOp').textContent = d.operation;
  $('ltSrc').textContent = 'Click a tile to inscribe. The letter rewrites that tile\'s surface law; ' +
    'it takes effect under every ruleset, but only the LETTRIST ruleset lets it override the global constants.';
}

// ---------------------------------------------------------------
// Input
// ---------------------------------------------------------------
function onKey(e) {
  const k = e.key.toLowerCase();
  const space = e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';

  if ($('startScreen').classList.contains('show')) {
    if (space || k === 'enter') { start(); e.preventDefault(); }
    return;
  }
  if ($('doneScreen').classList.contains('show')) {
    if (space || k === 'enter' || k === 'n') { nextCourse(); e.preventDefault(); }
    return;
  }

  if (space) {
    e.preventDefault();
    if (G.phase === 'aim') { G.phase = 'meter'; G.meter = 0; G.meterDir = 1; }
    else if (G.phase === 'meter') fire();
    else if (G.phase === 'live' && G.liftArmed) {
      // SUBLIMATIO: the second jump
      G.liftArmed = false;
      for (const b of G.balls) if (!b.done) b.vel.y = Math.max(b.vel.y, 0) + 8.5;
    }
    return;
  }

  if (k === 'tab') { G.air = !G.air; G.previewDirty = true; syncUI(); e.preventDefault(); return; }
  if (k === 'q') { G.quarter = (G.quarter + 3) % 4; R.placeCamera(view, G.course, G.quarter, 1); return; }
  if (k === 'e') { G.quarter = (G.quarter + 1) % 4; R.placeCamera(view, G.course, G.quarter, 1); return; }
  if (k === 'r') { resetBall(true); syncUI(); return; }
  if (k === 'n') { nextCourse(); return; }
  if (k === 'l') {
    G.lettering = !G.lettering;
    document.body.classList.toggle('lettering', G.lettering);
    syncUI();
    return;
  }

  if (G.lettering && k >= '1' && k <= '5') {
    G.letter = LETTER_ORDER[parseInt(k, 10) - 1] || G.letter;
    syncLetterUI();
    return;
  }
  if (!G.lettering && k >= '1' && k <= '4') {
    G.ruleset = RULESET_ORDER[parseInt(k, 10) - 1];
    G.previewDirty = true;
    syncUI();
    return;
  }

  if (G.phase !== 'aim') return;
  const step = e.shiftKey ? 0.015 : 0.05;
  if (k === 'a' || k === 'arrowleft')  { G.yaw -= step; G.previewDirty = true; }
  if (k === 'd' || k === 'arrowright') { G.yaw += step; G.previewDirty = true; }
  if (k === 'w' || k === 'arrowup')    { G.loft = Math.min(78, G.loft + 2); G.previewDirty = true; syncUI(); }
  if (k === 's' || k === 'arrowdown')  { G.loft = Math.max(8, G.loft - 2); G.previewDirty = true; syncUI(); }
  if (k === 'z') { G.spin = Math.max(-3, G.spin - 0.5); G.previewDirty = true; syncUI(); }
  if (k === 'x') { G.spin = Math.min(3, G.spin + 0.5); G.previewDirty = true; syncUI(); }
}

canvas.addEventListener('mousedown', function (e) {
  if (G.lettering) inscribeAt(e.clientX, e.clientY);
});

function nextCourse() {
  $('doneScreen').classList.remove('show');
  G.lastRest = null;
  loadCourse(G.courseIndex + 1);
}

function start() {
  $('startScreen').classList.remove('show');
  G.running = true;
}

// ---------------------------------------------------------------
// Frame
// ---------------------------------------------------------------
let last = 0;
function frame(now) {
  // Clamped at both ends. A negative delta would wind the meter backwards and
  // feed a negative accumulator to the fixed-step live phase.
  const dt = Math.max(0, Math.min(0.05, (now - last) / 1000 || 0));
  last = now;

  const w = canvas.clientWidth || window.innerWidth || 900;
  const h = canvas.clientHeight || window.innerHeight || 600;
  if (w !== view.lastW || h !== view.lastH) {
    view.lastW = w; view.lastH = h;
    R.resize(view, w, h);
    R.placeCamera(view, G.course, G.quarter, 1);
  }

  if (G.running) {
    if (G.phase === 'meter') {
      G.meter += G.meterDir * dt * 1.35;
      if (G.meter > 1) { G.meter = 1; G.meterDir = -1; }
      if (G.meter < 0) { G.meter = 0; G.meterDir = 1; }
      G.previewDirty = true;
    }

    if (G.phase === 'live') {
      G.accum += dt;
      let guard = 0;
      while (G.accum >= DT && G.phase === 'live' && guard++ < 40) {
        G.accum -= DT;
        tickLive(DT);
      }
    } else {
      G.accum = 0;
    }
  }

  // meshes follow the simulation
  for (let i = 0; i < G.balls.length && i < G.ballMeshes.length; i++) {
    const b = G.balls[i], m = G.ballMeshes[i];
    m.position.set(b.pos.x, b.pos.y, b.pos.z);
    m.rotation.z -= b.vel.x * dt * 1.6;
    m.rotation.x += b.vel.z * dt * 1.6;
    m.visible = !b.fell;
  }
  for (const e of G.enemies) if (e.alive) { e.mesh.rotation.y += dt * 0.9; e.mesh.userData.core.rotation.x += dt * 0.6; }
  for (const p of G.powers) if (!p.taken) { p.mesh.rotation.y += dt * 1.4; p.mesh.position.y += Math.sin(now / 420) * 0.0015; }
  if (G.cup) G.cup.mesh.userData.rim.rotation.z += dt * 0.8;

  if (aimArrow) {
    const b = G.balls[0];
    aimArrow.visible = G.phase === 'aim' || G.phase === 'meter';
    aimArrow.position.set(b.pos.x, b.pos.y + 0.02, b.pos.z);
    aimArrow.rotation.y = G.yaw;
  }
  if (preview) preview.visible = G.phase === 'aim' || G.phase === 'meter';

  if (G.previewDirty) { G.previewDirty = false; refreshPreview(); }

  $('meterFill').style.width = (G.meter * 100) + '%';
  $('powerVal').textContent = Math.round(G.meter * 100) + '%';
  $('phase').textContent = G.phase.toUpperCase();

  window.HELP.tick(dt);
  view.renderer.render(view.scene, view.camera);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------
// Boot
// ---------------------------------------------------------------
preview = R.makePreview();
view.scene.add(preview);
aimArrow = R.makeAimArrow();
view.scene.add(aimArrow);
view.scene.add(inscriptions);

loadCourse(0);
R.resize(view, window.innerWidth, window.innerHeight);
R.placeCamera(view, G.course, G.quarter, 1);

window.addEventListener('keydown', onKey);
$('startBtn').addEventListener('click', function () { start(); this.blur(); });
$('nextBtn').addEventListener('click', function () { nextCourse(); this.blur(); });

// exposed for headless verification and tuning
window.CIRC = { G, P, V, RULESETS, POWERS, LETTERS, tickLive, loadCourse, shotVelocity, fire, settle };


// ---------- the teaching layer ----------
window.HELP.install({
  id: 'circulatio', light: true,
  title: 'CIRCULATIO',
  subtitle: 'the matter rises and falls until it is fixed',
  premise: 'A bounce-and-strike course in the manner of Kirby\u2019s Dream Course \u2014 except ' +
    'that the physics is a PHILOSOPHY, and you may change it mid-round. Aristotelian bodies seek ' +
    'their natural place: heavy gravity, dead rebounds, ground that grips. The Paracelsian, ' +
    'Pythagorean and Lettrist readings each answer differently, and the same shot behaves like a ' +
    'different shot under each.',
  goal: 'You are the matter in the vessel. Every body you touch is dissolved. When ONE body is ' +
    'left it becomes the mouth of the flask \u2014 the cup \u2014 and you must fall into it. ' +
    'Do it in as few strokes as you can: each course has a par.',
  controls: [
    ['A  D', 'aim'],
    ['Space', 'meter, then strike'],
    ['W  S', 'loft (air shot)'],
    ['Z  X', 'english'],
    ['Tab', 'ground / air'],
    ['Q  E', 'turn the table'],
    ['1 \u2013 4', 'change metaphysics'],
    ['L', 'inscribe a letter'],
    ['R  N', 'reset / next course']
  ],
  stripNote: '<b>Space is pressed twice:</b> once to start the power meter sweeping, once to strike ' +
             'at whatever it is showing. It is not hold-and-release.',
  opening: 'Press <b>H</b> for the full manual. <b>Space</b> twice \u2014 once to start the meter, ' +
           'once to strike.',
  systems: [
    { title: 'HOW TO TAKE A SHOT',
      body: '<div class="note"><b>1.</b> <b>A</b> and <b>D</b> to aim. The arrow on the ball shows ' +
            'where it will go and the dotted line previews the path.<br>' +
            '<b>2.</b> <b>Tab</b> chooses a ground shot or an air shot; <b>W</b> and <b>S</b> set how ' +
            'much loft an air shot carries.<br>' +
            '<b>3.</b> <b>Space</b> starts the power meter sweeping up and down.<br>' +
            '<b>4.</b> <b>Space</b> again strikes at whatever power the meter is showing.</div>' +
            '<p>If you are not sure where you are pointing, turn the table with <b>Q</b> and <b>E</b> ' +
            'and look again \u2014 it costs nothing.</p>' },
    { title: 'THE PHYSICS IS THE ARGUMENT',
      body: '<p>Keys <b>1</b> to <b>4</b> change the ruleset in the middle of a round, and each one ' +
            'names its source on screen. This is the point of the game rather than a difficulty ' +
            'setting: a physics is a commitment about what the world is like, not a neutral ' +
            'description of it.</p>',
      table: { head: ['key', 'reading', 'how it plays'],
        rows: [
          ['1', 'ARISTOTELIAN', 'heavy gravity, dead bounces, ground that grips. The ball wants to stop.'],
          ['2', 'PARACELSIAN', 'the three principles: livelier, more volatile, harder to settle.'],
          ['3', 'PYTHAGOREAN', 'number and ratio \u2014 motion quantised into clean intervals.'],
          ['4', 'LETTRIST', 'the letters act on the ball. Inscribe one with <b>L</b>.']
        ] } },
    { title: 'THE CUP',
      body: '<p>Bodies do not have to be destroyed in any order, but the LAST one always becomes the ' +
            'cup, so what is left standing at the end decides where you have to finish. Think about ' +
            'which body you want to be the hole before you clear the others.</p>' }
  ]
});

requestAnimationFrame(function (t) { last = t; requestAnimationFrame(frame); });
