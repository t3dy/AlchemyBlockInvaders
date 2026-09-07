// ===================================================================
// CIRCULATIO / physics
//
// Deliberately pure: this module imports nothing, mutates nothing but
// the ball you hand it, and never touches Three.js. Two consequences
// that the rest of the engine leans on hard:
//
//   1. The shot preview runs the REAL simulation on a cloned ball, so
//      the predicted path is the path (see predictPath). No second,
//      approximate "preview physics" to drift out of sync.
//   2. It is testable headlessly at a fixed timestep, which is how the
//      tuning in DESIGN.md was actually measured.
// ===================================================================

export const V = {
  add:   (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub:   (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  mul:   (a, s) => ({ x: a.x * s,   y: a.y * s,   z: a.z * s }),
  dot:   (a, b) => a.x * b.x + a.y * b.y + a.z * b.z,
  len:   (a)    => Math.hypot(a.x, a.y, a.z),
  lenXZ: (a)    => Math.hypot(a.x, a.z),
  norm:  (a)    => { const l = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; },
  clone: (a)    => ({ x: a.x, y: a.y, z: a.z }),
  zero:  ()     => ({ x: 0, y: 0, z: 0 })
};

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------
// Surface materials. A ruleset scales these; a lettrist tile can
// override one outright. Both go through the same lookup.
// ---------------------------------------------------------------
export const MATERIALS = {
  stone:  { friction: 0.30, restitution: 0.42, label: 'Stone' },
  chalk:  { friction: 0.66, restitution: 0.18, label: 'Chalk'  },
  glass:  { friction: 0.04, restitution: 0.58, label: 'Glass'  },
  pitch:  { friction: 0.88, restitution: 0.05, label: 'Pitch'  },
  aether: { friction: 0.02, restitution: 0.94, label: 'Aether' },
  bumper: { friction: 0.10, restitution: 1.30, label: 'Bumper' }
};

export function material(name) { return MATERIALS[name] || MATERIALS.stone; }

// ---------------------------------------------------------------
// Ball
// ---------------------------------------------------------------
export function createBall(pos, r) {
  return {
    pos: V.clone(pos),
    vel: V.zero(),
    spin: 0,            // english: angular velocity about the vertical axis
    r: r || 0.32,
    grounded: false,
    restTimer: 0,
    bounces: 0,
    lastNormal: { x: 0, y: 1, z: 0 },
    lastMat: 'stone'
  };
}

export function cloneBall(b) {
  return {
    pos: V.clone(b.pos), vel: V.clone(b.vel), spin: b.spin, r: b.r,
    grounded: b.grounded, restTimer: b.restTimer, bounces: b.bounces,
    lastNormal: V.clone(b.lastNormal), lastMat: b.lastMat
  };
}

// ---------------------------------------------------------------
// Collider construction
// ---------------------------------------------------------------
export function box(min, max, mat) {
  return { kind: 'box', min: V.clone(min), max: V.clone(max), mat: mat || 'stone' };
}
export function cylinder(cx, cz, r, base, top, mat) {
  return { kind: 'cyl', cx, cz, r, base, top, mat: mat || 'bumper' };
}
// A ramp is a sloped top surface over a footprint. Its low end must sit
// flush with the floor and its high end against a block: the sides and the
// back face are NOT solid (see DESIGN.md, "known limits").
export function ramp(min, max, axis, dir, mat) {
  return { kind: 'ramp', min: V.clone(min), max: V.clone(max), axis, dir, mat: mat || 'stone' };
}

// ---------------------------------------------------------------
// Closest point on each collider to a point
// ---------------------------------------------------------------
function closestOnBox(p, b) {
  return {
    x: clamp(p.x, b.min.x, b.max.x),
    y: clamp(p.y, b.min.y, b.max.y),
    z: clamp(p.z, b.min.z, b.max.z)
  };
}

// When the centre is inside the box there is no closest-point direction to
// use, so leave along the face it is nearest to.
function escapeAxis(p, b) {
  const dx1 = p.x - b.min.x, dx2 = b.max.x - p.x;
  const dy1 = p.y - b.min.y, dy2 = b.max.y - p.y;
  const dz1 = p.z - b.min.z, dz2 = b.max.z - p.z;
  let best = dx1, n = { x: -1, y: 0, z: 0 };
  if (dx2 < best) { best = dx2; n = { x: 1, y: 0, z: 0 }; }
  if (dy1 < best) { best = dy1; n = { x: 0, y: -1, z: 0 }; }
  if (dy2 < best) { best = dy2; n = { x: 0, y: 1, z: 0 }; }
  if (dz1 < best) { best = dz1; n = { x: 0, y: 0, z: -1 }; }
  if (dz2 < best) { best = dz2; n = { x: 0, y: 0, z: 1 }; }
  return { n, pen: best };
}

function closestOnCyl(p, c) {
  const hx = p.x - c.cx, hz = p.z - c.cz;
  const hl = Math.hypot(hx, hz);
  const s = hl > c.r ? c.r / hl : 1;
  return { x: c.cx + hx * s, y: clamp(p.y, c.base, c.top), z: c.cz + hz * s };
}

// Height of a ramp's sloped surface at a given x/z, plus its normal.
export function rampSurface(r, x, z) {
  const lo = r.axis === 'x' ? r.min.x : r.min.z;
  const hi = r.axis === 'x' ? r.max.x : r.max.z;
  const at = r.axis === 'x' ? x : z;
  let t = (at - lo) / Math.max(1e-6, hi - lo);
  t = clamp(t, 0, 1);
  if (r.dir < 0) t = 1 - t;
  const y = r.min.y + (r.max.y - r.min.y) * t;
  const run = Math.max(1e-6, hi - lo);
  const rise = (r.max.y - r.min.y) * (r.dir < 0 ? -1 : 1);
  const s = rise / run;
  const inv = 1 / Math.hypot(s, 1);
  const n = r.axis === 'x' ? { x: -s * inv, y: inv, z: 0 } : { x: 0, y: inv, z: -s * inv };
  return { y, n };
}

function insideFootprint(r, x, z, pad) {
  pad = pad || 0;
  return x >= r.min.x - pad && x <= r.max.x + pad && z >= r.min.z - pad && z <= r.max.z + pad;
}

// ---------------------------------------------------------------
// Effective surface constants: material, scaled by the active ruleset
// ---------------------------------------------------------------
function surfaceOf(collider, rules) {
  const m = material(rules.materialOverride ? rules.materialOverride(collider) : collider.mat);
  let e = m.restitution * rules.restitution;
  const f = clamp(m.friction * rules.friction, 0, 1);
  if (rules.quantize) e = quantizeRatio(e, rules.quantize);
  return { e: e, f: f, name: collider.mat };
}

// The Pythagorean ruleset snaps every bounce to a consonant ratio, so the
// ball's rebound heights walk a scale instead of a smooth decay.
export function quantizeRatio(e, ladder) {
  let best = ladder[0], bd = Infinity;
  for (let i = 0; i < ladder.length; i++) {
    const d = Math.abs(ladder[i] - e);
    if (d < bd) { bd = d; best = ladder[i]; }
  }
  return best;
}

// ---------------------------------------------------------------
// One resolution pass against every collider
// ---------------------------------------------------------------
function resolve(ball, colliders, rules, events) {
  // Accepts either a plain array (headless tests) or a broadphase world
  // exposing query(pos, r) - see course.js buildWorld.
  const list = colliders.query ? colliders.query(ball.pos, ball.r) : colliders;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    let cp = null, n = null, dist = 0;

    if (c.kind === 'box') {
      cp = closestOnBox(ball.pos, c);
      const d = V.sub(ball.pos, cp);
      dist = V.len(d);
      if (dist > ball.r) continue;
      if (dist < 1e-6) { const esc = escapeAxis(ball.pos, c); n = esc.n; dist = 0; }
      else n = V.mul(d, 1 / dist);

    } else if (c.kind === 'cyl') {
      cp = closestOnCyl(ball.pos, c);
      const d = V.sub(ball.pos, cp);
      dist = V.len(d);
      if (dist > ball.r) continue;
      if (dist < 1e-6) {
        const hx = ball.pos.x - c.cx, hz = ball.pos.z - c.cz;
        const hl = Math.hypot(hx, hz) || 1;
        n = { x: hx / hl, y: 0, z: hz / hl };
        dist = 0;
      } else n = V.mul(d, 1 / dist);

    } else if (c.kind === 'ramp') {
      if (!insideFootprint(c, ball.pos.x, ball.pos.z, ball.r * 0.5)) continue;
      const s = rampSurface(c, clamp(ball.pos.x, c.min.x, c.max.x), clamp(ball.pos.z, c.min.z, c.max.z));
      const gap = (ball.pos.y - s.y) * s.n.y;      // perpendicular distance to the slope
      if (gap > ball.r || gap < -ball.r * 3) continue;
      n = s.n;
      dist = gap;
    } else continue;

    const pen = ball.r - dist;
    if (pen <= 0) continue;

    ball.pos = V.add(ball.pos, V.mul(n, pen + 1e-4));

    const vn = V.dot(ball.vel, n);
    if (vn < 0) {
      const surf = surfaceOf(c, rules);
      const normal = V.mul(n, vn);
      const tangent = V.sub(ball.vel, normal);

      // Below a threshold the ball is settling, not bouncing. Killing
      // restitution here is what stops the endless micro-jitter on a floor.
      const impact = (-vn) > rules.settleSpeed;
      const e = impact ? surf.e : 0;

      // Tangential friction belongs to a genuine IMPACT only. A ball resting
      // on a floor re-contacts it every substep; charging it impact friction
      // each time compounds into a ~14%-per-substep tax that stops a
      // full-power shot inside a single tile. Rolling friction (below) is
      // what bleeds a roll - this is what bleeds a strike.
      let tan = impact
        ? V.mul(tangent, 1 - surf.f * (n.y > 0.7 ? 0.35 : 1))
        : tangent;
      if (Math.abs(n.y) < 0.6 && ball.spin !== 0) {
        const side = { x: -n.z, y: 0, z: n.x };
        tan = V.add(tan, V.mul(side, ball.spin * rules.spinBite));
        ball.spin *= 0.45;
      }

      ball.vel = V.add(tan, V.mul(n, -vn * e));
      ball.lastNormal = n;
      ball.lastMat = c.mat;
      ball.lastLetterMat = c.letterMat;

      if (-vn > rules.settleSpeed && events) {
        events.push({ type: 'bounce', mat: c.mat, speed: -vn, pos: V.clone(ball.pos), normal: n });
      }
      if (-vn > rules.settleSpeed) ball.bounces++;
    }

    if (n.y > 0.7) ball.grounded = true;
  }
}

// ---------------------------------------------------------------
// A single fixed substep
// ---------------------------------------------------------------
function substep(ball, colliders, rules, dt, events) {
  ball.grounded = false;

  ball.vel.y -= rules.gravity * dt;

  // Magnus curve from sidespin: omega x v, with omega about the vertical
  if (ball.spin !== 0 && rules.magnus !== 0) {
    const vx = ball.vel.x, vz = ball.vel.z;   // cache: the curve must use one velocity, not a half-updated one
    ball.vel.x += ball.spin * vz * rules.magnus * dt;
    ball.vel.z -= ball.spin * vx * rules.magnus * dt;
    ball.spin *= Math.pow(rules.spinDecay, dt * 60);
  }

  const drag = Math.pow(1 - rules.airDrag, dt * 60);
  ball.vel = V.mul(ball.vel, drag);

  ball.pos = V.add(ball.pos, V.mul(ball.vel, dt));

  resolve(ball, colliders, rules, events);

  // Rolling friction, applied only while actually resting on a surface.
  // Coulomb, not a per-frame percentage: a constant deceleration in
  // units/s^2, scaled by the ruleset's own gravity. This is what makes
  // "how far does a full-power shot roll" a tunable number per
  // metaphysics rather than an accident of the frame rate.
  if (ball.grounded) {
    const surf = material(rules.materialOverride
      ? rules.materialOverride({ mat: ball.lastMat, letterMat: ball.lastLetterMat })
      : ball.lastMat);
    const decel = surf.friction * rules.friction * rules.rollDrag * rules.gravity;
    const sp = Math.hypot(ball.vel.x, ball.vel.z);
    if (sp > 1e-5) {
      const k = Math.max(0, sp - decel * dt) / sp;
      ball.vel.x *= k;
      ball.vel.z *= k;
    }
    if (Math.abs(ball.vel.y) < rules.settleSpeed) ball.vel.y *= 0.4;
  }
}

// ---------------------------------------------------------------
// Public step. Substeps so a fast ball cannot tunnel a thin floor.
// ---------------------------------------------------------------
export function step(ball, colliders, rules, dt, events) {
  const speed = V.len(ball.vel);
  const maxMove = ball.r * 0.35;
  const n = clamp(Math.ceil((speed * dt) / maxMove), 1, 12);
  const h = dt / n;
  for (let i = 0; i < n; i++) substep(ball, colliders, rules, h, events);

  // Coming to rest: slow AND supported, for long enough to be sure
  const sp = V.len(ball.vel);
  if (ball.grounded && sp < rules.stopSpeed) ball.restTimer += dt;
  else ball.restTimer = 0;
  return ball.restTimer > rules.stopTime;
}

// ---------------------------------------------------------------
// Landing preview. Runs the real simulation forward on a copy.
// This is the "landing preview" the lettrist-engine notes ask for:
// what the player sees is what the world will actually do.
// ---------------------------------------------------------------
export function predictPath(ball, colliders, rules, vel, opts) {
  opts = opts || {};
  const maxTime = opts.maxTime || 4.0;
  const dt = opts.dt || 1 / 120;
  const sim = cloneBall(ball);
  sim.vel = V.clone(vel);
  sim.spin = opts.spin || 0;

  const path = [V.clone(sim.pos)];
  const impacts = [];
  const floor = opts.voidY !== undefined ? opts.voidY : -12;
  let t = 0, rest = false;

  while (t < maxTime && !rest) {
    const ev = [];
    rest = step(sim, colliders, rules, dt, ev);
    t += dt;
    for (let i = 0; i < ev.length; i++) impacts.push(ev[i].pos);
    if (path.length === 0 || V.len(V.sub(sim.pos, path[path.length - 1])) > 0.06) {
      path.push(V.clone(sim.pos));
    }
    if (sim.pos.y < floor) break;
    if (path.length > 900) break;
  }
  return { path, impacts, end: V.clone(sim.pos), settled: rest, time: t };
}
